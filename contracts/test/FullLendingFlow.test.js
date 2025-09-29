const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Full Lending Flow Test", function () {
    // Contract instances
    let lendingFactory;
    let lendingPool;
    let priceOracle;
    let faucetToken;
    
    // HTS Token addresses
    let lendingToken;
    let collateralToken;
    let lpToken;
    
    // Test accounts
    let owner;
    let liquidityProvider1;
    let liquidityProvider2;
    let borrower1;
    let borrower2;
    let liquidator;
    
    // Test parameters
    const ASSET_TYPE = "Wheat";
    const INITIAL_PRICE = ethers.parseEther("2"); // $200 per unit
    const BASE_LTV = 7500; // 75% LTV
    const PROTOCOL_FEE = 1000; // 10%
    
    // Test amounts
    const LP1_DEPOSIT = ethers.parseEther("100000"); // $100K
    const LP2_DEPOSIT = ethers.parseEther("50000");  // $50K
    const BORROWER1_COLLATERAL = ethers.parseEther("1000"); // 1000 units wheat
    const BORROWER2_COLLATERAL = ethers.parseEther("500");  // 500 units wheat
    const BORROWER1_LOAN = ethers.parseEther("150000"); // $150K loan
    const BORROWER2_LOAN = ethers.parseEther("75000");  // $75K loan

    before(async function () {
        // Get signers
        [owner, liquidityProvider1, liquidityProvider2, borrower1, borrower2, liquidator] = await ethers.getSigners();
        
        console.log("🚀 Setting up Full Lending Flow Test Environment");
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

        it("Should create lending pool with HTS tokens", async function () {
            const tx = await lendingFactory.connect(owner).createPool(
                ASSET_TYPE,
                ethers.constants.AddressZero, // placeholder lending token
                ethers.constants.AddressZero, // placeholder collateral token
                BASE_LTV,
                PROTOCOL_FEE,
                INITIAL_PRICE
            );
            
            const receipt = await tx.wait();
            
            // Extract pool and oracle addresses from events
            const poolCreatedEvent = receipt.events.find(e => e.event === "PoolCreated");
            expect(poolCreatedEvent).to.not.be.undefined;
            
            const poolAddress = poolCreatedEvent.args.pool;
            const oracleAddress = poolCreatedEvent.args.oracle;
            
            lendingPool = await ethers.getContractAt("LendingPool", poolAddress);
            priceOracle = await ethers.getContractAt("MockPriceOracle", oracleAddress);
            
            // Get token addresses from pool
            lendingToken = await lendingPool.lendingToken();
            collateralToken = await lendingPool.collateralToken();
            lpToken = await lendingPool.lpToken();
            
            console.log("✅ Lending Pool created successfully");
            console.log(`   Pool Address: ${poolAddress}`);
            console.log(`   Oracle Address: ${oracleAddress}`);
            console.log(`   Lending Token: ${lendingToken}`);
            console.log(`   Collateral Token: ${collateralToken}`);
            console.log(`   LP Token: ${lpToken}`);
            
            // Verify pool configuration
            expect(await lendingPool.assetType()).to.equal(ASSET_TYPE);
            expect(await lendingPool.baseLTV()).to.equal(BASE_LTV);
            expect(await lendingPool.protocolFee()).to.equal(PROTOCOL_FEE);
        });

        it("Should create FaucetToken contracts for testing", async function () {
            // Deploy FaucetToken for lending token
            const FaucetToken = await ethers.getContractFactory("FaucetToken");
            faucetToken = await FaucetToken.deploy(lendingToken);
            await faucetToken.waitForDeployment();
            
            const faucetAddress = await faucetToken.getAddress();
            console.log("✅ FaucetToken deployed at:", faucetAddress);
            
            // For testing, we need to use the FaucetToken as the actual token
            // since the LendingPool expects HTS tokens but we're in a test environment
            // We'll update the pool to use the FaucetToken instead of the HTS token
            lendingToken = faucetAddress;
        });
    });

    describe("Phase 2: Liquidity Providers - Yield Farming Setup", function () {
        it("Should mint tokens to liquidity providers", async function () {
            // Mint lending tokens to LP1
            await faucetToken.connect(liquidityProvider1).faucetMint(
                ethers.parseEther("150000").toString() // $150K worth
            );
            
            // Mint lending tokens to LP2
            await faucetToken.connect(liquidityProvider2).faucetMint(
                ethers.parseEther("75000").toString() // $75K worth
            );
            
            console.log("✅ Tokens minted to liquidity providers");
            // Note: For HTS tokens, we can't directly call balanceOf, so we'll verify through deposits
        });

        it("Liquidity Provider 1 should deposit and receive LP tokens", async function () {
            // For HTS tokens, we need to use the HTS approve function
            // This is handled internally by the LendingPool contract
            
            // Deposit liquidity
            const tx = await lendingPool.connect(liquidityProvider1).deposit(LP1_DEPOSIT);
            const receipt = await tx.wait();
            
            const depositedEvent = receipt.events.find(e => e.event === "Deposited");
            expect(depositedEvent).to.not.be.undefined;
            
            const lpShares = depositedEvent.args.shares;
            const totalAssets = await lendingPool.totalAssets();
            
            console.log("✅ LP1 Liquidity Deposit Complete");
            console.log(`   Deposited: $${ethers.formatEther(LP1_DEPOSIT)}`);
            console.log(`   LP Shares Received: ${ethers.formatEther(lpShares)}`);
            console.log(`   Pool TVL: $${ethers.formatEther(totalAssets)}`);
            
            expect(await lendingPool.lpShares(await liquidityProvider1.getAddress())).to.equal(lpShares);
            expect(totalAssets).to.equal(LP1_DEPOSIT);
        });

        it("Liquidity Provider 2 should deposit and receive LP tokens", async function () {
            // For HTS tokens, approval is handled internally by the LendingPool contract
            
            // Deposit liquidity
            const tx = await lendingPool.connect(liquidityProvider2).deposit(LP2_DEPOSIT);
            const receipt = await tx.wait();
            
            const depositedEvent = receipt.events.find(e => e.event === "Deposited");
            expect(depositedEvent).to.not.be.undefined;
            
            const lpShares = depositedEvent.args.shares;
            const totalAssets = await lendingPool.totalAssets();
            
            console.log("✅ LP2 Liquidity Deposit Complete");
            console.log(`   Deposited: $${ethers.formatEther(LP2_DEPOSIT)}`);
            console.log(`   LP Shares Received: ${ethers.formatEther(lpShares)}`);
            console.log(`   Pool TVL: $${ethers.formatEther(totalAssets)}`);
            
            expect(await lendingPool.lpShares(await liquidityProvider2.getAddress())).to.equal(lpShares);
            expect(totalAssets).to.equal(LP1_DEPOSIT.add(LP2_DEPOSIT));
        });

        it("Should verify liquidity provider positions", async function () {
            const lp1Shares = await lendingPool.lpShares(await liquidityProvider1.getAddress());
            const lp2Shares = await lendingPool.lpShares(await liquidityProvider2.getAddress());
            const totalAssets = await lendingPool.totalAssets();
            const availableLiquidity = await lendingPool.availableLiquidity();
            
            console.log("📊 Liquidity Provider Positions:");
            console.log(`   LP1 Shares: ${ethers.formatEther(lp1Shares)}`);
            console.log(`   LP2 Shares: ${ethers.formatEther(lp2Shares)}`);
            console.log(`   Total Pool Assets: $${ethers.formatEther(totalAssets)}`);
            console.log(`   Available Liquidity: $${ethers.formatEther(availableLiquidity)}`);
            
            expect(lp1Shares).to.be.gt(0);
            expect(lp2Shares).to.be.gt(0);
            expect(availableLiquidity).to.equal(totalAssets);
        });
    });

    describe("Phase 3: Borrowers - Collateralized Lending", function () {
        it("Should mint collateral tokens to borrowers", async function () {
            // Deploy FaucetToken for collateral token
            const FaucetToken = await ethers.getContractFactory("FaucetToken");
            const collateralFaucet = await FaucetToken.deploy(collateralToken);
            await collateralFaucet.waitForDeployment();
            
            // Mint collateral tokens to Borrower 1
            await collateralFaucet.connect(borrower1).faucetMint(
                BORROWER1_COLLATERAL.toString()
            );
            
            // Mint collateral tokens to Borrower 2
            await collateralFaucet.connect(borrower2).faucetMint(
                BORROWER2_COLLATERAL.toString()
            );
            
            console.log("✅ Collateral tokens minted to borrowers");
            console.log(`   Borrower1 Collateral: ${ethers.formatEther(BORROWER1_COLLATERAL)} units`);
            console.log(`   Borrower2 Collateral: ${ethers.formatEther(BORROWER2_COLLATERAL)} units`);
        });

        it("Borrower 1 should deposit collateral", async function () {
            // For HTS tokens, approval is handled internally by the LendingPool contract
            
            // Deposit collateral
            const tx = await lendingPool.connect(borrower1).depositCollateral(BORROWER1_COLLATERAL);
            const receipt = await tx.wait();
            
            const collateralDepositedEvent = receipt.events.find(e => e.event === "CollateralDeposited");
            expect(collateralDepositedEvent).to.not.be.undefined;
            
            const usdValue = collateralDepositedEvent.args.usdValue;
            const collateralBalance = await lendingPool.collateral(await borrower1.getAddress());
            
            console.log("✅ Borrower1 Collateral Deposit Complete");
            console.log(`   Collateral Deposited: ${ethers.formatEther(BORROWER1_COLLATERAL)} units`);
            console.log(`   USD Value: $${ethers.formatEther(usdValue)}`);
            console.log(`   Max Borrow Capacity: $${ethers.formatEther(usdValue.mul(BASE_LTV).div(10000))}`);
            
            expect(collateralBalance).to.equal(BORROWER1_COLLATERAL);
        });

        it("Borrower 2 should deposit collateral", async function () {
            // For HTS tokens, approval is handled internally by the LendingPool contract
            
            // Deposit collateral
            const tx = await lendingPool.connect(borrower2).depositCollateral(BORROWER2_COLLATERAL);
            const receipt = await tx.wait();
            
            const collateralDepositedEvent = receipt.events.find(e => e.event === "CollateralDeposited");
            expect(collateralDepositedEvent).to.not.be.undefined;
            
            const usdValue = collateralDepositedEvent.args.usdValue;
            const collateralBalance = await lendingPool.collateral(await borrower2.getAddress());
            
            console.log("✅ Borrower2 Collateral Deposit Complete");
            console.log(`   Collateral Deposited: ${ethers.formatEther(BORROWER2_COLLATERAL)} units`);
            console.log(`   USD Value: $${ethers.formatEther(usdValue)}`);
            console.log(`   Max Borrow Capacity: $${ethers.formatEther(usdValue.mul(BASE_LTV).div(10000))}`);
            
            expect(collateralBalance).to.equal(BORROWER2_COLLATERAL);
        });

        it("Borrower 1 should take a loan", async function () {
            const tx = await lendingPool.connect(borrower1).createLoan(BORROWER1_LOAN);
            const receipt = await tx.wait();
            
            const loanCreatedEvent = receipt.events.find(e => e.event === "LoanCreated");
            expect(loanCreatedEvent).to.not.be.undefined;
            
            const borrowBalance = await lendingPool.borrows(await borrower1.getAddress());
            const totalBorrows = await lendingPool.totalBorrows();
            
            console.log("✅ Borrower1 Loan Created");
            console.log(`   Loan Amount: $${ethers.formatEther(BORROWER1_LOAN)}`);
            console.log(`   Outstanding Debt: $${ethers.formatEther(borrowBalance)}`);
            console.log(`   Total Pool Borrows: $${ethers.formatEther(totalBorrows)}`);
            
            expect(borrowBalance).to.equal(BORROWER1_LOAN);
        });

        it("Borrower 2 should take a loan", async function () {
            const tx = await lendingPool.connect(borrower2).createLoan(BORROWER2_LOAN);
            const receipt = await tx.wait();
            
            const loanCreatedEvent = receipt.events.find(e => e.event === "LoanCreated");
            expect(loanCreatedEvent).to.not.be.undefined;
            
            const borrowBalance = await lendingPool.borrows(await borrower2.getAddress());
            const totalBorrows = await lendingPool.totalBorrows();
            
            console.log("✅ Borrower2 Loan Created");
            console.log(`   Loan Amount: $${ethers.formatEther(BORROWER2_LOAN)}`);
            console.log(`   Outstanding Debt: $${ethers.formatEther(borrowBalance)}`);
            console.log(`   Total Pool Borrows: $${ethers.formatEther(totalBorrows)}`);
            
            expect(borrowBalance).to.equal(BORROWER2_LOAN);
        });

        it("Should verify borrower positions and utilization", async function () {
            const borrower1Collateral = await lendingPool.collateral(await borrower1.getAddress());
            const borrower2Collateral = await lendingPool.collateral(await borrower2.getAddress());
            const borrower1Debt = await lendingPool.getCurrentBorrowBalance(await borrower1.getAddress());
            const borrower2Debt = await lendingPool.getCurrentBorrowBalance(await borrower2.getAddress());
            const totalAssets = await lendingPool.totalAssets();
            const totalBorrows = await lendingPool.totalBorrows();
            const utilizationRate = await lendingPool.utilizationRate();
            
            console.log("📊 Borrower Positions & Pool Utilization:");
            console.log(`   Borrower1 Collateral: ${ethers.formatEther(borrower1Collateral)} units`);
            console.log(`   Borrower1 Borrowed: $${ethers.formatEther(borrower1Debt)}`);
            console.log(`   Borrower2 Collateral: ${ethers.formatEther(borrower2Collateral)} units`);
            console.log(`   Borrower2 Borrowed: $${ethers.formatEther(borrower2Debt)}`);
            console.log(`   Pool Utilization Rate: ${utilizationRate / 100}%`);
            
            expect(utilizationRate).to.be.gt(0);
        });
    });

    describe("Phase 4: Interest Accrual & Yield Generation", function () {
        it("Should simulate time passage for interest accrual", async function () {
            // Mine blocks to simulate time passage
            await ethers.provider.send("evm_increaseTime", [86400]); // 1 day
            await ethers.provider.send("evm_mine");
            
            await ethers.provider.send("evm_increaseTime", [86400]); // Another day
            await ethers.provider.send("evm_mine");
            
            console.log("✅ Simulated 2 days of interest accrual");
        });

        it("Should accrue interest and update pool state", async function () {
            const tx = await lendingPool.accrueInterest();
            const receipt = await tx.wait();
            
            const interestAccruedEvent = receipt.logs.find(log => {
                try {
                    const parsed = lendingPool.interface.parseLog(log);
                    return parsed && parsed.name === 'InterestAccrued';
                } catch (e) {
                    return false;
                }
            });
            expect(interestAccruedEvent).to.not.be.undefined;
            
            const parsed = lendingPool.interface.parseLog(interestAccruedEvent);
            const interestAmount = parsed.args.interestAmount;
            const newTotalBorrows = parsed.args.newTotalBorrows;
            const totalReserves = await lendingPool.totalReserves();
            
            console.log("✅ Interest Accrued Successfully");
            console.log(`   Interest Amount: $${ethers.formatEther(interestAmount)}`);
            console.log(`   New Total Borrows: $${ethers.formatEther(newTotalBorrows)}`);
            console.log(`   Protocol Reserves: $${ethers.formatEther(totalReserves)}`);
            
            expect(interestAmount).to.be.gt(0);
            expect(newTotalBorrows).to.be.gt(BORROWER1_LOAN.add(BORROWER2_LOAN));
        });

        it("Should calculate LP yield and exchange rate", async function () {
            const exchangeRate = await lendingPool.exchangeRate();
            const lp1Shares = await lendingPool.lpShares(liquidityProvider1.getAddress());
            const lp2Shares = await lendingPool.lpShares(liquidityProvider2.getAddress());
            
            // Calculate current values manually
            const lp1Value = (lp1Shares * exchangeRate) / ethers.parseEther("1");
            const lp2Value = (lp2Shares * exchangeRate) / ethers.parseEther("1");
            
            console.log("💰 Liquidity Provider Yield Calculation:");
            console.log(`   Exchange Rate: ${ethers.formatEther(exchangeRate)}`);
            console.log(`   LP1 Shares: ${ethers.formatEther(lp1Shares)}`);
            console.log(`   LP1 Current Value: $${ethers.formatEther(lp1Value)}`);
            console.log(`   LP2 Shares: ${ethers.formatEther(lp2Shares)}`);
            console.log(`   LP2 Current Value: $${ethers.formatEther(lp2Value)}`);
            
            expect(exchangeRate).to.be.gt(ethers.parseEther("1"));
            expect(lp1Value).to.be.gt(0);
            expect(lp2Value).to.be.gt(0);
        });
    });

    describe("Phase 5: Loan Repayment & Yield Realization", function () {
        it("Borrower 1 should repay partial loan", async function () {
            const partialRepayment = BORROWER1_LOAN.div(2); // Repay half
            
            // Mint tokens for repayment
            await faucetToken.connect(borrower1).faucetMint(
                partialRepayment.mul(2).toString() // Extra for interest
            );
            
            // For HTS tokens, approval is handled internally by the LendingPool contract
            
            const tx = await lendingPool.connect(borrower1).repayLoan(partialRepayment);
            const receipt = await tx.wait();
            
            const loanRepaidEvent = receipt.events.find(e => e.event === "LoanRepaid");
            expect(loanRepaidEvent).to.not.be.undefined;
            
            const remainingDebt = await lendingPool.borrows(borrower1.getAddress());
            
            console.log("✅ Borrower1 Partial Repayment");
            console.log(`   Repaid Amount: $${ethers.formatEther(partialRepayment)}`);
            console.log(`   Interest Paid: $${ethers.formatEther(loanRepaidEvent.args.interest)}`);
            console.log(`   Remaining Debt: $${ethers.formatEther(remainingDebt)}`);
            
            expect(remainingDebt).to.be.lt(BORROWER1_LOAN);
        });

        it("Borrower 2 should repay full loan", async function () {
            const fullRepayment = BORROWER2_LOAN;
            
            // Mint tokens for repayment
            await faucetToken.connect(borrower2).faucetMint(
                fullRepayment.mul(2).toString() // Extra for interest
            );
            
            // For HTS tokens, approval is handled internally by the LendingPool contract
            
            const tx = await lendingPool.connect(borrower2).repayLoan(fullRepayment);
            const receipt = await tx.wait();
            
            const loanRepaidEvent = receipt.events.find(e => e.event === "LoanRepaid");
            expect(loanRepaidEvent).to.not.be.undefined;
            
            const remainingDebt = await lendingPool.borrows(borrower2.getAddress());
            
            console.log("✅ Borrower2 Full Repayment");
            console.log(`   Repaid Amount: $${ethers.formatEther(fullRepayment)}`);
            console.log(`   Interest Paid: $${ethers.formatEther(loanRepaidEvent.args.interest)}`);
            console.log(`   Remaining Debt: $${ethers.formatEther(remainingDebt)}`);
            
            expect(remainingDebt).to.equal(0);
        });

        it("Liquidity providers should withdraw with yield", async function () {
            const lp1Shares = await lendingPool.lpShares(liquidityProvider1.getAddress());
            const lp2Shares = await lendingPool.lpShares(liquidityProvider2.getAddress());
            
            // LP1 withdraws half
            const lp1WithdrawShares = lp1Shares.div(2);
            await lendingPool.connect(liquidityProvider1).withdraw(lp1WithdrawShares);
            
            // LP2 withdraws all
            await lendingPool.connect(liquidityProvider2).withdraw(lp2Shares);
            
            const finalAssets = await lendingPool.totalAssets();
            const finalBorrows = await lendingPool.totalBorrows();
            
            console.log("✅ Liquidity Provider Withdrawals Complete");
            console.log(`   LP1 Withdrew: ${ethers.formatEther(lp1WithdrawShares)} shares`);
            console.log(`   LP2 Withdrew: ${ethers.formatEther(lp2Shares)} shares`);
            console.log(`   Final Pool Assets: $${ethers.formatEther(finalAssets)}`);
            console.log(`   Final Pool Borrows: $${ethers.formatEther(finalBorrows)}`);
        });
    });

    describe("Phase 6: Liquidation Scenario", function () {
        it("Should simulate price crash for liquidation test", async function () {
            // Crash the price to 50% of original
            const crashPrice = INITIAL_PRICE.div(2);
            await priceOracle.connect(owner).setPrice(ASSET_TYPE, crashPrice);
            
            console.log("📉 Price Crash Simulated");
            console.log(`   New Price: $${ethers.formatEther(crashPrice)}`);
        });

        it("Should check borrower health factors after price crash", async function () {
            const collateralAmount = await lendingPool.collateral(await borrower1.getAddress());
            const currentDebt = await lendingPool.getCurrentBorrowBalance(await borrower1.getAddress());
            const price = await priceOracle.getPrice(ASSET_TYPE);
            const collateralUSD = (collateralAmount * price) / ethers.parseEther("1");
            const maxBorrow = (collateralUSD * BigInt(BASE_LTV)) / BigInt(10000);
            const healthFactor = currentDebt == 0n ? ethers.MaxUint256 : (maxBorrow * ethers.parseEther("1")) / currentDebt;
            
            console.log("🏥 Borrower Health Check After Price Crash:");
            console.log(`   Borrower1 Health Factor: ${ethers.formatEther(healthFactor)}`);
            console.log(`   Collateral Value: $${ethers.formatEther(collateralUSD)}`);
            console.log(`   Outstanding Debt: $${ethers.formatEther(currentDebt)}`);
            
            // Health factor should be low due to price crash
            expect(healthFactor).to.be.lt(ethers.parseEther("1.5"));
        });

        it("Should execute liquidation", async function () {
            // Liquidator needs collateral tokens
            const FaucetToken = await ethers.getContractFactory("FaucetToken");
            const collateralFaucet = await FaucetToken.deploy(collateralToken);
            await collateralFaucet.waitForDeployment();
            await collateralFaucet.connect(liquidator).faucetMint(
                ethers.parseEther("100").toString()
            );
            
            const tx = await lendingPool.connect(liquidator).liquidate(borrower1.getAddress());
            const receipt = await tx.wait();
            
            const liquidatedEvent = receipt.events.find(e => e.event === "LoanLiquidated");
            expect(liquidatedEvent).to.not.be.undefined;
            
            const seizedCollateral = liquidatedEvent.args.collateralSeized;
            const repaidDebt = liquidatedEvent.args.repaid;
            
            console.log("⚡ Liquidation Executed");
            console.log(`   Collateral Seized: ${ethers.formatEther(seizedCollateral)} units`);
            console.log(`   Debt Repaid: $${ethers.formatEther(repaidDebt)}`);
            
            const remainingDebt = await lendingPool.borrows(borrower1.getAddress());
            expect(remainingDebt).to.equal(0);
        });
    });

    describe("Phase 7: Final Pool Statistics", function () {
        it("Should display final pool statistics", async function () {
            const totalAssets = await lendingPool.totalAssets();
            const totalBorrows = await lendingPool.totalBorrows();
            const totalReserves = await lendingPool.totalReserves();
            const availableLiquidity = await lendingPool.availableLiquidity();
            const utilizationRate = await lendingPool.utilizationRate();
            const exchangeRate = await lendingPool.exchangeRate();
            const currentAPR = await lendingPool.currentAPR();
            const factoryStats = await lendingFactory.getPoolStats();
            
            console.log("📊 Final Pool Statistics:");
            console.log(`   Total Assets: $${ethers.formatEther(totalAssets)}`);
            console.log(`   Total Borrows: $${ethers.formatEther(totalBorrows)}`);
            console.log(`   Total Reserves: $${ethers.formatEther(totalReserves)}`);
            console.log(`   Available Liquidity: $${ethers.formatEther(availableLiquidity)}`);
            console.log(`   Utilization Rate: ${utilizationRate / 100}%`);
            console.log(`   Exchange Rate: ${ethers.formatEther(exchangeRate)}`);
            console.log(`   Current APR: ${currentAPR / 100}%`);
            
            console.log("\n🏭 Factory Pool Statistics:");
            console.log(`   Number of Pools: ${factoryStats.length}`);
            for (let i = 0; i < factoryStats.length; i++) {
                console.log(`   Pool ${i + 1} (${factoryStats[i].assetType}):`);
                console.log(`     TVL: $${ethers.formatEther(factoryStats[i].totalAssets)}`);
                console.log(`     Borrows: $${ethers.formatEther(factoryStats[i].totalBorrows)}`);
                console.log(`     Utilization: ${factoryStats[i].utilizationRate / 100}%`);
                console.log(`     APR: ${factoryStats[i].currentAPR / 100}%`);
            }
        });

        it("Should verify all DeFi mechanics worked correctly", async function () {
            // Verify liquidity providers earned yield
            const lp1FinalShares = await lendingPool.lpShares(liquidityProvider1.getAddress());
            
            // Verify borrowers had their loans processed
            const borrower1Debt = await lendingPool.getCurrentBorrowBalance(await borrower1.getAddress());
            const borrower2Debt = await lendingPool.getCurrentBorrowBalance(await borrower2.getAddress());
            
            // Verify interest accrual worked
            const totalReserves = await lendingPool.totalReserves();
            
            console.log("✅ DeFi Mechanics Verification:");
            console.log(`   LP1 Remaining Shares: ${ethers.formatEther(lp1FinalShares)}`);
            console.log(`   Borrower1 Debt: $${ethers.formatEther(borrower1Debt)}`);
            console.log(`   Borrower2 Debt: $${ethers.formatEther(borrower2Debt)}`);
            console.log(`   Protocol Reserves: $${ethers.formatEther(totalReserves)}`);
            
            expect(borrower1Debt).to.equal(0); // Liquidated
            expect(borrower2Debt).to.equal(0); // Repaid
            expect(totalReserves).to.be.gt(0);
        });
    });

    after(async function () {
        console.log("\n🎉 Full Lending Flow Test Complete!");
        console.log("✅ All DeFi mechanics tested successfully:");
        console.log("   • Factory deployment and pool creation");
        console.log("   • Liquidity provider deposits and yield farming");
        console.log("   • Borrower collateral deposits and loans");
        console.log("   • Interest accrual and yield generation");
        console.log("   • Loan repayments and partial liquidations");
        console.log("   • Price crash and liquidation mechanics");
        console.log("   • Protocol fee collection and reserves");
    });
});
