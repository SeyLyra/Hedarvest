const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

// Mock contracts embedded in the test file
const MockHederaTokenService = `
  // SPDX-License-Identifier: MIT
  pragma solidity ^0.8.19;

  interface IHederaTokenService {
      function associateToken(address account, address token) external returns (int);
      function transferToken(address token, address sender, address receiver, int64 amount) external returns (int);
      function mintToken(address token, int64 amount, bytes[] memory metadata) external returns (int, uint64, int32[] memory);
      function burnToken(address token, int64 amount, int64[] memory serialNumbers) external returns (int, uint64);
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
          totalSupply[token] = IERC20(token).totalSupply();
      }

      function associateToken(address account, address token) external override returns (int) {
          require(isToken[token], "Invalid token");
          require(!associated[account][token], "Already associated");
          associated[account][token] = true;
          return SUCCESS;
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
      uint8 public constant decimals = 8; // Mimic HTS token decimals
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
  }
`;

const MockPriceOracle = `
  // SPDX-License-Identifier: MIT
  pragma solidity ^0.8.19;

  contract MockPriceOracle {
      mapping(string => uint256) private prices;

      function setPrice(string memory asset, uint256 price) external {
          prices[asset] = price;
      }

      function getPrice(string memory asset) external view returns (uint256) {
          return prices[asset];
      }
  }
`;

