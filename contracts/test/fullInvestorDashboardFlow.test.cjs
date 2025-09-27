const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Full Investor Dashboard Flow", function () {
  let owner, investor1, investor2, investor3, farmer1, farmer2, factory, pool, token, oracle;
  let poolAddress, oracleAddress;

  beforeEach(async function () {
    [owner, investor1, investor2, investor3, farmer1, farmer2] = await ethers.getSigners();

    // Deploy MockToken
    const MockToken = await ethers.getContractFactory("MockToken");
    token = await MockToken.deploy("USD Coin", "USDC", owner.address);
    await token.waitForDeployment();

    // Mint tokens to all participants
    const mintAmount = ethers.parseUnits("50000", 6);
    await token.mint(investor1.address, mintAmount);
    await token.mint(investor2.address, mintAmount);
    await token.mint(investor3.address, mintAmount);
    await token.mint(farmer1.address, mintAmount);
    await token.mint(farmer2.address, mintAmount);

    // Deploy PoolFactory
    const PoolFactory = await ethers.getContractFactory("PoolFactory");
    factory = await PoolFactory.deploy();
    await factory.waitForDeployment();

    // Create multiple pools
    const pools = [
      { grain: "Rice", price: "200", apr: 500 },
      { grain: "Corn", price: "180", apr: 450 },
      { grain: "Wheat", price: "220", apr: 550 }
    ];

    for (const poolData of pools) {
      await factory.createPool(
        poolData.grain,
        await token.getAddress(),
        await token.getAddress(), // collateral token (same as lending token for simplicity)
        8000, // 80% LTV
        poolData.apr,
        1000000, // 1M debt ceiling
        100,  // 1% protocol fee
        ethers.parseEther(poolData.price)
      );
    }

    // Get Rice pool for main testing
    const ricePoolInfo = await factory.getPool("Rice");
    poolAddress = ricePoolInfo.poolAddress;
    oracleAddress = ricePoolInfo.oracleAddress;

    const GrainPool = await ethers.getContractFactory("GrainPool");
    pool = GrainPool.attach(poolAddress);

    const MockPriceOracle = await ethers.getContractFactory("MockPriceOracle");
    oracle = MockPriceOracle.attach(oracleAddress);

    // Mint tokens for farmers (they need collateral tokens)
    await token.mint(farmer1.address, ethers.parseUnits("100000", 6));
    await token.mint(farmer2.address, ethers.parseUnits("100000", 6));

    // Approve token spending for all participants
    const approveAmount = ethers.parseUnits("50000", 6);
    await token.connect(investor1).approve(poolAddress, approveAmount);
    await token.connect(investor2).approve(poolAddress, approveAmount);
    await token.connect(investor3).approve(poolAddress, approveAmount);
    await token.connect(farmer1).approve(poolAddress, approveAmount);
    await token.connect(farmer2).approve(poolAddress, approveAmount);
  });

  describe("Complete Investor Dashboard Scenario", function () {
    it("Should simulate a realistic investment scenario", async function () {
      console.log("\n=== Starting Full Investor Dashboard Flow Test ===");

      // Phase 1: Initial deposits
      console.log("\nPhase 1: Initial Deposits");
      
      await pool.connect(investor1).deposit(ethers.parseUnits("5000", 6));
      await pool.connect(investor2).deposit(ethers.parseUnits("3000", 6));
      await pool.connect(investor3).deposit(ethers.parseUnits("2000", 6));

      // Check initial pool stats
      const initialStats = await factory.getPoolStats();
      const ricePoolStats = initialStats.find(stat => stat.grainType === "Rice");
      
      console.log(`Initial TVL: $${ethers.formatUnits(ricePoolStats.totalAssets, 6)}`);
      console.log(`Initial Utilization: ${Number(ricePoolStats.utilizationRate) / 100}%`);
      console.log(`Initial APR: ${Number(ricePoolStats.currentAPR) / 100}%`);

      expect(ricePoolStats.totalAssets).to.equal(ethers.parseUnits("10000", 6));
      expect(ricePoolStats.utilizationRate).to.equal(0);

      // Phase 2: Farmers create loans
      console.log("\nPhase 2: Farmers Create Loans");
      
      await token.connect(farmer1).approve(poolAddress, ethers.parseUnits("3000", 6));
      await pool.connect(farmer1).depositCollateral(ethers.parseUnits("3000", 6));
      await pool.connect(farmer1).createLoan(ethers.parseUnits("2000", 6));
      
      await token.connect(farmer2).approve(poolAddress, ethers.parseUnits("2000", 6));
      await pool.connect(farmer2).depositCollateral(ethers.parseUnits("2000", 6));
      await pool.connect(farmer2).createLoan(ethers.parseUnits("1500", 6));

      // Check utilization after loans
      const afterLoansStats = await factory.getPoolStats();
      const riceAfterLoans = afterLoansStats.find(stat => stat.grainType === "Rice");
      
      console.log(`After Loans TVL: $${ethers.formatUnits(riceAfterLoans.totalAssets, 6)}`);
      console.log(`After Loans Utilization: ${Number(riceAfterLoans.utilizationRate) / 100}%`);

      expect(riceAfterLoans.utilizationRate).to.equal(3810); // 38.1% utilization (3500/10000 * 10000)

      // Phase 3: Check individual investor positions
      console.log("\nPhase 3: Individual Investor Positions");
      
      const investor1Stats = await pool.getCurrentPoolStats();
      const investor1Shares = await pool.getInvestorShares(investor1.address);
      const investor1Value = await pool.getInvestorValue(investor1.address);
      const investor1Yield = await pool.getInvestorYield(investor1.address);
      const investor1History = await pool.getInvestorDepositHistory(investor1.address);

      console.log(`Investor1 Shares: ${ethers.formatUnits(investor1Shares, 6)}`);
      console.log(`Investor1 Value: $${ethers.formatUnits(investor1Value, 6)}`);
      console.log(`Investor1 Yield: $${ethers.formatUnits(investor1Yield, 6)}`);
      console.log(`Investor1 Deposits: ${investor1History.length}`);

      expect(investor1Shares).to.equal(ethers.parseUnits("5000", 6));
      expect(investor1History).to.have.lengthOf(1);

      // Phase 4: More deposits and time passage
      console.log("\nPhase 4: Additional Deposits and Time Passage");
      
      await pool.connect(investor1).deposit(ethers.parseUnits("1000", 6));
      await pool.connect(investor2).deposit(ethers.parseUnits("2000", 6));

      // Fast forward time to accrue interest
      await ethers.provider.send("evm_increaseTime", [86400 * 7]); // 1 week
      await ethers.provider.send("evm_mine");

      // Trigger interest accrual
      await pool.connect(investor3).deposit(ethers.parseUnits("500", 6));

      // Check updated positions
      const updatedInvestor1Value = await pool.getInvestorValue(investor1.address);
      const updatedInvestor1Yield = await pool.getInvestorYield(investor1.address);
      const updatedInvestor1History = await pool.getInvestorDepositHistory(investor1.address);

      console.log(`Updated Investor1 Value: $${ethers.formatUnits(updatedInvestor1Value, 6)}`);
      console.log(`Updated Investor1 Yield: $${ethers.formatUnits(updatedInvestor1Yield, 6)}`);
      console.log(`Updated Investor1 Deposits: ${updatedInvestor1History.length}`);

      expect(updatedInvestor1History).to.have.lengthOf(2);
      expect(updatedInvestor1Yield).to.be.gt(0); // Should have some yield now

      // Phase 5: Portfolio comparison across investors
      console.log("\nPhase 5: Portfolio Comparison");
      
      const allInvestors = [investor1, investor2, investor3];
      const portfolioSummary = [];

      for (let i = 0; i < allInvestors.length; i++) {
        const investor = allInvestors[i];
        const shares = await pool.getInvestorShares(investor.address);
        const value = await pool.getInvestorValue(investor.address);
        const yield = await pool.getInvestorYield(investor.address);
        const totalDeposits = await pool.getInvestorTotalDeposits(investor.address);

        portfolioSummary.push({
          investor: `Investor${i + 1}`,
          shares: ethers.formatUnits(shares, 6),
          value: ethers.formatUnits(value, 6),
          yield: ethers.formatUnits(yield, 6),
          totalDeposits: ethers.formatUnits(totalDeposits, 6)
        });

        console.log(`${portfolioSummary[i].investor}:`);
        console.log(`  Shares: ${portfolioSummary[i].shares}`);
        console.log(`  Value: $${portfolioSummary[i].value}`);
        console.log(`  Yield: $${portfolioSummary[i].yield}`);
        console.log(`  Total Deposits: $${portfolioSummary[i].totalDeposits}`);
      }

      // Phase 6: Pool health and analytics
      console.log("\nPhase 6: Pool Health and Analytics");
      
      const finalPoolStats = await pool.getCurrentPoolStats();
      const healthScore = await pool.getPoolHealthScore();
      const poolValueUSD = await pool.getPoolValueUSD();

      console.log(`Final Pool Stats:`);
      console.log(`  Total Assets: $${ethers.formatUnits(finalPoolStats._totalAssets, 6)}`);
      console.log(`  Total Borrows: $${ethers.formatUnits(finalPoolStats._totalBorrows, 6)}`);
      console.log(`  Total Reserves: $${ethers.formatUnits(finalPoolStats._totalReserves, 6)}`);
      console.log(`  Available Liquidity: $${ethers.formatUnits(finalPoolStats._availableLiquidity, 6)}`);
      console.log(`  Utilization Rate: ${Number(finalPoolStats._utilizationRate) / 100}%`);
      console.log(`  Current APR: ${Number(finalPoolStats._currentAPR) / 100}%`);
      console.log(`  Health Score: ${Number(healthScore) / 100}%`);
      console.log(`  Pool Value USD: $${ethers.formatUnits(poolValueUSD, 18)}`);

      expect(finalPoolStats._totalAssets).to.be.gt(ethers.parseUnits("10000", 6));
      expect(finalPoolStats._totalReserves).to.be.gt(0);
      expect(healthScore).to.be.gte(8000); // Should have good health

      // Phase 7: Daily stats tracking
      console.log("\nPhase 7: Daily Stats Tracking");
      
      await pool.updateDailyStats();
      const today = Math.floor(Date.now() / 86400000);
      const dailyStats = await pool.getDailyStats(today);

      console.log(`Daily Stats for ${today}:`);
      console.log(`  Total Assets: $${ethers.formatUnits(dailyStats.totalAssets, 6)}`);
      console.log(`  Total Borrows: $${ethers.formatUnits(dailyStats.totalBorrows, 6)}`);
      console.log(`  Exchange Rate: ${ethers.formatUnits(dailyStats.exchangeRate, 18)}`);
      console.log(`  Utilization Rate: ${dailyStats.utilizationRate / 100}%`);

      expect(dailyStats.totalAssets).to.be.gt(ethers.parseUnits("10000", 6));

      // Phase 8: Multi-pool comparison
      console.log("\nPhase 8: Multi-Pool Comparison");
      
      const allPoolStats = await factory.getPoolStats();
      const allUtilizationRates = await factory.getPoolUtilizationRates();
      const allAPRs = await factory.getAllPoolAPRs();

      console.log("All Pool Stats:");
      for (let i = 0; i < allPoolStats.length; i++) {
        const stat = allPoolStats[i];
        console.log(`  ${stat.grainType}:`);
        console.log(`    TVL: $${ethers.formatUnits(stat.totalAssets, 6)}`);
        console.log(`    Utilization: ${stat.utilizationRate / 100}%`);
        console.log(`    APR: ${stat.currentAPR / 100}%`);
      }

      expect(allPoolStats).to.have.lengthOf(3);
      expect(allUtilizationRates[0]).to.have.lengthOf(3);
      expect(allAPRs[0]).to.have.lengthOf(3);

      console.log("\n=== Full Investor Dashboard Flow Test Completed Successfully! ===");
    });

    it("Should handle stress test with many transactions", async function () {
      console.log("\n=== Starting Stress Test ===");

      // Multiple rapid deposits and withdrawals
      const transactions = [];
      
      for (let i = 0; i < 10; i++) {
        transactions.push(pool.connect(investor1).deposit(ethers.parseUnits("100", 6)));
        transactions.push(pool.connect(investor2).deposit(ethers.parseUnits("50", 6)));
      }

      await Promise.all(transactions);

      // Check final state
      const finalShares1 = await pool.getInvestorShares(investor1.address);
      const finalShares2 = await pool.getInvestorShares(investor2.address);
      const finalHistory1 = await pool.getInvestorDepositHistory(investor1.address);
      const finalHistory2 = await pool.getInvestorDepositHistory(investor2.address);

      console.log(`Investor1 final shares: ${ethers.formatUnits(finalShares1, 6)}`);
      console.log(`Investor2 final shares: ${ethers.formatUnits(finalShares2, 6)}`);
      console.log(`Investor1 deposit history length: ${finalHistory1.length}`);
      console.log(`Investor2 deposit history length: ${finalHistory2.length}`);

      expect(finalShares1).to.equal(ethers.parseUnits("1000", 6)); // 10 * 100
      expect(finalShares2).to.equal(ethers.parseUnits("500", 6));  // 10 * 50
      expect(finalHistory1).to.have.lengthOf(10);
      expect(finalHistory2).to.have.lengthOf(10);

      console.log("=== Stress Test Completed Successfully! ===");
    });
  });
});
