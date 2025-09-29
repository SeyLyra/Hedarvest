import { expect } from "chai";
import { ethers } from "hardhat";

describe("Simple Lending Pool Test", function () {
    // Contract instances
    let lendingFactory;
    let lendingPool;
    let priceOracle;
    
    // Test accounts
    let owner;
    let liquidityProvider;
    let borrower;
    
    // Test parameters
    const ASSET_TYPE = "Wheat";
    const INITIAL_PRICE = ethers.parseEther("200"); // $200 per unit
    const BASE_LTV = 7500; // 75% LTV
    const PROTOCOL_FEE = 1000; // 10%
    
    // Test amounts
    const LP_DEPOSIT = ethers.parseEther("100000"); // $100K
    const BORROWER_COLLATERAL = ethers.parseEther("1000"); // 1000 units wheat
    const BORROWER_LOAN = ethers.parseEther("150000"); // $150K loan

    before(async function () {
        // Get signers
        [owner, liquidityProvider, borrower] = await ethers.getSigners();
        
        console.log("🚀 Setting up Simple Lending Pool Test");
        console.log("📊 Test Parameters:");
        console.log(`   Asset Type: ${ASSET_TYPE}`);
        console.log(`   Initial Price: $${ethers.formatEther(INITIAL_PRICE)}`);
        console.log(`   Base LTV: ${BASE_LTV / 100}%`);
        console.log(`   Protocol Fee: ${PROTOCOL_FEE / 100}%`);
        console.log("");
    });

    describe("Phase 1: Factory Deployment & Pool Creation", function () {
        it("Should deploy LendingFactory successfully", async function () {
            const LendingFactory = await ethers.getContractFactory("LendingFactory");
            lendingFactory = await LendingFactory.deploy();
            await lendingFactory.waitForDeployment();
            
            const factoryAddress = await lendingFactory.getAddress();
            expect(factoryAddress).to.be.properAddress;
            console.log("✅ LendingFactory deployed at:", factoryAddress);
        });

        it("Should create lending pool with different token addresses", async function () {
            // Create mock token addresses for testing
            const mockLendingToken = ethers.Wallet.createRandom().address;
            const mockCollateralToken = ethers.Wallet.createRandom().address;
            const mockLpToken = ethers.Wallet.createRandom().address;
            
            console.log("🔗 Token Addresses:");
            console.log(`   Lending Token: ${mockLendingToken}`);
            console.log(`   Collateral Token: ${mockCollateralToken}`);
            console.log(`   LP Token: ${mockLpToken}`);
            
            const tx = await lendingFactory.connect(owner).createPool(
                ASSET_TYPE,
                mockLendingToken,
                mockCollateralToken,
                mockLpToken,
                BASE_LTV,
                PROTOCOL_FEE,
                INITIAL_PRICE
            );
            
            const receipt = await tx.wait();
            
            // Extract pool and oracle addresses from events
            const poolCreatedEvent = receipt.logs.find(log => {
                try {
                    const parsed = lendingFactory.interface.parseLog(log);
                    return parsed && parsed.name === 'PoolCreated';
                } catch (e) {
                    return false;
                }
            });
            expect(poolCreatedEvent).to.not.be.undefined;
            
            const parsed = lendingFactory.interface.parseLog(poolCreatedEvent);
            const poolAddress = parsed.args.pool;
            const oracleAddress = parsed.args.oracle;
            
            lendingPool = await ethers.getContractAt("LendingPool", poolAddress);
            priceOracle = await ethers.getContractAt("MockPriceOracle", oracleAddress);
            
            console.log("✅ Lending Pool created successfully");
            console.log(`   Pool Address: ${poolAddress}`);
            console.log(`   Oracle Address: ${oracleAddress}`);
            
            // Verify pool configuration
            expect(await lendingPool.assetType()).to.equal(ASSET_TYPE);
            expect(await lendingPool.baseLTV()).to.equal(BASE_LTV);
            expect(await lendingPool.protocolFee()).to.equal(PROTOCOL_FEE);
        });
    });

    describe("Phase 2: Basic Pool Operations", function () {
        it("Should verify initial pool state", async function () {
            const totalAssets = await lendingPool.totalAssets();
            const totalBorrows = await lendingPool.totalBorrows();
            const totalReserves = await lendingPool.totalReserves();
            const availableLiquidity = await lendingPool.availableLiquidity();
            const utilizationRate = await lendingPool.utilizationRate();
            
            console.log("📊 Initial Pool State:");
            console.log(`   Total Assets: $${ethers.formatEther(totalAssets)}`);
            console.log(`   Total Borrows: $${ethers.formatEther(totalBorrows)}`);
            console.log(`   Total Reserves: $${ethers.formatEther(totalReserves)}`);
            console.log(`   Available Liquidity: $${ethers.formatEther(availableLiquidity)}`);
            console.log(`   Utilization Rate: ${utilizationRate / 100}%`);
            
            expect(totalAssets).to.equal(0);
            expect(totalBorrows).to.equal(0);
            expect(totalReserves).to.equal(0);
            expect(availableLiquidity).to.equal(0);
            expect(utilizationRate).to.equal(0);
        });

        it("Should verify price oracle is working", async function () {
            const price = await priceOracle.getPrice(ASSET_TYPE);
            console.log(`💰 Current ${ASSET_TYPE} Price: $${ethers.formatEther(price)}`);
            expect(price).to.equal(INITIAL_PRICE);
        });

        it("Should verify pool parameters", async function () {
            const assetType = await lendingPool.assetType();
            const baseLTV = await lendingPool.baseLTV();
            const protocolFee = await lendingPool.protocolFee();
            const optimalUtilizationRate = await lendingPool.optimalUtilizationRate();
            const baseRate = await lendingPool.baseRate();
            
            console.log("⚙️ Pool Parameters:");
            console.log(`   Asset Type: ${assetType}`);
            console.log(`   Base LTV: ${baseLTV / 100}%`);
            console.log(`   Protocol Fee: ${protocolFee / 100}%`);
            console.log(`   Optimal Utilization: ${optimalUtilizationRate / 100}%`);
            console.log(`   Base Rate: ${baseRate / 100}%`);
            
            expect(assetType).to.equal(ASSET_TYPE);
            expect(baseLTV).to.equal(BASE_LTV);
            expect(protocolFee).to.equal(PROTOCOL_FEE);
        });
    });

    describe("Phase 3: Interest Rate Calculations", function () {
        it("Should calculate borrow APR correctly", async function () {
            const currentAPR = await lendingPool.currentAPR();
            console.log(`📈 Current Borrow APR: ${currentAPR / 100}%`);
            
            // Should be base rate when no utilization
            expect(currentAPR).to.equal(await lendingPool.baseRate());
        });

        it("Should calculate utilization rate correctly", async function () {
            const utilizationRate = await lendingPool.utilizationRate();
            console.log(`📊 Utilization Rate: ${utilizationRate / 100}%`);
            
            // Should be 0 when no borrows
            expect(utilizationRate).to.equal(0);
        });
    });

    describe("Phase 4: Pool Statistics", function () {
        it("Should get factory pool statistics", async function () {
            const factoryStats = await lendingFactory.getPoolStats();
            
            console.log("🏭 Factory Pool Statistics:");
            console.log(`   Number of Pools: ${factoryStats.length}`);
            
            if (factoryStats.length > 0) {
                const poolStats = factoryStats[0];
                console.log(`   Pool 1 (${poolStats.assetType}):`);
                console.log(`     TVL: $${ethers.formatEther(poolStats.totalAssets)}`);
                console.log(`     Borrows: $${ethers.formatEther(poolStats.totalBorrows)}`);
                console.log(`     Utilization: ${poolStats.utilizationRate / 100}%`);
                console.log(`     APR: ${poolStats.currentAPR / 100}%`);
            }
            
            expect(factoryStats.length).to.equal(1);
        });
    });

    describe("Phase 5: Admin Functions", function () {
        it("Should allow owner to update parameters", async function () {
            const newReserveFactor = 1500; // 15%
            const newLiquidationBonus = 800; // 8%
            
            // Update reserve factor
            await lendingPool.connect(owner).updateReserveFactor(newReserveFactor);
            const updatedReserveFactor = await lendingPool.reserveFactor();
            expect(updatedReserveFactor).to.equal(newReserveFactor);
            console.log(`✅ Reserve factor updated to: ${updatedReserveFactor / 100}%`);
            
            // Update liquidation bonus
            await lendingPool.connect(owner).updateLiquidationBonus(newLiquidationBonus);
            const updatedLiquidationBonus = await lendingPool.liquidationBonus();
            expect(updatedLiquidationBonus).to.equal(newLiquidationBonus);
            console.log(`✅ Liquidation bonus updated to: ${updatedLiquidationBonus / 100}%`);
        });

        it("Should allow owner to pause and unpause", async function () {
            // Pause the contract
            await lendingPool.connect(owner).pause();
            const isPaused = await lendingPool.paused();
            expect(isPaused).to.be.true;
            console.log("✅ Pool paused successfully");
            
            // Unpause the contract
            await lendingPool.connect(owner).unpause();
            const isUnpaused = await lendingPool.paused();
            expect(isUnpaused).to.be.false;
            console.log("✅ Pool unpaused successfully");
        });
    });

    after(async function () {
        console.log("\n🎉 Simple Lending Pool Test Complete!");
        console.log("✅ All basic functionality tested successfully:");
        console.log("   • Factory deployment and pool creation");
        console.log("   • Pool parameter verification");
        console.log("   • Interest rate calculations");
        console.log("   • Admin function controls");
        console.log("   • Pool statistics and monitoring");
    });
});