describe("LendingPool", function () {
  let lendingPool, priceOracle, hts, lendingToken, collateralToken, lpToken;
  let owner, borrower, investor, liquidator;
  const assetType = "Rice";
  const baseLTV = 8000; // 80%
  const protocolFee = 1000; // 10%
  const initialPrice = ethers.parseUnits("1", 8); // $1 with 8 decimals
  const PRECISION = ethers.parseUnits("1", 8); // Match token decimals
  const BLOCKS_PER_YEAR = 365 * 24 * 60 * 60 / 3;

  before(async function () {
    // Mock contracts are already defined as strings above
    // They will be compiled when we get the contract factory
  });

  beforeEach(async function () {
    // Get signers
    [owner, borrower, investor, liquidator] = await ethers.getSigners();

    // Deploy mock contracts
    const MockERC20Factory = await ethers.getContractFactory("MockERC20");
    lendingToken = await MockERC20Factory.deploy("Lending Token", "LEND", ethers.parseUnits("1000000", 8));
    collateralToken = await MockERC20Factory.deploy("Collateral Token", "COLL", ethers.parseUnits("1000000", 8));
    lpToken = await MockERC20Factory.deploy("LP Token", "LP", 0);

    const MockHederaTokenServiceFactory = await ethers.getContractFactory("MockHederaTokenService");
    hts = await MockHederaTokenServiceFactory.deploy();
    
    // Set the mock HTS code at the HTS address (0x167) so LendingPool can use it
    const htsCode = await ethers.provider.getCode(await hts.getAddress());
    await ethers.provider.send("hardhat_setCode", ["0x0000000000000000000000000000000000000167", htsCode]);

    const MockPriceOracleFactory = await ethers.getContractFactory("MockPriceOracle");
    priceOracle = await MockPriceOracleFactory.deploy();
    await priceOracle.setPrice(assetType, initialPrice);

    // Deploy LendingPool
    const LendingPoolFactory = await ethers.getContractFactory("LendingPool");
    lendingPool = await LendingPoolFactory.deploy(
      assetType,
      await lendingToken.getAddress(),
      await collateralToken.getAddress(),
      await lpToken.getAddress(),
      baseLTV,
      protocolFee,
      await priceOracle.getAddress(),
      owner.address
    );

    // Get the mock HTS contract at the HTS address
    const htsContract = MockHederaTokenServiceFactory.attach("0x0000000000000000000000000000000000000167");
    
    // Configure HTS
    await htsContract.setToken(await lendingToken.getAddress(), true);
    await htsContract.setToken(await collateralToken.getAddress(), true);
    await htsContract.setToken(await lpToken.getAddress(), true);

    // Associate tokens with users
    await htsContract.associateToken(borrower.address, await lendingToken.getAddress());
    await htsContract.associateToken(borrower.address, await collateralToken.getAddress());
    await htsContract.associateToken(investor.address, await lendingToken.getAddress());
    await htsContract.associateToken(investor.address, await lpToken.getAddress());
    await htsContract.associateToken(liquidator.address, await lendingToken.getAddress());
    await htsContract.associateToken(liquidator.address, await collateralToken.getAddress());
    await htsContract.associateToken(await lendingPool.getAddress(), await lendingToken.getAddress());
    await htsContract.associateToken(await lendingPool.getAddress(), await collateralToken.getAddress());
    await htsContract.associateToken(await lendingPool.getAddress(), await lpToken.getAddress());

    // Mint tokens to users
    await lendingToken.mint(borrower.address, ethers.parseUnits("10000", 8));
    await collateralToken.mint(borrower.address, ethers.parseUnits("10000", 8));
    await lendingToken.mint(investor.address, ethers.parseUnits("10000", 8));
    await lendingToken.mint(liquidator.address, ethers.parseUnits("10000", 8));

    // Approve tokens for HTS contract (at address 0x167) since that's what does the transfers
    await lendingToken.connect(borrower).approve("0x0000000000000000000000000000000000000167", ethers.MaxUint256);
    await collateralToken.connect(borrower).approve("0x0000000000000000000000000000000000000167", ethers.MaxUint256);
    await lendingToken.connect(investor).approve("0x0000000000000000000000000000000000000167", ethers.MaxUint256);
    await lendingToken.connect(liquidator).approve("0x0000000000000000000000000000000000000167", ethers.MaxUint256);
    await lpToken.connect(investor).approve("0x0000000000000000000000000000000000000167", ethers.MaxUint256);
  });

  describe("Deployment", function () {
    it("should initialize with correct parameters", async function () {
      expect(await lendingPool.assetType()).to.equal(assetType);
      expect(await lendingPool.lendingToken()).to.equal(await lendingToken.getAddress());
      expect(await lendingPool.collateralToken()).to.equal(await collateralToken.getAddress());
      expect(await lendingPool.lpToken()).to.equal(await lpToken.getAddress());
      expect(await lendingPool.baseLTV()).to.equal(baseLTV);
      expect(await lendingPool.protocolFee()).to.equal(protocolFee);
      expect(await lendingPool.priceOracle()).to.equal(await priceOracle.getAddress());
      expect(await lendingPool.owner()).to.equal(owner.address);
      const currentBlock = await ethers.provider.getBlockNumber();
      const lastAccrualBlock = await lendingPool.lastAccrualBlock();
      expect(lastAccrualBlock).to.be.closeTo(currentBlock, 1); // Allow for 1 block difference
      expect(await lendingPool.borrowIndex()).to.equal(PRECISION);
    });

    it("should revert if LTV is too high", async function () {
      const LendingPoolFactory = await ethers.getContractFactory("LendingPool");
      await expect(
        LendingPoolFactory.deploy(
          assetType,
          lendingToken.address,
          collateralToken.address,
          lpToken.address,
          10001, // Invalid LTV
          protocolFee,
          priceOracle.address,
          owner.address
        )
      ).to.be.revertedWith("Base LTV too high");
    });

    it("should revert if protocol fee is too high", async function () {
      const LendingPoolFactory = await ethers.getContractFactory("LendingPool");
      await expect(
        LendingPoolFactory.deploy(
          assetType,
          lendingToken.address,
          collateralToken.address,
          lpToken.address,
          baseLTV,
          2001, // Invalid fee
          priceOracle.address,
          owner.address
        )
      ).to.be.revertedWith("Protocol fee too high");
    });

    it("should revert if tokens are not distinct", async function () {
      const LendingPoolFactory = await ethers.getContractFactory("LendingPool");
      await expect(
        LendingPoolFactory.deploy(
          assetType,
          lendingToken.address,
          lendingToken.address, // Same as lendingToken
          lpToken.address,
          baseLTV,
          protocolFee,
          priceOracle.address,
          owner.address
        )
      ).to.be.revertedWith("Lending and collateral tokens must be different");
    });
  });

  describe("Position Management", function () {
    it("should create a new position", async function () {
      const tx = await lendingPool.connect(borrower).createPosition();
      const receipt = await tx.wait();
      const positionId = 0;

      expect(await lendingPool.borrowerPositionCount(borrower.address)).to.equal(1);
      expect((await lendingPool.getPositionIds(borrower.address))[0]).to.equal(positionId);
      const position = await lendingPool.borrowerPositions(borrower.address, positionId);
      expect(position.active).to.be.true;
      expect(position.collateral).to.equal(0);
      expect(position.borrows).to.equal(0);
      expect(position.positionBorrowIndex).to.equal(PRECISION);
      await expect(tx).to.emit(lendingPool, "PositionCreated").withArgs(borrower.address, positionId, receipt.blockTimestamp);
    });

    it("should create multiple positions", async function () {
      await lendingPool.connect(borrower).createPosition();
      await lendingPool.connect(borrower).createPosition();
      expect(await lendingPool.borrowerPositionCount(borrower.address)).to.equal(2);
      const positionIds = await lendingPool.getPositionIds(borrower.address);
      expect(positionIds.length).to.equal(2);
      expect(positionIds[0]).to.equal(0);
      expect(positionIds[1]).to.equal(1);
    });

    it("should close a position with no debt or collateral", async function () {
      await lendingPool.connect(borrower).createPosition();
      const positionId = 0;
      const tx = await lendingPool.connect(borrower).closePosition(positionId);
      const receipt = await tx.wait();

      expect((await lendingPool.borrowerPositions(borrower.address, positionId)).active).to.be.false;
      expect((await lendingPool.getPositionIds(borrower.address)).length).to.equal(0);
      await expect(tx).to.emit(lendingPool, "PositionClosed").withArgs(borrower.address, positionId, receipt.blockTimestamp);
    });

    it("should revert closing a position with debt", async function () {
      await lendingPool.connect(borrower).createPosition();
      const positionId = 0;
      await lendingPool.connect(borrower).depositCollateral(ethers.parseUnits("1000", 8), positionId);
      await lendingPool.connect(investor).deposit(ethers.parseUnits("1000", 8));
      await lendingPool.connect(borrower).createLoan(ethers.parseUnits("800", 8), positionId);
      await expect(lendingPool.connect(borrower).closePosition(positionId)).to.be.revertedWith("Outstanding debt in position");
    });

    it("should revert closing a position with collateral", async function () {
      await lendingPool.connect(borrower).createPosition();
      const positionId = 0;
      await lendingPool.connect(borrower).depositCollateral(ethers.parseUnits("1000", 8), positionId);
      await expect(lendingPool.connect(borrower).closePosition(positionId)).to.be.revertedWith("Collateral must be withdrawn");
    });
  });

  describe("Collateral Operations", function () {
    it("should deposit collateral to a position", async function () {
      await lendingPool.connect(borrower).createPosition();
      const positionId = 0;
      const amount = ethers.parseUnits("1000", 8);
      const tx = await lendingPool.connect(borrower).depositCollateral(amount, positionId);
      const receipt = await tx.wait();

      const position = await lendingPool.borrowerPositions(borrower.address, positionId);
      expect(position.collateral).to.equal(amount);
      expect(await collateralToken.balanceOf(lendingPool.address)).to.equal(amount);
      expect(await collateralToken.balanceOf(borrower.address)).to.equal(ethers.parseUnits("9000", 8));
      await expect(tx).to.emit(lendingPool, "CollateralDeposited").withArgs(
        borrower.address,
        positionId,
        amount,
        amount // USD value = amount * $1
      );
    });

    it("should withdraw collateral from a position", async function () {
      await lendingPool.connect(borrower).createPosition();
      const positionId = 0;
      const depositAmount = ethers.parseUnits("1000", 8);
      const withdrawAmount = ethers.parseUnits("500", 8);
      await lendingPool.connect(borrower).depositCollateral(depositAmount, positionId);
      const tx = await lendingPool.connect(borrower).withdrawCollateral(withdrawAmount, positionId);
      const receipt = await tx.wait();

      const position = await lendingPool.borrowerPositions(borrower.address, positionId);
      expect(position.collateral).to.equal(depositAmount - withdrawAmount);
      expect(await collateralToken.balanceOf(borrower.address)).to.equal(ethers.parseUnits("9500", 8));
      await expect(tx).to.emit(lendingPool, "CollateralWithdrawn").withArgs(
        borrower.address,
        positionId,
        withdrawAmount,
        receipt.blockTimestamp
      );
    });

    it("should revert withdrawing collateral that makes position unhealthy", async function () {
      await lendingPool.connect(borrower).createPosition();
      const positionId = 0;
      await lendingPool.connect(borrower).depositCollateral(ethers.parseUnits("1000", 8), positionId);
      await lendingPool.connect(investor).deposit(ethers.parseUnits("1000", 8));
      await lendingPool.connect(borrower).createLoan(ethers.parseUnits("800", 8), positionId);
      await expect(
        lendingPool.connect(borrower).withdrawCollateral(ethers.parseUnits("500", 8), positionId)
      ).to.be.revertedWith("Withdrawal would make position unhealthy");
    });

    it("should deactivate position when collateral and debt are zero", async function () {
      await lendingPool.connect(borrower).createPosition();
      const positionId = 0;
      await lendingPool.connect(borrower).depositCollateral(ethers.parseUnits("1000", 8), positionId);
      await lendingPool.connect(borrower).withdrawCollateral(ethers.parseUnits("1000", 8), positionId);
      expect((await lendingPool.borrowerPositions(borrower.address, positionId)).active).to.be.false;
      expect((await lendingPool.getPositionIds(borrower.address)).length).to.equal(0);
    });
  });

  describe("Borrowing and Repayment", function () {
    beforeEach(async function () {
      await lendingPool.connect(borrower).createPosition();
      await lendingPool.connect(borrower).depositCollateral(ethers.parseUnits("1000", 8), 0);
      await lendingPool.connect(investor).deposit(ethers.parseUnits("1000", 8));
    });

    it("should create a loan against a position", async function () {
      const positionId = 0;
      const loanAmount = ethers.parseUnits("800", 8); // 80% LTV
      const tx = await lendingPool.connect(borrower).createLoan(loanAmount, positionId);
      const receipt = await tx.wait();

      const position = await lendingPool.borrowerPositions(borrower.address, positionId);
      expect(position.borrows).to.equal(loanAmount);
      expect(position.positionBorrowIndex).to.equal(PRECISION);
      expect(await lendingPool.totalBorrows()).to.equal(loanAmount);
      expect(await lendingPool.totalAssets()).to.equal(ethers.parseUnits("200", 8));
      expect(await lendingToken.balanceOf(borrower.address)).to.equal(ethers.parseUnits("10800", 8));
      await expect(tx).to.emit(lendingPool, "LoanCreated").withArgs(
        borrower.address,
        positionId,
        loanAmount,
        PRECISION
      );
    });

    it("should revert loan exceeding LTV", async function () {
      const positionId = 0;
      await expect(
        lendingPool.connect(borrower).createLoan(ethers.parseUnits("801", 8), positionId)
      ).to.be.revertedWith("Exceeds borrow limit");
    });

    it("should repay a loan", async function () {
      const positionId = 0;
      const loanAmount = ethers.parseUnits("800", 8);
      await lendingPool.connect(borrower).createLoan(loanAmount, positionId);
      const repayAmount = ethers.parseUnits("400", 8);
      const tx = await lendingPool.connect(borrower).repayLoan(repayAmount, positionId);
      const receipt = await tx.wait();

      const position = await lendingPool.borrowerPositions(borrower.address, positionId);
      expect(position.borrows).to.equal(loanAmount - repayAmount);
      expect(await lendingPool.totalBorrows()).to.equal(loanAmount - repayAmount);
      expect(await lendingPool.totalAssets()).to.equal(ethers.parseUnits("600", 8));
      expect(await lendingToken.balanceOf(borrower.address)).to.equal(ethers.parseUnits("10400", 8));
      await expect(tx).to.emit(lendingPool, "LoanRepaid").withArgs(
        borrower.address,
        positionId,
        repayAmount,
        0 // No interest yet
      );
    });

    it("should deactivate position when loan fully repaid and no collateral", async function () {
      const positionId = 0;
      await lendingPool.connect(borrower).createLoan(ethers.parseUnits("800", 8), positionId);
      await lendingPool.connect(borrower).withdrawCollateral(ethers.parseUnits("1000", 8), positionId);
      await lendingPool.connect(borrower).repayLoan(ethers.parseUnits("800", 8), positionId);
      expect((await lendingPool.borrowerPositions(borrower.address, positionId)).active).to.be.false;
      expect((await lendingPool.getPositionIds(borrower.address)).length).to.equal(0);
    });
  });

  describe("Interest Accrual", function () {
    it("should accrue interest correctly", async function () {
      await lendingPool.connect(borrower).createPosition();
      const positionId = 0;
      await lendingPool.connect(borrower).depositCollateral(ethers.parseUnits("1000", 8), positionId);
      await lendingPool.connect(investor).deposit(ethers.parseUnits("1000", 8));
      await lendingPool.connect(borrower).createLoan(ethers.parseUnits("800", 8), positionId);

      // Advance 1 year (BLOCKS_PER_YEAR blocks)
      await time.increase(365 * 24 * 60 * 60);
      await lendingPool.accrueInterest();

      const apr = await lendingPool.currentAPR(); // Base rate (1%) + utilization (80% * 5% / 80%) = 5%
      expect(apr).to.equal(500); // 5%

      const expectedInterest = (ethers.parseUnits("800", 8) * 500n) / 10000n / 1n; // 800 * 5% = 40
      const totalBorrows = await lendingPool.totalBorrows();
      expect(totalBorrows).to.be.closeTo(ethers.parseUnits("840", 8), 1);
      const reserves = await lendingPool.totalReserves();
      expect(reserves).to.be.closeTo(ethers.parseUnits("4", 8), 1); // 10% of 40
    });
  });

  describe("Liquidation", function () {
    it("should liquidate an undercollateralized position", async function () {
      await lendingPool.connect(borrower).createPosition();
      const positionId = 0;
      await lendingPool.connect(borrower).depositCollateral(ethers.parseUnits("1000", 8), positionId);
      await lendingPool.connect(investor).deposit(ethers.parseUnits("1000", 8));
      await lendingPool.connect(borrower).createLoan(ethers.parseUnits("800", 8), positionId);

      // Drop price to make position unhealthy (health factor < 1)
      await priceOracle.setPrice(assetType, ethers.parseUnits("0.5", 8)); // $0.5
      const tx = await lendingPool.connect(liquidator).liquidate(borrower.address, positionId);
      const receipt = await tx.wait();

      const position = await lendingPool.borrowerPositions(borrower.address, positionId);
      expect(position.borrows).to.equal(0);
      expect(position.collateral).to.equal(0);
      expect(position.active).to.be.false;
      expect(await lendingPool.totalBorrows()).to.equal(0);
      expect(await lendingPool.totalAssets()).to.equal(ethers.parseUnits("1800", 8));
      expect(await collateralToken.balanceOf(liquidator.address)).to.equal(ethers.parseUnits("1680", 8)); // 800 * 1.05 / 0.5
      await expect(tx).to.emit(lendingPool, "LoanLiquidated").withArgs(
        borrower.address,
        positionId,
        ethers.parseUnits("800", 8),
        ethers.parseUnits("1680", 8)
      );
    });

    it("should revert liquidation of healthy position", async function () {
      await lendingPool.connect(borrower).createPosition();
      const positionId = 0;
      await lendingPool.connect(borrower).depositCollateral(ethers.parseUnits("1000", 8), positionId);
      await lendingPool.connect(investor).deposit(ethers.parseUnits("1000", 8));
      await lendingPool.connect(borrower).createLoan(ethers.parseUnits("800", 8), positionId);
      await expect(lendingPool.connect(liquidator).liquidate(borrower.address, positionId)).to.be.revertedWith("Position healthy");
    });
  });

  describe("Pool Operations", function () {
    it("should deposit and mint LP tokens", async function () {
      const amount = ethers.parseUnits("1000", 8);
      const tx = await lendingPool.connect(investor).deposit(amount);
      const receipt = await tx.wait();

      expect(await lendingPool.lpShares(investor.address)).to.equal(amount);
      expect(await lendingPool.lpTokenSupply()).to.equal(amount);
      expect(await lendingPool.totalAssets()).to.equal(amount);
      expect(await lendingToken.balanceOf(lendingPool.address)).to.equal(amount);
      expect(await lpToken.balanceOf(investor.address)).to.equal(amount);
      await expect(tx).to.emit(lendingPool, "Deposited").withArgs(investor.address, amount, amount, receipt.blockTimestamp);
    });

    it("should withdraw and burn LP tokens", async function () {
      await lendingPool.connect(investor).deposit(ethers.parseUnits("1000", 8));
      const shares = ethers.parseUnits("500", 8);
      const tx = await lendingPool.connect(investor).withdraw(shares);
      const receipt = await tx.wait();

      expect(await lendingPool.lpShares(investor.address)).to.equal(shares);
      expect(await lendingPool.lpTokenSupply()).to.equal(shares);
      expect(await lendingPool.totalAssets()).to.equal(shares);
      expect(await lendingToken.balanceOf(investor.address)).to.equal(ethers.parseUnits("9500", 8));
      expect(await lpToken.balanceOf(investor.address)).to.equal(shares);
      await expect(tx).to.emit(lendingPool, "Withdrawn").withArgs(investor.address, shares, shares, receipt.blockTimestamp);
    });
  });

  describe("Admin Functions", function () {
    it("should update reserve factor", async function () {
      const newReserveFactor = 2000;
      const tx = await lendingPool.connect(owner).updateReserveFactor(newReserveFactor);
      expect(await lendingPool.reserveFactor()).to.equal(newReserveFactor);
      await expect(tx).to.emit(lendingPool, "ParametersUpdated").withArgs("reserveFactor", 1000, newReserveFactor);
    });

    it("should revert non-owner updates", async function () {
      await expect(lendingPool.connect(borrower).updateReserveFactor(2000)).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("should allow emergency withdrawal", async function () {
      await lendingPool.connect(investor).deposit(ethers.parseUnits("1000", 8));
      await lendingPool.connect(borrower).createPosition();
      await lendingPool.connect(borrower).depositCollateral(ethers.parseUnits("1000", 8), 0);
      await lendingPool.connect(borrower).createLoan(ethers.parseUnits("800", 8), 0);
      await time.increase(365 * 24 * 60 * 60);
      await lendingPool.accrueInterest();

      const reserves = await lendingPool.totalReserves();
      const tx = await lendingPool.connect(owner).emergencyWithdraw(lendingToken.address, reserves);
      expect(await lendingToken.balanceOf(owner.address)).to.equal(reserves);
      expect(await lendingPool.totalReserves()).to.equal(0);
      expect(await lendingPool.totalAssets()).to.equal(ethers.parseUnits("200", 8) - reserves);
    });
  });

  describe("Edge Cases", function () {
    it("should revert operations with zero amount", async function () {
      await lendingPool.connect(borrower).createPosition();
      const positionId = 0;
      await expect(lendingPool.connect(borrower).depositCollateral(0, positionId)).to.be.revertedWith("Amount must be greater than zero");
      await expect(lendingPool.connect(borrower).withdrawCollateral(0, positionId)).to.be.revertedWith("Amount must be greater than zero");
      await expect(lendingPool.connect(borrower).createLoan(0, positionId)).to.be.revertedWith("Amount must be greater than zero");
      await expect(lendingPool.connect(borrower).repayLoan(0, positionId)).to.be.revertedWith("Amount must be greater than zero");
      await expect(lendingPool.connect(investor).deposit(0)).to.be.revertedWith("Amount must be greater than zero");
      await expect(lendingPool.connect(investor).withdraw(0)).to.be.revertedWith("Amount must be greater than zero");
    });

    it("should revert operations when paused", async function () {
      await lendingPool.connect(owner).pause();
      await expect(lendingPool.connect(borrower).createPosition()).to.be.revertedWith("Pausable: paused");
      await expect(lendingPool.connect(borrower).depositCollateral(ethers.parseUnits("1000", 8), 0)).to.be.revertedWith("Pausable: paused");
      await expect(lendingPool.connect(investor).deposit(ethers.parseUnits("1000", 8))).to.be.revertedWith("Pausable: paused");
    });

    it("should revert invalid position operations", async function () {
      await expect(lendingPool.connect(borrower).depositCollateral(ethers.parseUnits("1000", 8), 999)).to.be.revertedWith("Invalid or inactive position");
    });
  });
});