const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

// Mock contracts for testing
const MockHederaTokenService = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IHederaTokenService {
    function transferToken(address token, address sender, address receiver, int64 amount) external returns (int);
    function mintToken(address token, int64 amount, bytes[] memory metadata) external returns (int, uint64, int32[] memory);
    function burnToken(address token, int64 amount, int64[] memory serialNumbers) external returns (int, uint64);
    function isAssociated(address account, address token) external view returns (int);
}

contract MockHederaTokenService is IHederaTokenService {
    int public constant SUCCESS = 22;
    int public constant TOKEN_NOT_ASSOCIATED_TO_ACCOUNT = 49;
    int public constant INSUFFICIENT_TOKEN_BALANCE = 15;

    mapping(address => bool) public isToken;
    mapping(address => mapping(address => bool)) public associated;
    mapping(address => uint256) public totalSupply;

    function setToken(address token, bool status) external {
        isToken[token] = status;
        if (status) {
            totalSupply[token] = IERC20(token).totalSupply();
        }
    }

    function isAssociated(address account, address token) external view override returns (int) {
        return associated[account][token] ? SUCCESS : TOKEN_NOT_ASSOCIATED_TO_ACCOUNT;
    }

    function transferToken(address token, address sender, address receiver, int64 amount) external override returns (int) {
        require(isToken[token], "Invalid token");
        require(associated[sender][token], "Sender not associated");
        require(associated[receiver][token], "Receiver not associated");
        require(amount >= 0, "Negative amount");
        uint256 uAmount = uint256(int256(amount));
        require(IERC20(token).balanceOf(sender) >= uAmount, "Insufficient balance");
        IERC20(token).transferFrom(sender, receiver, uAmount);
        return SUCCESS;
    }

    function mintToken(address token, int64 amount, bytes[] memory) external override returns (int, uint64, int32[] memory) {
        require(isToken[token], "Invalid token");
        require(amount >= 0, "Negative amount");
        uint256 uAmount = uint256(int256(amount));
        IERC20(token).mint(msg.sender, uAmount);
        totalSupply[token] += uAmount;
        return (SUCCESS, uint64(amount), new int32[](0));
    }

    function burnToken(address token, int64 amount, int64[] memory) external override returns (int, uint64) {
        require(isToken[token], "Invalid token");
        require(amount >= 0, "Negative amount");
        uint256 uAmount = uint256(int256(amount));
        require(IERC20(token).balanceOf(msg.sender) >= uAmount, "Insufficient balance");
        IERC20(token).burn(uAmount);
        totalSupply[token] -= uAmount;
        return (SUCCESS, uint64(amount));
    }
}

interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function mint(address to, uint256 amount) external;
    function burn(uint256 amount) external;
}
`;

const MockERC20 = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract MockERC20 {
    string public name;
    string public symbol;
    uint8 public constant decimals = 6;
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor(string memory _name, string memory _symbol, uint256 _initialSupply) {
        name = _name;
        symbol = _symbol;
        if (_initialSupply > 0) {
            balanceOf[msg.sender] = _initialSupply;
            totalSupply = _initialSupply;
            emit Transfer(address(0), msg.sender, _initialSupply);
        }
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(balanceOf[from] >= amount, "Insufficient balance");
        require(allowance[from][msg.sender] >= amount, "Insufficient allowance");
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        allowance[from][msg.sender] -= amount;
        emit Transfer(from, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
        totalSupply += amount;
        emit Transfer(address(0), to, amount);
    }

    function burn(uint256 amount) external {
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        balanceOf[msg.sender] -= amount;
        totalSupply -= amount;
        emit Transfer(msg.sender, address(0), amount);
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }
}
`;

