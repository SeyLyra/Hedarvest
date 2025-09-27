// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
// NOTE: Ensure these dependencies (MockPriceOracle, IHederaTokenService, HederaResponseCode) 
// are available in your compilation environment.
import "./MockPriceOracle.sol";
import "./IHederaTokenService.sol";
import "./HederaResponseCode.sol";

/**
 * @title LendingPool
 * @dev A DeFi lending and borrowing pool for Hedera EVM, using HTS for token transfers.
 * Implements variable interest rate model and liquidation logic.
 */
contract LendingPool is ReentrancyGuard, Ownable, Pausable {
    // Hedera Token Service system contract address
    IHederaTokenService private constant HTS = IHederaTokenService(address(0x167));
    
    // === Constants ===
    uint256 public constant MAX_BASE_LTV = 9500; // 95% max LTV
    uint256 public constant MAX_PROTOCOL_FEE = 2000; // 20% max protocol fee
    uint256 public constant MAX_RESERVE_FACTOR = 5000; // 50% max reserve factor
    uint256 public constant MAX_LIQUIDATION_BONUS = 2000; // 20% max liquidation bonus
    uint256 public constant MIN_LIQUIDATION_BONUS = 500; // 5% min liquidation bonus
    uint256 public constant MAX_UTILIZATION_RATE = 9500; // 95% max utilization
    uint256 public constant PRECISION = 1e18; // Standard 18 decimal precision
    uint256 public constant BLOCKS_PER_YEAR = 365 * 24 * 60 * 60 / 3; // Assuming 3-second blocks
    
    // === Pool Configuration & State Variables ===
    string public assetType; // e.g., "Rice", "Corn"
    address public immutable lendingToken; // The token supplied by investors and borrowed by farmers
    address public immutable collateralToken; // The token used as collateral
    address public immutable lpToken; // The LP share token (HTS Token ID)
    MockPriceOracle public priceOracle;

    // Interest Rate Model Parameters
    uint256 public baseLTV;
    uint256 public reserveFactor = 1000;    // 10% of accrued interest goes to reserves
    uint256 public liquidationBonus = 500;  // 5% bonus for liquidators

    uint256 public optimalUtilizationRate = 8000; // 80%
    uint256 public baseRate = 100; // 1%
    uint256 public rateSlope1 = 500; // 5%
    uint256 public rateSlope2 = 3000; // 30%

    // Financial Metrics
    uint256 public totalAssets;    // Total value of the pool (liquid cash + totalBorrows - totalReserves)
    uint256 public totalBorrows;   // Total principal and interest owed by borrowers
    uint256 public totalReserves;  // Protocol-owned assets (built from reserve factor split of interest)
    uint256 public protocolFee;    // Configured protocol fee rate

    // LP Supply (CRITICAL FIX: Manual tracking for HTS compatibility)
    uint256 public lpTokenSupply; 

    // Interest Tracking
    uint256 public lastAccrualBlock;
    uint256 public borrowIndex = PRECISION; // Used to track interest accrual over time

    // User Data
    mapping(address => uint256) public borrows; // Principal balance at time of last update/borrow
    mapping(address => uint256) public collateral;
    mapping(address => uint256) public lpShares;
    mapping(address => uint256) public borrowerBorrowIndex; // Borrower's borrowIndex at time of loan/repay

    // === Events ===
    event Deposited(address indexed supporter, uint256 amount, uint256 shares, uint256 timestamp);
    event Withdrawn(address indexed supporter, uint256 amount, uint256 shares, uint256 timestamp);
    event CollateralDeposited(address indexed borrower, uint256 tokens, uint256 usdValue);
    event LoanCreated(address indexed borrower, uint256 amount, uint256 borrowIndex);
    event LoanRepaid(address indexed borrower, uint256 principalRepaid, uint256 interestPaid);
    event LoanLiquidated(address indexed borrower, uint256 debtRepaid, uint256 collateralSeized);
    event InterestAccrued(uint256 interestAmount, uint256 newTotalBorrows, uint256 borrowAPR, uint256 timestamp);
    event ParametersUpdated(string parameter, uint256 oldValue, uint256 newValue);

    // === Modifiers and Constructor ===
    modifier validAmount(uint256 amount) {
        require(amount > 0, "Amount must be greater than zero");
        _;
    }

    modifier validAddress(address addr) {
        require(addr != address(0), "Invalid address");
        _;
    }

    modifier onlyValidAssetType(string memory _assetType) {
        require(bytes(_assetType).length > 0, "Asset type cannot be empty");
        _;
    }

    constructor(
        string memory _assetType,
        address _lendingToken,
        address _collateralToken,
        address _lpToken,
        uint256 _baseLTV,
        uint256 _protocolFee,
        address _oracle,
        address _owner
    ) validAddress(_lendingToken) validAddress(_collateralToken) validAddress(_lpToken) validAddress(_oracle) validAddress(_owner) onlyValidAssetType(_assetType) {
        require(_baseLTV <= MAX_BASE_LTV, "Base LTV too high");
        require(_protocolFee <= MAX_PROTOCOL_FEE, "Protocol fee too high");
        require(_lendingToken != _collateralToken, "Lending and collateral tokens must be different");
        require(_lendingToken != _lpToken, "Lending and LP tokens must be different");
        
        assetType = _assetType;
        lendingToken = _lendingToken;
        collateralToken = _collateralToken;
        lpToken = _lpToken;
        baseLTV = _baseLTV;
        protocolFee = _protocolFee;
        priceOracle = MockPriceOracle(_oracle);
        
        transferOwnership(_owner);
        lastAccrualBlock = block.number;
    }

    // === Internal Helpers ===
    function _min(uint256 a, uint256 b) private pure returns (uint256) {
        return a < b ? a : b;
    }
    
    function _safeSub(uint256 a, uint256 b) private pure returns (uint256) {
        require(b <= a, "Subtraction overflow");
        return a - b;
    }

    function _safeDiv(uint256 a, uint256 b) private pure returns (uint256) {
        require(b > 0, "Division by zero");
        return a / b;
    }

    function _safeMulDiv(uint256 a, uint256 b, uint256 c) private pure returns (uint256) {
        require(c > 0, "Division by zero");
        return (a * b) / c;
    }
    
    /**
     * @dev Calculates the Borrow Annual Percentage Rate (APR) based on utilization.
     */
    function calculateBorrowAPR() internal view returns (uint256) {
        // totalAssets is used here as a proxy for the total funds available/backed by the pool.
        if (totalAssets + totalReserves == 0) return baseRate;
        
        uint256 utilization = utilizationRate();
        require(utilization <= 10000, "Utilization exceeds 100%");
        
        if (utilization <= optimalUtilizationRate) {
            // Linear rate increase up to optimal utilization
            return baseRate + _safeMulDiv(utilization, rateSlope1, optimalUtilizationRate);
        } else {
            // Steep rate increase above optimal utilization
            uint256 excessUtilization = utilization - optimalUtilizationRate;
            uint256 excessCapacity = 10000 - optimalUtilizationRate;
            require(excessCapacity > 0, "Invalid optimal utilization rate");
            return baseRate + rateSlope1 + _safeMulDiv(excessUtilization, rateSlope2, excessCapacity);
        }
    }
    
    /**
     * @dev Calculates the borrower's total debt (principal + accrued interest) as of the current block.
     */
    function getCurrentBorrowBalance(address borrower) public view validAddress(borrower) returns (uint256) {
        uint256 principal = borrows[borrower];
        if (principal == 0) return 0;

        // If accrual has run on this block, use the global borrowIndex
        if (lastAccrualBlock == block.number) {
             return _safeMulDiv(principal, borrowIndex, borrowerBorrowIndex[borrower]);
        }
        
        // Calculate accrued interest since last global accrual for a view function
        uint256 blocksElapsed = block.number - lastAccrualBlock;
        uint256 borrowAPR = calculateBorrowAPR();
        uint256 interestFactor = _safeMulDiv(borrowAPR, blocksElapsed, BLOCKS_PER_YEAR);
        
        // Project the borrowIndex forward
        uint256 projectedBorrowIndex = borrowIndex + _safeMulDiv(borrowIndex, interestFactor, 10000);

        return _safeMulDiv(principal, projectedBorrowIndex, borrowerBorrowIndex[borrower]);
    }
    
    // === Interest Accrual ===
    /**
     * @dev Accrues interest on all outstanding borrows. This function must be called 
     * before any state-changing function (deposit, withdraw, createLoan, repayLoan).
     */
    function accrueInterest() public {
        uint256 currentBlock = block.number;
        if (currentBlock == lastAccrualBlock) return;

        uint256 blocksElapsed = currentBlock - lastAccrualBlock;
        
        if (totalBorrows > 0) {
            uint256 borrowAPR = calculateBorrowAPR();
            
            // Calculate total interest over the elapsed time
            uint256 interestFactor = _safeMulDiv(borrowAPR, blocksElapsed, BLOCKS_PER_YEAR);
            uint256 interest = _safeMulDiv(totalBorrows, interestFactor, 10000);
            
            // 1. Update total outstanding debt
            totalBorrows += interest;
            borrowIndex += _safeMulDiv(borrowIndex, interestFactor, 10000);
            
            // 2. Split interest into reserves (protocol fee)
            uint256 reserves = _safeMulDiv(interest, reserveFactor, 10000);
            totalReserves += reserves;
            
            // 3. The remainder increases the total value backing the LP shares
            // This is the profit for depositors
            uint256 depositorProfit = _safeSub(interest, reserves);
            totalAssets += depositorProfit;
            
            emit InterestAccrued(interest, totalBorrows, borrowAPR, block.timestamp);
        }

        lastAccrualBlock = currentBlock;
    }

    // === Liquidation (Remains unchanged in core logic) ===
    function liquidate(address borrower) external nonReentrant whenNotPaused validAddress(borrower) {
        // Ensure pool state is current
        accrueInterest(); 
        uint256 price = priceOracle.getPrice(assetType);
        require(price > 0, "Invalid price");
        
        uint256 collateralAmount = collateral[borrower];
        require(collateralAmount > 0, "No collateral to liquidate");
        
        uint256 collateralUSD = _safeMulDiv(collateralAmount, price, PRECISION);
        uint256 maxBorrow = _safeMulDiv(collateralUSD, baseLTV, 10000);
        uint256 currentDebt = getCurrentBorrowBalance(borrower);

        require(currentDebt > 0, "No debt to liquidate");
        require(currentDebt > maxBorrow, "Position healthy"); // Health check

        uint256 debtToRepay = currentDebt;
        
        // Calculate required collateral value including bonus
        uint256 seizedCollateralValueUSD = _safeMulDiv(debtToRepay, 10000 + liquidationBonus, 10000);
        uint256 requiredCollateralTokens = _safeMulDiv(seizedCollateralValueUSD, PRECISION, price);
        uint256 collateralToSeize = _min(requiredCollateralTokens, collateral[borrower]);

        require(collateralToSeize > 0, "Invalid collateral to seize");

        // 1. Liquidator repays the debt (HTS transfer from msg.sender to this)
        int rc1 = HTS.transferToken(lendingToken, msg.sender, address(this), int64(int256(debtToRepay)));
        require(rc1 == HederaResponseCodes.SUCCESS, "Repay failed");

        // 2. Update pool state: debt is cleared, and liquid assets increase
        totalBorrows = _safeSub(totalBorrows, debtToRepay);
        // Note: totalAssets already represents the total value backing LP shares (liquid + borrowed + interest).
        // Since the liquidator repaid the debt, the full 'debtToRepay' becomes liquid cash in the pool.
        totalAssets += debtToRepay; 

        borrows[borrower] = 0;
        borrowerBorrowIndex[borrower] = 0;

        // 3. Transfer seized collateral to liquidator (HTS transfer from this to msg.sender)
        collateral[borrower] = _safeSub(collateral[borrower], collateralToSeize);
        int rc2 = HTS.transferToken(collateralToken, address(this), msg.sender, int64(int256(collateralToSeize)));
        require(rc2 == HederaResponseCodes.SUCCESS, "Seize transfer failed");

        emit LoanLiquidated(borrower, debtToRepay, collateralToSeize);
    }
    
    // === Investor & Farmer Methods ===
    
    function deposit(uint256 amount) external nonReentrant whenNotPaused validAmount(amount) {
        accrueInterest();

        // 1. Transfer funds from user to pool (HTS)
        int rc = HTS.transferToken(lendingToken, msg.sender, address(this), int64(int256(amount)));
        require(rc == HederaResponseCodes.SUCCESS, "Transfer failed");

        uint256 shares;
        uint256 totalPoolValue = totalAssets + totalReserves;
        
        if (lpTokenSupply == 0) { 
            // First deposit sets the initial exchange rate 1:1
            shares = amount;
        } else {
            // Shares = amount * lpTokenSupply / TotalPoolValue
            require(totalPoolValue > 0, "Invalid pool value");
            shares = _safeMulDiv(amount, lpTokenSupply, totalPoolValue);
        }

        // 2. Update state variables
        totalAssets += amount;
        lpShares[msg.sender] += shares;
        lpTokenSupply += shares; // FIX: Manually track LP token supply

        // 3. Mint LP token to the user (HTS)
        (int64 mintRc,,) = HTS.mintToken(lpToken, int64(int256(shares)), new bytes[](0));
        require(mintRc == HederaResponseCodes.SUCCESS, "LP token mint failed");
        
        emit Deposited(msg.sender, amount, shares, block.timestamp);
    }

    function withdraw(uint256 shares) external nonReentrant whenNotPaused validAmount(shares) {
        accrueInterest();
        require(lpShares[msg.sender] >= shares, "Insufficient LP shares");

        require(lpTokenSupply > 0, "Invalid LP supply"); 
        
        uint256 totalPoolValue = totalAssets + totalReserves;
        require(totalPoolValue > 0, "No assets to withdraw");

        // Withdraw Amount = shares * Total Pool Value / lpTokenSupply
        uint256 withdrawAmount = _safeMulDiv(shares, totalPoolValue, lpTokenSupply);

        // Safety check to ensure the pool has enough liquid funds to cover the withdrawal
        require(withdrawAmount <= availableLiquidity(), "Insufficient liquidity");
        
        // 1. Update state variables
        lpShares[msg.sender] = _safeSub(lpShares[msg.sender], shares);
        lpTokenSupply = _safeSub(lpTokenSupply, shares); // FIX: Update supply
        
        // Remove value from totalAssets
        totalAssets = _safeSub(totalAssets, withdrawAmount); 

        // 2. Burn LP token (HTS)
        (int64 burnRc,) = HTS.burnToken(lpToken, int64(int256(shares)), new int64[](0));
        require(burnRc == HederaResponseCodes.SUCCESS, "LP token burn failed");

        // 3. Transfer funds back to user (HTS)
        int rc = HTS.transferToken(lendingToken, address(this), msg.sender, int64(int256(withdrawAmount)));
        require(rc == HederaResponseCodes.SUCCESS, "Withdraw failed");

        emit Withdrawn(msg.sender, withdrawAmount, shares, block.timestamp);
    }

    function depositCollateral(uint256 amount) external nonReentrant whenNotPaused validAmount(amount) {
        accrueInterest();

        int rc = HTS.transferToken(collateralToken, msg.sender, address(this), int64(int256(amount)));
        require(rc == HederaResponseCodes.SUCCESS, "Collateral transfer failed");

        uint256 price = priceOracle.getPrice(assetType);
        require(price > 0, "Invalid price");
        uint256 usdValue = _safeMulDiv(amount, price, PRECISION);

        collateral[msg.sender] += amount;
        emit CollateralDeposited(msg.sender, amount, usdValue);
    }

    function createLoan(uint256 amount) external nonReentrant whenNotPaused validAmount(amount) {
        accrueInterest();
        
        uint256 collateralAmount = collateral[msg.sender];
        require(collateralAmount > 0, "No collateral deposited");
        
        uint256 price = priceOracle.getPrice(assetType);
        require(price > 0, "Invalid price");
        
        uint256 collateralUSD = _safeMulDiv(collateralAmount, price, PRECISION);
        uint256 maxBorrow = _safeMulDiv(collateralUSD, baseLTV, 10000);
        
        // Need to use current debt (which includes accrued interest) for the safety check
        uint256 currentDebt = getCurrentBorrowBalance(msg.sender); 
        uint256 newTotalDebt = currentDebt + amount;

        require(newTotalDebt <= maxBorrow, "Exceeds borrow limit");
        require(amount <= availableLiquidity(), "Insufficient liquidity");

        // Update total borrows and borrower's principal
        totalBorrows += amount;
        borrows[msg.sender] += amount;
        borrowerBorrowIndex[msg.sender] = borrowIndex; // Mark this new principal at the current index

        // Update totalAssets (This liquidates pool funds)
        totalAssets = _safeSub(totalAssets, amount);

        // Transfer loan funds to borrower (HTS)
        int rc = HTS.transferToken(lendingToken, address(this), msg.sender, int64(int256(amount)));
        require(rc == HederaResponseCodes.SUCCESS, "Loan transfer failed");
        
        emit LoanCreated(msg.sender, amount, borrowIndex);
    }

    function repayLoan(uint256 amount) external nonReentrant whenNotPaused validAmount(amount) {
        // Accrue interest up to this block to ensure currentDebt is accurate
        accrueInterest(); 
        
        uint256 currentDebt = getCurrentBorrowBalance(msg.sender);
        require(currentDebt > 0, "No active loan");

        uint256 repayAmount = _min(amount, currentDebt);
        
        // 1. HTS transfer from user to pool
        int rc = HTS.transferToken(lendingToken, msg.sender, address(this), int64(int256(repayAmount)));
        require(rc == HederaResponseCodes.SUCCESS, "Repay transfer failed");

        // Calculate components (principal balance is the amount at last index update)
        uint256 principalAtLastIndex = borrows[msg.sender];
        uint256 accruedInterest = currentDebt > principalAtLastIndex ? currentDebt - principalAtLastIndex : 0;
        
        // Determine how the repayment is split: interest first, then principal.
        uint256 interestRepaid = _min(repayAmount, accruedInterest);
        uint256 principalRepaid = _safeSub(repayAmount, interestRepaid);

        // 2. Update state variables
        
        // A. Handle Principal Repayment
        borrows[msg.sender] = _safeSub(principalAtLastIndex, principalRepaid);
        totalBorrows = _safeSub(totalBorrows, principalRepaid); // Only subtract principal
        
        // B. Handle Interest Repayment (split interest into reserves and liquid assets)
        uint256 reservesSplit = _safeMulDiv(interestRepaid, reserveFactor, 10000);
        uint256 liquiditySplit = _safeSub(interestRepaid, reservesSplit);
        
        // Funds repaid become liquid
        totalReserves += reservesSplit;
        totalAssets += liquiditySplit; 

        // Update the borrower's index only if the loan is not fully repaid
        borrowerBorrowIndex[msg.sender] = borrows[msg.sender] == 0 ? 0 : borrowIndex;

        emit LoanRepaid(msg.sender, principalRepaid, interestRepaid);
    }

    // === Views ===
    function utilizationRate() public view returns (uint256) {
        // Use totalAssets + totalReserves as the total pool value (TVL)
        uint256 totalPoolValue = totalAssets + totalReserves; 
        if (totalPoolValue == 0) return 0;
        return _safeMulDiv(totalBorrows, 10000, totalPoolValue);
    }

    function availableLiquidity() public view returns (uint256) {
        return totalAssets > totalBorrows ? totalAssets - totalBorrows : 0;
    }

    function exchangeRate() public view returns (uint256) {
        uint256 totalLPSupply = lpTokenSupply; // FIX: Use tracked supply
        if (totalLPSupply == 0) return PRECISION;
        uint256 totalPoolValue = totalAssets + totalReserves;
        return _safeMulDiv(totalPoolValue, PRECISION, totalLPSupply);
    }

    function totalLP() public view returns (uint256) {
        return lpTokenSupply; // FIX: Use tracked supply
    }

    function currentAPR() external view returns (uint256) {
        return calculateBorrowAPR(); 
    }

    /**
     * @dev Returns the collateral amount currently deposited by a specific borrower.
     */
    function getCollateralBalance(address borrower) external view validAddress(borrower) returns (uint256) {
        return collateral[borrower];
    }

    function getHealthFactor(address borrower) external view validAddress(borrower) returns (uint256) {
        uint256 collateralAmount = collateral[borrower];
        if (collateralAmount == 0) return 0;
        
        uint256 price = priceOracle.getPrice(assetType);
        if (price == 0) return 0;
        
        uint256 collateralUSD = _safeMulDiv(collateralAmount, price, PRECISION);
        uint256 maxBorrow = _safeMulDiv(collateralUSD, baseLTV, 10000);
        
        // Note: This calls the view function, calculating interest up to the current block.
        uint256 currentDebt = getCurrentBorrowBalance(borrower); 
        
        if (currentDebt == 0) return type(uint256).max; // Infinite health for zero debt
        // Health Factor = maxBorrow * PRECISION / currentDebt (Liquidation threshold is 1)
        return _safeMulDiv(maxBorrow, PRECISION, currentDebt);
    }

    // === Admin Functions (Omitted for brevity, but exist in original) ===
    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }
    function updateReserveFactor(uint256 newReserveFactor) external onlyOwner { 
        require(newReserveFactor <= MAX_RESERVE_FACTOR, "Reserve factor too high");
        uint256 oldValue = reserveFactor;
        reserveFactor = newReserveFactor;
        emit ParametersUpdated("reserveFactor", oldValue, newReserveFactor);
    }
    // ... other admin functions
    function updateLiquidationBonus(uint256 newLiquidationBonus) external onlyOwner {
        require(newLiquidationBonus >= MIN_LIQUIDATION_BONUS && newLiquidationBonus <= MAX_LIQUIDATION_BONUS, "Invalid liquidation bonus");
        uint256 oldValue = liquidationBonus;
        liquidationBonus = newLiquidationBonus;
        emit ParametersUpdated("liquidationBonus", oldValue, newLiquidationBonus);
    }
    function updateOptimalUtilizationRate(uint256 newOptimalUtilizationRate) external onlyOwner {
        require(newOptimalUtilizationRate <= MAX_UTILIZATION_RATE, "Optimal utilization rate too high");
        uint256 oldValue = optimalUtilizationRate;
        optimalUtilizationRate = newOptimalUtilizationRate;
        emit ParametersUpdated("optimalUtilizationRate", oldValue, newOptimalUtilizationRate);
    }
    function updateInterestRateParameters(
        uint256 newBaseRate,
        uint256 newRateSlope1,
        uint256 newRateSlope2
    ) external onlyOwner {
        require(newBaseRate <= 10000, "Base rate too high");
        require(newRateSlope1 <= 10000, "Rate slope 1 too high");
        require(newRateSlope2 <= 10000, "Rate slope 2 too high");
        
        baseRate = newBaseRate;
        rateSlope1 = newRateSlope1;
        rateSlope2 = newRateSlope2;
        
        emit ParametersUpdated("interestRateParameters", 0, newBaseRate);
    }
    
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner validAddress(token) validAmount(amount) {
        require(token != lendingToken || amount <= totalReserves, "Cannot withdraw more than reserves");
        
        int rc = HTS.transferToken(token, address(this), msg.sender, int64(int256(amount)));
        require(rc == HederaResponseCodes.SUCCESS, "Emergency withdraw failed");
    }
}
