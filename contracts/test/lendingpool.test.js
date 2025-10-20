const { expect } = require("chai");
const { ethers } = require("hardhat");
const { Client, AccountId, PrivateKey, TokenAssociateTransaction, TokenTransferTransaction, TokenCreateTransaction } = require("@hashgraph/sdk");
require("dotenv").config();

describe("LendingPool", function () {
  let deployer, user1, user2, usdc, rwa, oracle, interestRateModel, poolFactory, lendingPool;
  let hederaClient;

  before(async function () {
    // Patch provider for Ethers v6 + Hardhat compatibility
    ethers.provider.resolveName = async (name) => name;
    
    [deployer, user1, user2] = await ethers.getSigners();
    hederaClient = Client.forTestnet();
    hederaClient.setOperator(AccountId.fromString(process.env.HEDERA_ACCOUNT_ID), PrivateKey.fromString(process.env.HEDERA_PRIVATE_KEY));

    // Deploy mock USDC
    let usdcTx = await new TokenCreateTransaction()
      .setTokenName("TestUSDC")
      .setTokenSymbol("TUSDC")
      .setDecimals(6)
      .setInitialSupply(1000000e6)
      .setTreasuryAccountId(AccountId.fromString(process.env.HEDERA_ACCOUNT_ID))
      .setAdminKey(hederaClient.operatorPublicKey)
      .execute(hederaClient);
    let usdcReceipt = await usdcTx.getReceipt(hederaClient);
    usdc = usdcReceipt.tokenId.toSolidityAddress();

    // Deploy mock RWA
    let rwaTx = await new TokenCreateTransaction()
      .setTokenName("PropertyToken")
      .setTokenSymbol("PRTY")
      .setDecimals(8)
      .setInitialSupply(100e8)
      .setTreasuryAccountId(AccountId.fromString(process.env.HEDERA_ACCOUNT_ID))
      .setAdminKey(hederaClient.operatorPublicKey)
      .execute(hederaClient);
    let rwaReceipt = await rwaTx.getReceipt(hederaClient);
    rwa = rwaReceipt.tokenId.toSolidityAddress();

    // Deploy mock oracle
    const MockPriceOracle = await ethers.getContractFactory("MockPriceOracle");
    oracle = await MockPriceOracle.deploy();
    await oracle.setPrice(usdc, ethers.parseUnits("1", 8), 8);
    await oracle.setPrice(rwa, ethers.parseUnits("100000", 8), 8);

    // Deploy InterestRateModel
    const InterestRateModel = await ethers.getContractFactory("InterestRateModel");
    interestRateModel = await InterestRateModel.deploy(
      ethers.parseUnits("0.01", 18),
      ethers.parseUnits("0.02", 18),
      ethers.parseUnits("0.05", 18),
      ethers.parseUnits("0.8", 18)
    );

    // Deploy PoolFactory
    const PoolFactory = await ethers.getContractFactory("PoolFactory");
    poolFactory = await PoolFactory.deploy();

    // Create LendingPool
    const tx = await poolFactory.createPool(
      usdc,
      rwa,
      interestRateModel.target,
      ethers.parseUnits("0.1", 18),
      oracle.target,
      ethers.parseUnits("0.75", 18),
      ethers.parseUnits("0.8", 18),
      ethers.parseUnits("0.05", 18)
    );
    const receipt = await tx.wait();
    const poolCreatedEvent = receipt.logs.find(log => log.fragment?.name === "PoolCreated");
    const poolAddress = poolCreatedEvent?.args?.poolAddress;
    lendingPool = await ethers.getContractAt("LendingPool", poolAddress);

    // Skip token initialization for local testing - HTS not available in hardhat
    // await lendingPool.connect(deployer).initializeTokens("LP-USDC", "LPUSDC", 6, "Debt-USDC", "dUSDC", 6);

    // Associate tokens for users
    const tokens = [usdc, rwa, await lendingPool.lpToken(), await lendingPool.debtToken()];
    for (const user of [deployer, user1, user2]) {
      await lendingPool.connect(user).associateTokensForUser(user.address, tokens);
      await new TokenAssociateTransaction()
        .setAccountId(AccountId.fromEvmAddress(0, 0, user.address))
        .setTokenIds([usdcReceipt.tokenId, rwaReceipt.tokenId])
        .execute(hederaClient);
    }

    // Mint tokens to users
    for (const user of [user1, user2]) {
      await new TokenTransferTransaction()
        .addTokenTransfer(usdcReceipt.tokenId, AccountId.fromString(process.env.HEDERA_ACCOUNT_ID), -10000e6)
        .addTokenTransfer(usdcReceipt.tokenId, AccountId.fromEvmAddress(0, 0, user.address), 10000e6)
        .addTokenTransfer(rwaReceipt.tokenId, AccountId.fromString(process.env.HEDERA_ACCOUNT_ID), -1e8)
        .addTokenTransfer(rwaReceipt.tokenId, AccountId.fromEvmAddress(0, 0, user.address), 1e8)
        .execute(hederaClient);
    }
  });

  it("should initialize tokens correctly", async function () {
    const lpToken = await lendingPool.lpToken();
    const debtToken = await lendingPool.debtToken();
    expect(lpToken).to.not.equal(ethers.ZeroAddress);
    expect(debtToken).to.not.equal(ethers.ZeroAddress);
  });

  it("should allow user1 to deposit USDC and receive lpToken", async function () {
    const amount = ethers.parseUnits("1000", 6);
    await lendingPool.connect(user1).deposit(amount);
    const lpToken = await ethers.getContractAt("IHederaTokenService", await lendingPool.lpToken());
    const balance = await lpToken.balanceOf(user1.address);
    expect(balance).to.be.closeTo(amount, 1);
    expect(await lendingPool.totalCash()).to.equal(amount);
  });

  it("should allow user2 to deposit RWA as collateral", async function () {
    const amount = ethers.parseUnits("1", 8);
    await lendingPool.connect(user2).depositCollateral(amount);
    expect(await lendingPool.userCollateral(user2.address)).to.equal(amount);
  });

  it("should allow user2 to borrow USDC against RWA", async function () {
    const collateralAmount = ethers.parseUnits("1", 8);
    await lendingPool.connect(user2).depositCollateral(collateralAmount);
    const borrowAmount = ethers.parseUnits("75000", 6); // 75% LTV of $100,000 RWA
    await lendingPool.connect(user2).borrow(borrowAmount);
    const debtToken = await ethers.getContractAt("IHederaTokenService", await lendingPool.debtToken());
    const debtBalance = await debtToken.balanceOf(user2.address);
    expect(debtBalance).to.be.closeTo(borrowAmount, 1);
    expect(await lendingPool.totalBorrowed()).to.equal(borrowAmount);
  });

  it("should accrue interest correctly", async function () {
    const initialBorrowIndex = await lendingPool.borrowIndex();
    await ethers.provider.send("evm_increaseTime", [3600]); // 1 hour
    await lendingPool.accrueInterest();
    expect(await lendingPool.borrowIndex()).to.be.gt(initialBorrowIndex);
  });

  it("should allow user2 to repay USDC", async function () {
    const repayAmount = ethers.parseUnits("500", 6);
    await lendingPool.connect(user2).repay(repayAmount);
    expect(await lendingPool.totalBorrowed()).to.be.closeTo(ethers.parseUnits("74500", 6), 100);
  });

  it("should allow liquidation when undercollateralized", async function () {
    await oracle.setPrice(rwa, ethers.parseUnits("50000", 8)); // Drop RWA price to $50,000
    const repayAmount = ethers.parseUnits("50000", 6);
    await lendingPool.connect(user1).liquidate(user2.address, repayAmount);
    expect(await lendingPool.userCollateral(user2.address)).to.be.lt(ethers.parseUnits("1", 8));
    expect(await lendingPool.totalBorrowed()).to.be.lt(ethers.parseUnits("74500", 6));
  });

  it("should return pool details via PoolFactory", async function () {
    const details = await poolFactory.getAllPoolsWithDetails();
    expect(details.length).to.equal(1);
    expect(details[0].underlyingToken).to.equal(usdc);
    expect(details[0].collateralToken).to.equal(rwa);
    expect(details[0].totalCash).to.be.gt(0);
  });
});