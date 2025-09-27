const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Investor Dashboard Functions", function () {
  let owner, investor1, investor2, farmer1, farmer2, factory, pool, token, oracle;
  let poolAddress, oracleAddress;

  beforeEach(async function () {
    [owner, investor1, investor2, farmer1, farmer2] = await ethers.getSigners();

    // Deploy MockToken
    const MockToken = await ethers.getContractFactory("MockToken");
    token = await MockToken.deploy("USD Coin", "USDC", owner.address);
    await token.waitForDeployment();

    // Mint tokens to investors
    await token.mint(investor1.address, ethers.parseUnits("10000", 6));
    await token.mint(investor2.address, ethers.parseUnits("10000", 6));
    await token.mint(farmer1.address, ethers.parseUnits("10000", 6));

    // Deploy PoolFactory
    const PoolFactory = await ethers.getContractFactory("PoolFactory");
    factory = await PoolFactory.deploy();
    await factory.waitForDeployment();

    // Create a pool
    const tx = await factory.createPool(
      "Rice",
      await token.getAddress(),
      await token.getAddress(), // collateral token (same as lending token for simplicity)
      8000, // 80% LTV
      500,  // 5% APR
      1000000, // 1M debt ceiling
      100,  // 1% protocol fee
      ethers.parseEther("200") // $200 initial price
    );
    const receipt = await tx.wait();
    
    // Find the PoolCreated event
    const poolCreatedEvent = receipt.logs.find(log => {
      try {
        return log.fragment?.name === "PoolCreated";
      } catch (e) {
        return false;
      }
    });
    
    if (poolCreatedEvent) {
      poolAddress = poolCreatedEvent.args.pool;
      oracleAddress = poolCreatedEvent.args.oracle;
    } else {
      // Fallback: get pool info directly
      const poolInfo = await factory.getPool("Rice");
      poolAddress = poolInfo.poolAddress;
      oracleAddress = poolInfo.oracleAddress;
    }

    // Get pool instance
    const GrainPool = await ethers.getContractFactory("GrainPool");
    pool = GrainPool.attach(poolAddress);

    // Get oracle instance
    const MockPriceOracle = await ethers.getContractFactory("MockPriceOracle");
    oracle = MockPriceOracle.attach(oracleAddress);

    // Mint tokens for farmers (they need collateral tokens)
    await token.mint(farmer1.address, ethers.parseUnits("100000", 6));
    await token.mint(farmer2.address, ethers.parseUnits("100000", 6));

    // Approve token spending
    await token.connect(investor1).approve(poolAddress, ethers.parseUnits("10000", 6));
    await token.connect(investor2).approve(poolAddress, ethers.parseUnits("10000", 6));
    await token.connect(farmer1).approve(poolAddress, ethers.parseUnits("10000", 6));
  });

  describe("PoolFactory Dashboard Functions", function () {
    it("Should return pool stats for all pools", async function () {
      const stats = await factory.getPoolStats();
      
      expect(stats).to.have.lengthOf(1);
      expect(stats[0].grainType).to.equal("Rice");
      expect(stats[0].pool).to.equal(poolAddress);
      expect(stats[0].totalAssets).to.equal(0); // No deposits yet
      expect(stats[0].totalBorrows).to.equal(0); // No loans yet
    });

    it("Should return utilization rates for all pools", async function () {
      const [pools, rates] = await factory.getPoolUtilizationRates();
      
      expect(pools).to.have.lengthOf(1);
      expect(rates).to.have.lengthOf(1);
      expect(pools[0]).to.equal(poolAddress);
      expect(rates[0]).to.equal(0); // No utilization yet
    });

    it("Should return APRs for all pools", async function () {
      const [pools, aprs] = await factory.getAllPoolAPRs();
      
      expect(pools).to.have.lengthOf(1);
      expect(aprs).to.have.lengthOf(1);
      expect(pools[0]).to.equal(poolAddress);
      expect(aprs[0]).to.equal(500); // 5% APR
    });
  });

  describe("GrainPool Dashboard Functions", function () {
    beforeEach(async function () {
      // Investor1 deposits 1000 USDC
      await pool.connect(investor1).deposit(ethers.parseUnits("1000", 6));
      
      // Farmer1 deposits collateral and creates loan
      await token.connect(farmer1).approve(poolAddress, ethers.parseUnits("1000", 6));
      await pool.connect(farmer1).depositCollateral(ethers.parseUnits("1000", 6)); // $1000 collateral
      await pool.connect(farmer1).createLoan(ethers.parseUnits("500", 6)); // $500 loan
    });

    it("Should return correct utilization rate", async function () {
      const utilizationRate = await pool.utilizationRate();
      expect(utilizationRate).to.equal(5000); // 50% utilization (500/1000 * 10000)
    });

    it("Should return current APR", async function () {
      const apr = await pool.currentAPR();
      expect(apr).to.equal(500); // 5% APR
    });

    it("Should return pool TVL", async function () {
      const tvl = await pool.getTVL();
      expect(tvl).to.equal(ethers.parseUnits("1000", 6));
    });

    it("Should return pool value in USD", async function () {
      const poolValueUSD = await pool.getPoolValueUSD();
      const expectedValue = ethers.parseUnits("1000", 6) * ethers.parseEther("200") / ethers.parseEther("1");
      expect(poolValueUSD).to.be.closeTo(expectedValue, ethers.parseEther("1"));
    });

    it("Should return pool health score", async function () {
      const healthScore = await pool.getPoolHealthScore();
      expect(healthScore).to.equal(10000); // Good health (50% utilization is below 60% threshold)
    });

    it("Should return investor shares", async function () {
      const shares = await pool.getInvestorShares(investor1.address);
      expect(shares).to.equal(ethers.parseUnits("1000", 6)); // First deposit gets 1:1 shares
    });

    it("Should return investor value", async function () {
      const value = await pool.getInvestorValue(investor1.address);
      expect(value).to.be.closeTo(ethers.parseUnits("1000", 6), ethers.parseUnits("1", 6));
    });

    it("Should return investor yield", async function () {
      // Initially no yield since no interest accrued yet
      const yield = await pool.getInvestorYield(investor1.address);
      expect(yield).to.equal(0);
    });

    it("Should return estimated yield", async function () {
      const estimatedYield = await pool.getEstimatedYield(investor1.address);
      const expectedYield = ethers.parseUnits("1000", 6) * 500n / 10000n; // 5% of 1000
      expect(estimatedYield).to.equal(expectedYield);
    });

    it("Should return investor deposit history", async function () {
      const history = await pool.getInvestorDepositHistory(investor1.address);
      
      expect(history).to.have.lengthOf(1);
      expect(history[0].investor).to.equal(investor1.address);
      expect(history[0].amount).to.equal(ethers.parseUnits("1000", 6));
      expect(history[0].shares).to.equal(ethers.parseUnits("1000", 6));
    });

    it("Should return investor total deposits", async function () {
      const totalDeposits = await pool.getInvestorTotalDeposits(investor1.address);
      expect(totalDeposits).to.equal(ethers.parseUnits("1000", 6));
    });

    it("Should return current pool stats", async function () {
      const stats = await pool.getCurrentPoolStats();
      
      expect(stats._totalAssets).to.equal(ethers.parseUnits("1000", 6));
      expect(stats._totalBorrows).to.equal(ethers.parseUnits("500", 6));
      expect(stats._totalReserves).to.equal(0); // No interest accrued yet
      expect(stats._availableLiquidity).to.equal(ethers.parseUnits("500", 6));
      expect(stats._utilizationRate).to.equal(5000); // 50%
      expect(stats._currentAPR).to.equal(500); // 5%
      expect(stats._healthScore).to.equal(10000);
    });

    it("Should update daily stats", async function () {
      await pool.updateDailyStats();
      
      const today = Math.floor(Date.now() / 86400000);
      const dailyStats = await pool.getDailyStats(today);
      
      expect(dailyStats.totalAssets).to.equal(ethers.parseUnits("1000", 6));
      expect(dailyStats.totalBorrows).to.equal(ethers.parseUnits("500", 6));
      expect(dailyStats.utilizationRate).to.equal(5000);
    });
  });

  describe("Enhanced Events", function () {
    it("Should emit Deposited event with timestamp", async function () {
      const tx = await pool.connect(investor1).deposit(ethers.parseUnits("500", 6));
      const receipt = await tx.wait();
      
      const depositedEvent = receipt.logs.find(log => 
        log.fragment?.name === "Deposited"
      );
      
      expect(depositedEvent).to.not.be.undefined;
      expect(depositedEvent.args.supporter).to.equal(investor1.address);
      expect(depositedEvent.args.amount).to.equal(ethers.parseUnits("500", 6));
      expect(depositedEvent.args.timestamp).to.be.a("bigint");
    });

    it("Should emit Withdrawn event with timestamp", async function () {
      // First deposit
      await pool.connect(investor1).deposit(ethers.parseUnits("1000", 6));
      
      // Then withdraw
      const tx = await pool.connect(investor1).withdraw(ethers.parseUnits("500", 6));
      const receipt = await tx.wait();
      
      const withdrawnEvent = receipt.logs.find(log => 
        log.fragment?.name === "Withdrawn"
      );
      
      expect(withdrawnEvent).to.not.be.undefined;
      expect(withdrawnEvent.args.supporter).to.equal(investor1.address);
      expect(withdrawnEvent.args.shares).to.equal(ethers.parseUnits("500", 6));
      expect(withdrawnEvent.args.timestamp).to.be.a("bigint");
    });

    it("Should emit PoolStatsUpdated event", async function () {
      // This test verifies the PoolStatsUpdated event is emitted when updateDailyStats is called
      // The actual event verification is tested in the "updateDailyStats" test above
      const tx = await pool.updateDailyStats();
      const receipt = await tx.wait();
      
      const statsUpdatedEvent = receipt.logs.find(log => 
        log.fragment?.name === "PoolStatsUpdated"
      );
      
      expect(statsUpdatedEvent).to.not.be.undefined;
      expect(statsUpdatedEvent.args.timestamp).to.be.a("bigint");
    });
  });

  describe("Multiple Investors and Yield Calculation", function () {
    beforeEach(async function () {
      // Multiple deposits from investor1
      await pool.connect(investor1).deposit(ethers.parseUnits("1000", 6));
      await pool.connect(investor1).deposit(ethers.parseUnits("500", 6));
      
      // Deposit from investor2
      await pool.connect(investor2).deposit(ethers.parseUnits("2000", 6));
      
      // Create some loans to generate interest
      await token.connect(farmer1).approve(poolAddress, ethers.parseUnits("2000", 6));
      await pool.connect(farmer1).depositCollateral(ethers.parseUnits("2000", 6));
      await pool.connect(farmer1).createLoan(ethers.parseUnits("1000", 6));
    });

    it("Should track multiple deposits correctly", async function () {
      const history = await pool.getInvestorDepositHistory(investor1.address);
      expect(history).to.have.lengthOf(2);
      
      const totalDeposits = await pool.getInvestorTotalDeposits(investor1.address);
      expect(totalDeposits).to.equal(ethers.parseUnits("1500", 6));
    });

    it("Should calculate yield after interest accrual", async function () {
      // Fast forward time to accrue interest
      await ethers.provider.send("evm_increaseTime", [86400]); // 1 day
      await ethers.provider.send("evm_mine");
      
      // Trigger interest accrual
      await pool.connect(investor1).deposit(ethers.parseUnits("100", 6));
      
      // Check yield calculation
      const yield = await pool.getInvestorYield(investor1.address);
      expect(yield).to.be.gt(0); // Should have some yield now
    });

    it("Should return different values for different investors", async function () {
      const investor1Value = await pool.getInvestorValue(investor1.address);
      const investor2Value = await pool.getInvestorValue(investor2.address);
      
      expect(investor1Value).to.be.closeTo(ethers.parseUnits("1500", 6), ethers.parseUnits("10", 6));
      expect(investor2Value).to.be.closeTo(ethers.parseUnits("2000", 6), ethers.parseUnits("10", 6));
    });
  });

  describe("Edge Cases", function () {
    it("Should handle zero balance investors", async function () {
      const shares = await pool.getInvestorShares(investor2.address);
      const value = await pool.getInvestorValue(investor2.address);
      const yield = await pool.getInvestorYield(investor2.address);
      
      expect(shares).to.equal(0);
      expect(value).to.equal(0);
      expect(yield).to.equal(0);
    });

    it("Should handle zero total assets", async function () {
      const utilizationRate = await pool.utilizationRate();
      const healthScore = await pool.getPoolHealthScore();
      
      expect(utilizationRate).to.equal(0);
      expect(healthScore).to.equal(10000); // Perfect health when no assets
    });

    it("Should handle high utilization rates", async function () {
      // Deposit and borrow most of it
      await pool.connect(investor1).deposit(ethers.parseUnits("1000", 6));
      await token.connect(farmer1).approve(poolAddress, ethers.parseUnits("1000", 6));
      await pool.connect(farmer1).depositCollateral(ethers.parseUnits("1000", 6));
      await pool.connect(farmer1).createLoan(ethers.parseUnits("900", 6)); // 90% utilization
      
      const utilizationRate = await pool.utilizationRate();
      const healthScore = await pool.getPoolHealthScore();
      
      expect(utilizationRate).to.equal(9000); // 90%
      expect(healthScore).to.equal(8000); // Reduced health score
    });
  });
});
