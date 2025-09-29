const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Simple Lending Test", function () {
    let factory, lendingPool, priceOracle;
    let owner, liquidityProvider, borrower;
    let lendingToken, collateralToken, lpToken;

    const ASSET_TYPE = "Wheat";
    const BASE_LTV = 7500; // 75%
    const PROTOCOL_FEE = 1000; // 10%
    const INITIAL_PRICE = ethers.parseEther("2.0");

    beforeEach(async function () {
        [owner, liquidityProvider, borrower] = await ethers.getSigners();

        // Deploy MockPriceOracle
        const MockPriceOracle = await ethers.getContractFactory("MockPriceOracle");
        priceOracle = await MockPriceOracle.deploy();
        await priceOracle.waitForDeployment();
        await priceOracle.setPrice(ASSET_TYPE, INITIAL_PRICE);

        // Deploy LendingFactory
        const LendingFactory = await ethers.getContractFactory("LendingFactory");
        factory = await LendingFactory.deploy();
        await factory.waitForDeployment();

        // Create mock token addresses (using owner address as mock)
        lendingToken = owner.address;
        collateralToken = liquidityProvider.address;
        lpToken = borrower.address;

        // Create pool
        const tx = await factory.createPool(
            ASSET_TYPE,
            lendingToken,
            collateralToken,
            lpToken,
            BASE_LTV,
            PROTOCOL_FEE,
            INITIAL_PRICE
        );
        const receipt = await tx.wait();

        // Get pool address from event
        const poolCreatedEvent = receipt.logs.find(log => {
            try {
                const parsed = factory.interface.parseLog(log);
                return parsed && parsed.name === 'PoolCreated';
            } catch (e) {
                return false;
            }
        });

        expect(poolCreatedEvent).to.not.be.undefined;
        const parsed = factory.interface.parseLog(poolCreatedEvent);
        const poolAddress = parsed.args.pool;

        lendingPool = await ethers.getContractAt("LendingPool", poolAddress);
    });

    it("Should deploy contracts successfully", async function () {
        expect(await factory.getAddress()).to.not.equal(ethers.ZeroAddress);
        expect(await lendingPool.getAddress()).to.not.equal(ethers.ZeroAddress);
        expect(await priceOracle.getAddress()).to.not.equal(ethers.ZeroAddress);
    });

    it("Should have correct initial configuration", async function () {
        expect(await lendingPool.assetType()).to.equal(ASSET_TYPE);
        expect(await lendingPool.baseLTV()).to.equal(BASE_LTV);
        expect(await lendingPool.protocolFee()).to.equal(PROTOCOL_FEE);
        expect(await lendingPool.lendingToken()).to.equal(lendingToken);
        expect(await lendingPool.collateralToken()).to.equal(collateralToken);
        expect(await lendingPool.lpToken()).to.equal(lpToken);
    });

    it("Should have correct initial state", async function () {
        expect(await lendingPool.totalAssets()).to.equal(0);
        expect(await lendingPool.totalBorrows()).to.equal(0);
        expect(await lendingPool.totalReserves()).to.equal(0);
        expect(await lendingPool.availableLiquidity()).to.equal(0);
    });

    it("Should calculate utilization rate correctly", async function () {
        const utilization = await lendingPool.utilizationRate();
        expect(utilization).to.equal(0); // No borrows initially
    });

    it("Should calculate current APR correctly", async function () {
        const currentAPR = await lendingPool.currentAPR();
        expect(currentAPR).to.be.greaterThan(0);
    });

    it("Should handle interest accrual", async function () {
        // This should not revert even with no borrows
        const tx = await lendingPool.accrueInterest();
        await expect(tx).to.not.be.reverted;
    });

    it("Should handle pause/unpause", async function () {
        // Pause
        await lendingPool.pause();
        expect(await lendingPool.paused()).to.be.true;

        // Unpause
        await lendingPool.unpause();
        expect(await lendingPool.paused()).to.be.false;
    });

    it("Should handle ownership transfer", async function () {
        const newOwner = liquidityProvider;
        
        await lendingPool.transferOwnership(await newOwner.getAddress());
        expect(await lendingPool.owner()).to.equal(await newOwner.getAddress());
    });
});