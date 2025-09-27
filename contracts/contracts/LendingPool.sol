// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./MockPriceOracle.sol";
import "./IHederaTokenService.sol";
import "./HederaResponseCode.sol";

contract LendingPool is ReentrancyGuard, Ownable {
    IHederaTokenService private constant HTS = IHederaTokenService(address(0x167));
    
    string public assetType;
    address public immutable lendingToken;
    address public immutable collateralToken;
    address public immutable lpToken;
    MockPriceOracle public priceOracle;

    uint256 public baseLTV;
    uint256 public reserveFactor = 1000;    // 10%
    uint256 public liquidationBonus = 500;  // 5% bonus

    uint256 public optimalUtilizationRate = 8000;
    uint256 public baseRate = 100;
    uint256 public rateSlope1 = 500;
    uint256 public rateSlope2 = 3000;
    
    uint256 public totalAssets;    
    uint256 public totalBorrows;   
    uint256 public totalReserves;  
    uint256 public protocolFee; 

    uint256 public lastAccrualBlock;
    uint256 public borrowIndex = 1e18;

    mapping(address => uint256) public borrows;
    mapping(address => uint256) public collateral;
    mapping(address => uint256) public lpShares;
    mapping(address => uint256) public borrowerBorrowIndex;

    struct InvestorDeposit { address investor; uint256 amount; uint256 shares; uint256 timestamp; }
    struct DailyStats { uint256 date; uint256 totalAssets; uint256 totalBorrows; uint256 exchangeRate; uint256 utilizationRate; uint256 borrowAPR; }
    mapping(address => InvestorDeposit[]) public investorDeposits;
    mapping(uint256 => DailyStats) public dailyStats;

    event Deposited(address indexed supporter, uint256 amount, uint256 shares, uint256 timestamp);
    event Withdrawn(address indexed supporter, uint256 amount, uint256 shares, uint256 timestamp);
    event CollateralDeposited(address indexed borrower, uint256 tokens, uint256 usdValue);
    event LoanCreated(address indexed borrower, uint256 amount, uint256 borrowIndex);
    event LoanRepaid(address indexed borrower, uint256 principalRepaid, uint256 interestPaid);
    event LoanLiquidated(address indexed borrower, uint256 debtRepaid, uint256 collateralSeized);
    event InterestAccrued(uint256 interestAmount, uint256 newTotalBorrows, uint256 borrowAPR, uint256 timestamp);

    constructor(
        string memory _assetType,
        address _lendingToken,
        address _collateralToken,
        address _lpToken,
        uint256 _baseLTV,
        uint256 _protocolFee,
        address _oracle,
        address _owner
    ) {
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

    // --- Internal Helpers ---
    function _min(uint256 a, uint256 b) private pure returns (uint256) {
        return a < b ? a : b;
    }
    
    function calculateBorrowAPR() internal view returns (uint256) {
        if (totalAssets == 0) return baseRate;
        uint256 utilization = (totalBorrows * 10000) / totalAssets;
        
        if (utilization <= optimalUtilizationRate) {
            return baseRate + (utilization * rateSlope1) / optimalUtilizationRate;
        } else {
            uint256 excessUtilization = utilization - optimalUtilizationRate;
            uint256 excessCapacity = 10000 - optimalUtilizationRate;
            return baseRate + rateSlope1 + (excessUtilization * rateSlope2) / excessCapacity;
        }
    }
    
    function getCurrentBorrowBalance(address borrower) public view returns (uint256) {
        uint256 principal = borrows[borrower];
        if (principal == 0) return 0;
        if (lastAccrualBlock == block.number) return principal;

        return (principal * borrowIndex) / borrowerBorrowIndex[borrower];
    }
    
    // ---------------- Interest Accrual ----------------
    function accrueInterest() public {
        uint256 currentBlock = block.number;
        if (currentBlock == lastAccrualBlock) return;

        uint256 blocksElapsed = currentBlock - lastAccrualBlock;
        if (totalBorrows > 0) {
            uint256 borrowAPR = calculateBorrowAPR();
            
            // Assuming 31536000 seconds/year
            uint256 interestFactor = (borrowAPR * blocksElapsed) / 31536000; 
            uint256 interest = (totalBorrows * interestFactor) / 10000;
            
            totalBorrows += interest;
            borrowIndex += (borrowIndex * interestFactor) / 10000;
            
            uint256 reserves = (interest * reserveFactor) / 10000;
            totalReserves += reserves;

            emit InterestAccrued(interest, totalBorrows, borrowAPR, block.timestamp);
        }

        lastAccrualBlock = currentBlock;
    }

    // ---------------- Liquidation ----------------
    function liquidate(address borrower) external nonReentrant {
        accrueInterest();
        uint256 price = priceOracle.getPrice(assetType);
        uint256 collateralUSD = (collateral[borrower] * price) / 1e18;
        uint256 maxBorrow = (collateralUSD * baseLTV) / 10000;
        uint256 currentDebt = getCurrentBorrowBalance(borrower);

        require(currentDebt > maxBorrow, "Position healthy");

        uint256 debtToRepay = currentDebt;
        
        // Calculate required collateral value including bonus
        uint256 seizedCollateralValueUSD = (debtToRepay * (10000 + liquidationBonus)) / 10000;
        uint256 requiredCollateralTokens = (seizedCollateralValueUSD * 1e18) / price;
        uint256 collateralToSeize = _min(requiredCollateralTokens, collateral[borrower]);

        // 1. Liquidator repays the debt (HTS transfer from msg.sender to this)
        int rc1 = HTS.transferToken(lendingToken, msg.sender, address(this), int64(int256(debtToRepay)));
        require(rc1 == HederaResponseCodes.SUCCESS, "Repay failed");

        // 2. Update pool state
        totalBorrows -= debtToRepay;
        totalAssets += debtToRepay; // Increase liquid assets by the principal/interest repaid
        borrows[borrower] = 0;
        borrowerBorrowIndex[borrower] = 0;

        // 3. Transfer seized collateral to liquidator (HTS transfer from this to msg.sender)
        collateral[borrower] -= collateralToSeize;
        int rc2 = HTS.transferToken(collateralToken, address(this), msg.sender, int64(int256(collateralToSeize)));
        require(rc2 == HederaResponseCodes.SUCCESS, "Seize transfer failed");

        emit LoanLiquidated(borrower, debtToRepay, collateralToSeize);
    }
    
    // ---------------- Investor & Farmer Methods ----------------
    
    function deposit(uint256 amount) external nonReentrant {
        accrueInterest();
        require(amount > 0, "Invalid amount");

        int rc = HTS.transferToken(lendingToken, msg.sender, address(this), int64(int256(amount)));
        require(rc == HederaResponseCodes.SUCCESS, "Transfer failed");

        uint256 shares = (totalAssets == 0) ? amount : (amount * totalLP()) / totalAssets;

        totalAssets += amount;
        lpShares[msg.sender] += shares;

        HTS.mintToken(lpToken, int64(int256(shares)), new bytes[](0));

        investorDeposits[msg.sender].push(InvestorDeposit({investor: msg.sender, amount: amount, shares: shares, timestamp: block.timestamp}));
        emit Deposited(msg.sender, amount, shares, block.timestamp);
    }

    function withdraw(uint256 shares) external nonReentrant {
        accrueInterest();
        require(shares > 0, "Invalid shares");
        require(lpShares[msg.sender] >= shares, "Not enough LP shares");

        uint256 withdrawAmount = (shares * totalAssets) / totalLP();

        lpShares[msg.sender] -= shares;
        totalAssets -= withdrawAmount;

        HTS.burnToken(lpToken, int64(int256(shares)), new int64[](0));

        int rc = HTS.transferToken(lendingToken, address(this), msg.sender, int64(int256(withdrawAmount)));
        require(rc == HederaResponseCodes.SUCCESS, "Withdraw failed");

        emit Withdrawn(msg.sender, withdrawAmount, shares, block.timestamp);
    }

    function depositCollateral(uint256 amount) external nonReentrant {
        accrueInterest();
        require(amount > 0, "Invalid amount");

        int rc = HTS.transferToken(collateralToken, msg.sender, address(this), int64(int256(amount)));
        require(rc == HederaResponseCodes.SUCCESS, "Collateral transfer failed");

        uint256 price = priceOracle.getPrice(assetType);
        uint256 usdValue = (amount * price) / 1e18;

        collateral[msg.sender] += amount;
        emit CollateralDeposited(msg.sender, amount, usdValue);
    }

    function createLoan(uint256 amount) external nonReentrant {
        accrueInterest();
        uint256 price = priceOracle.getPrice(assetType);
        uint256 collateralUSD = (collateral[msg.sender] * price) / 1e18;
        uint256 maxBorrow = (collateralUSD * baseLTV) / 10000;

        require(amount > 0, "Invalid amount");
        uint256 currentDebt = getCurrentBorrowBalance(msg.sender);
        require(currentDebt + amount <= maxBorrow, "Exceeds borrow limit");
        require(amount <= availableLiquidity(), "Not enough liquidity");

        totalBorrows += amount;
        borrows[msg.sender] += amount;
        borrowerBorrowIndex[msg.sender] = borrowIndex;

        int rc = HTS.transferToken(lendingToken, address(this), msg.sender, int64(int256(amount)));
        require(rc == HederaResponseCodes.SUCCESS, "Loan transfer failed");
        emit LoanCreated(msg.sender, amount, borrowIndex);
    }

    function repayLoan(uint256 amount) external nonReentrant {
        accrueInterest();
        uint256 currentDebt = getCurrentBorrowBalance(msg.sender);
        require(currentDebt > 0, "No active loan");
        require(amount > 0, "Invalid amount");

        uint256 totalRepayment = amount;
        uint256 principalPlusInterest = currentDebt;
        uint256 repayAmount = _min(totalRepayment, principalPlusInterest);
        
        uint256 interestPaid = principalPlusInterest - borrows[msg.sender];
        uint256 principalRepaid = repayAmount > interestPaid ? repayAmount - interestPaid : 0;
        
        int rc = HTS.transferToken(lendingToken, msg.sender, address(this), int64(int256(totalRepayment)));
        require(rc == HederaResponseCodes.SUCCESS, "Repay transfer failed");

        borrows[msg.sender] = principalPlusInterest - repayAmount;
        totalBorrows -= principalRepaid;
        totalAssets += principalRepaid;
        totalReserves += interestPaid;

        borrowerBorrowIndex[msg.sender] = borrows[msg.sender] == 0 ? 0 : borrowIndex;

        emit LoanRepaid(msg.sender, principalRepaid, interestPaid);
    }
    
    // ---------------- Views ----------------
    function utilizationRate() public view returns (uint256) {
        if (totalAssets == 0) return 0;
        return (totalBorrows * 10000) / totalAssets;
    }

    function availableLiquidity() public view returns (uint256) {
        return totalAssets - totalBorrows;
    }

    function exchangeRate() public view returns (uint256) {
        if (totalLP() == 0) return 1e18;
        uint256 totalValue = totalAssets + totalReserves;
        return (totalValue * 1e18) / totalLP();
    }

    function totalLP() public view returns (uint256) {
        return totalAssets;
    }
    
    function currentAPR() external view returns (uint256) {
        return calculateBorrowAPR(); 
    }
}