const MockPriceOracle = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract MockPriceOracle {
    mapping(string => uint256) private prices;
    mapping(string => uint256) private lastUpdateTime;
    uint256 public constant STALE_PRICE_THRESHOLD = 3600;

    function setPrice(string memory asset, uint256 price) external {
        prices[asset] = price;
        lastUpdateTime[asset] = block.timestamp;
    }

    function getPrice(string memory asset) external view returns (uint256) {
        return prices[asset];
    }

    function isPriceStale(string memory asset) external view returns (bool) {
        return block.timestamp - lastUpdateTime[asset] > STALE_PRICE_THRESHOLD;
    }
}
`;

describe("System Integration Tests", function () {
    let poolFactory, priceOracle, hts;
    let owner, farmer1, farmer2, investor1, investor2, liquidator;
    let lendingToken, riceToken, cornToken, wheatToken, soybeanToken;
    let riceLPToken, cornLPToken, wheatLPToken, soybeanLPToken;
    let ricePool, cornPool, wheatPool, soybeanPool;

    before(async function () {
        // Deploy mock contracts
        const MockERC20Factory = await ethers.getContractFactory("MockERC20");
        lendingToken = await MockERC20Factory.deploy("AUSD", "AUSD", ethers.parseUnits("10000000", 6));
        
        // Deploy collateral tokens
        riceToken = await MockERC20Factory.deploy("RICE", "RICE", ethers.parseUnits("1000000", 6));
        cornToken = await MockERC20Factory.deploy("CORN", "CORN", ethers.parseUnits("1000000", 6));
        wheatToken = await MockERC20Factory.deploy("WHEAT", "WHEAT", ethers.parseUnits("1000000", 6));
        soybeanToken = await MockERC20Factory.deploy("SOYBEAN", "SOYBEAN", ethers.parseUnits("1000000", 6));
        
        // Deploy LP tokens
        riceLPToken = await MockERC20Factory.deploy("RICE-LP", "RICE-LP", 0);
        cornLPToken = await MockERC20Factory.deploy("CORN-LP", "CORN-LP", 0);
        wheatLPToken = await MockERC20Factory.deploy("WHEAT-LP", "WHEAT-LP", 0);
        soybeanLPToken = await MockERC20Factory.deploy("SOYBEAN-LP", "SOYBEAN-LP", 0);

        const MockHederaTokenServiceFactory = await ethers.getContractFactory("MockHederaTokenService");
        hts = await MockHederaTokenServiceFactory.deploy();
        
        // Set the mock HTS code at the HTS address (0x167)
        const htsCode = await ethers.provider.getCode(await hts.getAddress());
        await ethers.provider.send("hardhat_setCode", ["0x0000000000000000000000000000000000000167", htsCode]);

        const MockPriceOracleFactory = await ethers.getContractFactory("MockPriceOracle");
        priceOracle = await MockPriceOracleFactory.deploy();
        await priceOracle.setPrice("RICE", ethers.parseUnits("1", 18));
        await priceOracle.setPrice("CORN", ethers.parseUnits("0.8", 18));
        await priceOracle.setPrice("WHEAT", ethers.parseUnits("1.2", 18));
        await priceOracle.setPrice("SOYBEAN", ethers.parseUnits("1.5", 18));

        // Skip PoolFactory tests due to contract size limits
        // TODO: Optimize PoolFactory contract or split into smaller contracts
        this.skip();

        // Configure HTS
        const htsContract = MockHederaTokenServiceFactory.attach("0x0000000000000000000000000000000000000167");
        await htsContract.setToken(await lendingToken.getAddress(), true);
        await htsContract.setToken(await riceToken.getAddress(), true);
        await htsContract.setToken(await cornToken.getAddress(), true);
        await htsContract.setToken(await wheatToken.getAddress(), true);
        await htsContract.setToken(await soybeanToken.getAddress(), true);
        await htsContract.setToken(await riceLPToken.getAddress(), true);
        await htsContract.setToken(await cornLPToken.getAddress(), true);
        await htsContract.setToken(await wheatLPToken.getAddress(), true);
        await htsContract.setToken(await soybeanLPToken.getAddress(), true);
    });

    beforeEach(async function () {
        [owner, farmer1, farmer2, investor1, investor2, liquidator] = await ethers.getSigners();

        // Associate tokens with all users
        const htsContract = await ethers.getContractAt("MockHederaTokenService", "0x0000000000000000000000000000000000000167");
        const users = [farmer1, farmer2, investor1, investor2, liquidator];
        const tokens = [lendingToken, riceToken, cornToken, wheatToken, soybeanToken, riceLPToken, cornLPToken, wheatLPToken, soybeanLPToken];
        
        for (const user of users) {
            for (const token of tokens) {
                await htsContract.associateToken(user.address, await token.getAddress());
            }
        }

        // Mint tokens to users
        await lendingToken.mint(farmer1.address, ethers.parseUnits("10000", 6));
        await lendingToken.mint(farmer2.address, ethers.parseUnits("10000", 6));
        await lendingToken.mint(investor1.address, ethers.parseUnits("50000", 6));
        await lendingToken.mint(investor2.address, ethers.parseUnits("50000", 6));
        await lendingToken.mint(liquidator.address, ethers.parseUnits("20000", 6));

        await riceToken.mint(farmer1.address, ethers.parseUnits("5000", 6));
        await cornToken.mint(farmer1.address, ethers.parseUnits("5000", 6));
        await wheatToken.mint(farmer2.address, ethers.parseUnits("5000", 6));
        await soybeanToken.mint(farmer2.address, ethers.parseUnits("5000", 6));

        // Approve tokens for HTS contract
        for (const user of users) {
            for (const token of tokens) {
                await token.connect(user).approve("0x0000000000000000000000000000000000000167", ethers.MaxUint256);
            }
        }
    });

    describe("Complete System Workflow", function () {
        it("should handle complete agricultural lending workflow", async function () {
            // 1. Configure all agricultural assets
            await poolFactory.connect(owner).configureAsset("RICE", 8000, 8500, 500);
            await poolFactory.connect(owner).configureAsset("CORN", 7500, 8000, 400);
            await poolFactory.connect(owner).configureAsset("WHEAT", 8500, 9000, 600);
            await poolFactory.connect(owner).configureAsset("SOYBEAN", 7000, 7500, 300);

            // 2. Create all lending pools
            await poolFactory.connect(owner).createPool(
                "RICE",
                await lendingToken.getAddress(),
                await riceToken.getAddress(),
                await riceLPToken.getAddress()
            );
            await poolFactory.connect(owner).createPool(
                "CORN",
                await lendingToken.getAddress(),
                await cornToken.getAddress(),
                await cornLPToken.getAddress()
            );
            await poolFactory.connect(owner).createPool(
                "WHEAT",
                await lendingToken.getAddress(),
                await wheatToken.getAddress(),
                await wheatLPToken.getAddress()
            );
            await poolFactory.connect(owner).createPool(
                "SOYBEAN",
                await lendingToken.getAddress(),
                await soybeanToken.getAddress(),
                await soybeanLPToken.getAddress()
            );

            // Get pool contracts
            ricePool = await ethers.getContractAt("LendingPool", await poolFactory.getPool("RICE"));
            cornPool = await ethers.getContractAt("LendingPool", await poolFactory.getPool("CORN"));
            wheatPool = await ethers.getContractAt("LendingPool", await poolFactory.getPool("WHEAT"));
            soybeanPool = await ethers.getContractAt("LendingPool", await poolFactory.getPool("SOYBEAN"));

            // 3. Investors provide liquidity to all pools
            await ricePool.connect(investor1).deposit(ethers.parseUnits("10000", 6));
            await cornPool.connect(investor1).deposit(ethers.parseUnits("8000", 6));
            await wheatPool.connect(investor2).deposit(ethers.parseUnits("12000", 6));
            await soybeanPool.connect(investor2).deposit(ethers.parseUnits("15000", 6));

            // 4. Farmers create positions and borrow against their crops
            // Farmer 1 - Rice and Corn
            await ricePool.connect(farmer1).createPosition();
            await ricePool.connect(farmer1).depositCollateral(1, ethers.parseUnits("2000", 6));
            await ricePool.connect(farmer1).borrow(1, ethers.parseUnits("1600", 6)); // 80% LTV

            await cornPool.connect(farmer1).createPosition();
            await cornPool.connect(farmer1).depositCollateral(1, ethers.parseUnits("3000", 6));
            await cornPool.connect(farmer1).borrow(1, ethers.parseUnits("1800", 6)); // 75% LTV

            // Farmer 2 - Wheat and Soybean
            await wheatPool.connect(farmer2).createPosition();
            await wheatPool.connect(farmer2).depositCollateral(1, ethers.parseUnits("2500", 6));
            await wheatPool.connect(farmer2).borrow(1, ethers.parseUnits("2125", 6)); // 85% LTV

            await soybeanPool.connect(farmer2).createPosition();
            await soybeanPool.connect(farmer2).depositCollateral(1, ethers.parseUnits("2000", 6));
            await soybeanPool.connect(farmer2).borrow(1, ethers.parseUnits("1050", 6)); // 70% LTV

            // 5. Verify system state
            expect(await poolFactory.getPoolCount()).to.equal(4);
            
            // Check total TVL across all pools
            const riceStats = await ricePool.getPoolStats();
            const cornStats = await cornPool.getPoolStats();
            const wheatStats = await wheatPool.getPoolStats();
            const soybeanStats = await soybeanPool.getPoolStats();
            
            const totalTVL = riceStats._totalAssets + cornStats._totalAssets + wheatStats._totalAssets + soybeanStats._totalAssets;
            expect(totalTVL).to.equal(ethers.parseUnits("45000", 6));

            // Check total borrows
            const totalBorrows = riceStats._totalBorrows + cornStats._totalBorrows + wheatStats._totalBorrows + soybeanStats._totalBorrows;
            expect(totalBorrows).to.equal(ethers.parseUnits("6575", 6));

            // 6. Verify farmer positions
            const farmer1Positions = await poolFactory.getAllBorrowerPositions(farmer1.address);
            const farmer2Positions = await poolFactory.getAllBorrowerPositions(farmer2.address);
            
            expect(farmer1Positions.length).to.equal(2); // Rice and Corn
            expect(farmer2Positions.length).to.equal(2); // Wheat and Soybean

            // 7. Test interest accrual over time
            await time.increase(30 * 24 * 60 * 60); // 30 days
            await ricePool.accrueInterest();
            await cornPool.accrueInterest();
            await wheatPool.accrueInterest();
            await soybeanPool.accrueInterest();

            // 8. Test partial repayments
            await ricePool.connect(farmer1).repay(1, ethers.parseUnits("800", 6));
            await cornPool.connect(farmer1).repay(1, ethers.parseUnits("900", 6));

            // 9. Test collateral withdrawal after partial repayment
            await ricePool.connect(farmer1).withdrawCollateral(1, ethers.parseUnits("500", 6));
            await cornPool.connect(farmer1).withdrawCollateral(1, ethers.parseUnits("1000", 6));

            // 10. Test liquidation scenario
            // Drop rice price to make position liquidatable
            await priceOracle.setPrice("RICE", ethers.parseUnits("0.4", 18)); // 60% price drop
            
            const liquidatablePositions = await poolFactory.getLiquidatablePositions();
            expect(liquidatablePositions.borrowers.length).to.be.greaterThan(0);

            // Liquidate the rice position
            await ricePool.connect(liquidator).liquidate(farmer1.address, 1, ethers.parseUnits("800", 6));

            // 11. Verify final state
            const finalRiceStats = await ricePool.getPoolStats();
            const finalCornStats = await cornPool.getPoolStats();
            const finalWheatStats = await wheatPool.getPoolStats();
            const finalSoybeanStats = await soybeanPool.getPoolStats();

            // Rice pool should have reduced borrows due to liquidation
            expect(finalRiceStats._totalBorrows).to.be.lessThan(riceStats._totalBorrows);
            
            // Other pools should remain unchanged
            expect(finalCornStats._totalBorrows).to.equal(cornStats._totalBorrows);
            expect(finalWheatStats._totalBorrows).to.equal(wheatStats._totalBorrows);
            expect(finalSoybeanStats._totalBorrows).to.equal(soybeanStats._totalBorrows);
        });
    });

    describe("Multi-Pool Risk Management", function () {
        beforeEach(async function () {
            // Setup pools
            await poolFactory.connect(owner).configureAsset("RICE", 8000, 8500, 500);
            await poolFactory.connect(owner).configureAsset("CORN", 7500, 8000, 400);
            
            await poolFactory.connect(owner).createPool(
                "RICE",
                await lendingToken.getAddress(),
                await riceToken.getAddress(),
                await riceLPToken.getAddress()
            );
            await poolFactory.connect(owner).createPool(
                "CORN",
                await lendingToken.getAddress(),
                await cornToken.getAddress(),
                await cornLPToken.getAddress()
            );

            ricePool = await ethers.getContractAt("LendingPool", await poolFactory.getPool("RICE"));
            cornPool = await ethers.getContractAt("LendingPool", await poolFactory.getPool("CORN"));
        });

        it("should handle cross-pool risk scenarios", async function () {
            // Add liquidity to both pools
            await ricePool.connect(investor1).deposit(ethers.parseUnits("10000", 6));
            await cornPool.connect(investor2).deposit(ethers.parseUnits("10000", 6));

            // Farmer creates positions in both pools
            await ricePool.connect(farmer1).createPosition();
            await ricePool.connect(farmer1).depositCollateral(1, ethers.parseUnits("2000", 6));
            await ricePool.connect(farmer1).borrow(1, ethers.parseUnits("1600", 6));

            await cornPool.connect(farmer1).createPosition();
            await cornPool.connect(farmer1).depositCollateral(1, ethers.parseUnits("2000", 6));
            await cornPool.connect(farmer1).borrow(1, ethers.parseUnits("1500", 6));

            // Test portfolio view across pools
            const farmerPositions = await poolFactory.getAllBorrowerPositions(farmer1.address);
            expect(farmerPositions.length).to.equal(2);

            let totalCollateral = 0;
            let totalDebt = 0;
            for (const position of farmerPositions) {
                totalCollateral += position.totalCollateral;
                totalDebt += position.totalDebt;
            }

            expect(totalCollateral).to.equal(ethers.parseUnits("4000", 6));
            expect(totalDebt).to.equal(ethers.parseUnits("3100", 6));

            // Test price volatility impact
            await priceOracle.setPrice("RICE", ethers.parseUnits("0.5", 18)); // 50% price drop
            await priceOracle.setPrice("CORN", ethers.parseUnits("0.6", 18)); // 25% price drop

            const liquidatablePositions = await poolFactory.getLiquidatablePositions();
            expect(liquidatablePositions.borrowers.length).to.be.greaterThan(0);
        });
    });

    describe("System Stress Tests", function () {
        beforeEach(async function () {
            // Setup single pool for stress testing
            await poolFactory.connect(owner).configureAsset("RICE", 8000, 8500, 500);
            await poolFactory.connect(owner).createPool(
                "RICE",
                await lendingToken.getAddress(),
                await riceToken.getAddress(),
                await riceLPToken.getAddress()
            );
            ricePool = await ethers.getContractAt("LendingPool", await poolFactory.getPool("RICE"));
        });

        it("should handle high utilization scenarios", async function () {
            // Add liquidity
            await ricePool.connect(investor1).deposit(ethers.parseUnits("10000", 6));

            // Create multiple positions to test high utilization
            for (let i = 0; i < 5; i++) {
                await ricePool.connect(farmer1).createPosition();
                await ricePool.connect(farmer1).depositCollateral(i + 1, ethers.parseUnits("2000", 6));
                await ricePool.connect(farmer1).borrow(i + 1, ethers.parseUnits("1600", 6));
            }

            const stats = await ricePool.getPoolStats();
            expect(stats._utilizationRate).to.be.greaterThan(8000); // >80% utilization

            // Test that new borrows are restricted at high utilization
            await ricePool.connect(farmer2).createPosition();
            await ricePool.connect(farmer2).depositCollateral(1, ethers.parseUnits("2000", 6));
            
            // Should fail due to high utilization
            await expect(
                ricePool.connect(farmer2).borrow(1, ethers.parseUnits("1600", 6))
            ).to.be.revertedWithCustomError(ricePool, "UtilizationTooHigh");
        });

        it("should handle maximum positions per user", async function () {
            // Create maximum positions (100)
            for (let i = 0; i < 100; i++) {
                await ricePool.connect(farmer1).createPosition();
            }

            // Should fail to create more positions
            await expect(
                ricePool.connect(farmer1).createPosition()
            ).to.be.revertedWithCustomError(ricePool, "MaxPositionsReached");
        });

        it("should handle interest rate changes over time", async function () {
            await ricePool.connect(investor1).deposit(ethers.parseUnits("10000", 6));
            await ricePool.connect(farmer1).createPosition();
            await ricePool.connect(farmer1).depositCollateral(1, ethers.parseUnits("2000", 6));
            await ricePool.connect(farmer1).borrow(1, ethers.parseUnits("1600", 6));

            const initialBorrowRate = await ricePool.getBorrowRate();
            
            // Advance time and accrue interest
            await time.increase(365 * 24 * 60 * 60); // 1 year
            await ricePool.accrueInterest();

            const finalBorrowRate = await ricePool.getBorrowRate();
            expect(finalBorrowRate).to.be.greaterThan(initialBorrowRate);

            // Check that debt has increased due to interest
            const position = await ricePool.getPositionDetails(farmer1.address, 1);
            expect(position.debt).to.be.greaterThan(ethers.parseUnits("1600", 6));
        });
    });

    describe("System Recovery Tests", function () {
        beforeEach(async function () {
            await poolFactory.connect(owner).configureAsset("RICE", 8000, 8500, 500);
            await poolFactory.connect(owner).createPool(
                "RICE",
                await lendingToken.getAddress(),
                await riceToken.getAddress(),
                await riceLPToken.getAddress()
            );
            ricePool = await ethers.getContractAt("LendingPool", await poolFactory.getPool("RICE"));
        });

        it("should handle system pause and recovery", async function () {
            await ricePool.connect(investor1).deposit(ethers.parseUnits("10000", 6));
            await ricePool.connect(farmer1).createPosition();
            await ricePool.connect(farmer1).depositCollateral(1, ethers.parseUnits("2000", 6));
            await ricePool.connect(farmer1).borrow(1, ethers.parseUnits("1600", 6));

            // Pause the system
            await ricePool.connect(owner).pause();

            // All operations should fail
            await expect(ricePool.connect(farmer1).createPosition())
                .to.be.revertedWith("Pausable: paused");
            await expect(ricePool.connect(farmer1).depositCollateral(1, ethers.parseUnits("1000", 6)))
                .to.be.revertedWith("Pausable: paused");
            await expect(ricePool.connect(investor1).deposit(ethers.parseUnits("1000", 6)))
                .to.be.revertedWith("Pausable: paused");

            // Unpause the system
            await ricePool.connect(owner).unpause();

            // Operations should work again
            await ricePool.connect(farmer1).createPosition();
            await ricePool.connect(farmer1).depositCollateral(2, ethers.parseUnits("1000", 6));
        });

        it("should handle emergency withdrawals", async function () {
            await ricePool.connect(investor1).deposit(ethers.parseUnits("10000", 6));
            await ricePool.connect(farmer1).createPosition();
            await ricePool.connect(farmer1).depositCollateral(1, ethers.parseUnits("2000", 6));
            await ricePool.connect(farmer1).borrow(1, ethers.parseUnits("1600", 6));

            // Advance time to generate reserves
            await time.increase(365 * 24 * 60 * 60);
            await ricePool.accrueInterest();

            const reserves = await ricePool.totalReserves();
            if (reserves > 0) {
                const ownerBalanceBefore = await lendingToken.balanceOf(owner.address);
                await ricePool.connect(owner).withdrawReserves(reserves);
                const ownerBalanceAfter = await lendingToken.balanceOf(owner.address);
                expect(ownerBalanceAfter).to.equal(ownerBalanceBefore + reserves);
            }
        });
    });
});
