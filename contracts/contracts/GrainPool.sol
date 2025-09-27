// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "./MockPriceOracle.sol";

/// @title GrainPool
/// @notice Lending pool with LP tokens, collateral & interest accrual
contract GrainPool is ReentrancyGuard, Ownable, ERC20Burnable {
    string public grainType;
    IERC20 public immutable lendingToken;
    IERC20 public immutable collateralToken;
    MockPriceOracle public priceOracle;

    uint256 public baseLTV;        // loan-to-value (bps)
    uint256 public riskPremium;    // interest rate (bps)
    uint256 public debtCeiling;    
    uint256 public protocolFee;    

    uint256 public totalAssets;    
    uint256 public totalBorrows;   
    uint256 public totalReserves;  

    uint256 public lastAccrualBlock;
    uint256 public borrowIndex = 1e18;

    mapping(address => uint256) public borrows;
    mapping(address => uint256) public collateral; // farmer collateral deposits

    // Historical tracking for investor dashboard
    struct InvestorDeposit {
        address investor;
        uint256 amount;
        uint256 shares;
        uint256 timestamp;
    }

    struct DailyStats {
        uint256 date;
        uint256 totalAssets;
        uint256 totalBorrows;
        uint256 exchangeRate;
        uint256 utilizationRate;
    }

    mapping(address => InvestorDeposit[]) public investorDeposits;
    mapping(uint256 => DailyStats) public dailyStats; // date => stats

    // Enhanced events with timestamps
    event Deposited(
        address indexed supporter, 
        uint256 amount, 
        uint256 shares,
        uint256 timestamp
    );
    event Withdrawn(
        address indexed supporter, 
        uint256 amount, 
        uint256 shares,
        uint256 timestamp
    );
    event CollateralDeposited(address indexed farmer, uint256 tokens, uint256 usdValue);
    event LoanCreated(address indexed farmer, uint256 amount);
    event LoanRepaid(address indexed farmer, uint256 amount, uint256 interest);
    event LoanLiquidated(address indexed farmer, uint256 repaid, uint256 collateralSeized);
    
    // New events for dashboard
    event PoolStatsUpdated(
        uint256 totalAssets,
        uint256 totalBorrows,
        uint256 utilizationRate,
        uint256 exchangeRate,
        uint256 timestamp
    );
    event InterestAccrued(
        uint256 interestAmount,
        uint256 newTotalBorrows,
        uint256 timestamp
    );

    constructor(
        string memory _grainType,
        address _lendingToken,
        address _collateralToken,
        uint256 _baseLTV,
        uint256 _riskPremium,
        uint256 _debtCeiling,
        uint256 _protocolFee,
        address _oracle,
        address _owner
    ) ERC20(
        string(abi.encodePacked(_grainType, " Pool Token")),
        string(abi.encodePacked("g", _grainType, "LP"))
    ) {
        grainType = _grainType;
        lendingToken = IERC20(_lendingToken);
        collateralToken = IERC20(_collateralToken);
        baseLTV = _baseLTV;
        riskPremium = _riskPremium;
        debtCeiling = _debtCeiling;
        protocolFee = _protocolFee;
        priceOracle = MockPriceOracle(_oracle);
        transferOwnership(_owner);
        lastAccrualBlock = block.number;
    }

    // ---------------- Interest Accrual ----------------
    function accrueInterest() public {
        uint256 currentBlock = block.number;
        if (currentBlock == lastAccrualBlock) return;

        uint256 blocksElapsed = currentBlock - lastAccrualBlock;
        if (totalBorrows > 0) {
            uint256 interest = (totalBorrows * riskPremium * blocksElapsed) / 10000;
            totalBorrows += interest;
            totalReserves += (interest * protocolFee) / 10000;
            borrowIndex += (borrowIndex * riskPremium * blocksElapsed) / 10000;
            
            emit InterestAccrued(interest, totalBorrows, block.timestamp);
        }

        lastAccrualBlock = currentBlock;
    }

    // ---------------- Investor ----------------
    function deposit(uint256 amount) external nonReentrant {
        accrueInterest();
        require(amount > 0, "Invalid amount");
        require(lendingToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");

        uint256 shares;
        if (totalSupply() == 0 || totalAssets == 0) {
            shares = amount;
        } else {
            shares = (amount * totalSupply()) / totalAssets;
        }

        totalAssets += amount;
        _mint(msg.sender, shares);

        // Track deposit history
        investorDeposits[msg.sender].push(InvestorDeposit({
            investor: msg.sender,
            amount: amount,
            shares: shares,
            timestamp: block.timestamp
        }));

        emit Deposited(msg.sender, amount, shares, block.timestamp);
    }

    function withdraw(uint256 shares) external nonReentrant {
        accrueInterest();
        require(shares > 0, "Invalid shares");
        require(balanceOf(msg.sender) >= shares, "Not enough LP");

        uint256 withdrawAmount = (shares * totalAssets) / totalSupply();

        _burn(msg.sender, shares);
        totalAssets -= withdrawAmount;

        require(lendingToken.transfer(msg.sender, withdrawAmount), "Transfer failed");

        emit Withdrawn(msg.sender, withdrawAmount, shares, block.timestamp);
    }

    // ---------------- Farmer ----------------
    function depositCollateral(uint256 amount) external nonReentrant {
        accrueInterest();
        require(amount > 0, "Invalid amount");
        require(collateralToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");

        uint256 price = priceOracle.getPrice(grainType);
        uint256 usdValue = (amount * price) / 1e18;

        collateral[msg.sender] += amount;

        emit CollateralDeposited(msg.sender, amount, usdValue);
    }

    function createLoan(uint256 amount) external nonReentrant {
        accrueInterest();
        uint256 price = priceOracle.getPrice(grainType);
        uint256 collateralUSD = (collateral[msg.sender] * price) / 1e18;
        uint256 maxBorrow = (collateralUSD * baseLTV) / 10000;

        require(amount <= maxBorrow, "Exceeds borrow limit");
        require(amount <= availableLiquidity(), "Not enough liquidity");

        totalBorrows += amount;
        borrows[msg.sender] += amount;

        require(lendingToken.transfer(msg.sender, amount), "Transfer failed");
        emit LoanCreated(msg.sender, amount);
    }

    function repayLoan(uint256 amount) external nonReentrant {
        accrueInterest();
        require(borrows[msg.sender] > 0, "No loan");

        uint256 repayAmount = amount > borrows[msg.sender] ? borrows[msg.sender] : amount;
        uint256 interest = (repayAmount * riskPremium) / 10000;
        uint256 totalRepayment = repayAmount + interest;

        require(lendingToken.transferFrom(msg.sender, address(this), totalRepayment), "Transfer failed");

        borrows[msg.sender] -= repayAmount;
        totalBorrows -= repayAmount;
        totalAssets += repayAmount;
        totalReserves += interest;

        emit LoanRepaid(msg.sender, repayAmount, interest);
    }

    function liquidate(address farmer) external nonReentrant {
        accrueInterest();
        uint256 price = priceOracle.getPrice(grainType);
        uint256 collateralUSD = (collateral[farmer] * price) / 1e18;
        uint256 maxBorrow = (collateralUSD * baseLTV) / 10000;

        require(borrows[farmer] > maxBorrow, "Position healthy");

        uint256 debt = borrows[farmer];
        uint256 seized = collateral[farmer];

        borrows[farmer] = 0;
        collateral[farmer] = 0;
        totalBorrows -= debt;

        require(collateralToken.transfer(msg.sender, seized), "Seize failed");
        emit LoanLiquidated(farmer, debt, seized);
    }

    // ---------------- Views ----------------
    function availableLiquidity() public view returns (uint256) {
        return totalAssets - totalBorrows;
    }

    function exchangeRate() public view returns (uint256) {
        if (totalSupply() == 0) return 1e18;
        uint256 totalValue = totalAssets + totalReserves;
        return (totalValue * 1e18) / totalSupply();
    }

    function getBorrowerPosition(address farmer) external view returns (
        uint256 depositedCollateral,
        uint256 collateralUSD,
        uint256 borrowed,
        uint256 maxBorrow,
        uint256 healthFactor
    ) {
        uint256 price = priceOracle.getPrice(grainType);
        uint256 collateralValue = (collateral[farmer] * price) / 1e18;
        uint256 limit = (collateralValue * baseLTV) / 10000;
        uint256 health = borrows[farmer] == 0 ? type(uint256).max : (limit * 1e18) / borrows[farmer];

        return (
            collateral[farmer],
            collateralValue,
            borrows[farmer],
            limit,
            health
        );
    }

    // ------------------------------
    // Investor Dashboard Functions
    // ------------------------------
    
    // Get investor's LP token balance
    function getInvestorShares(address investor) external view returns (uint256) {
        return balanceOf(investor);
    }

    // Get investor's share value in USD
    function getInvestorValue(address investor) external view returns (uint256) {
        uint256 shares = balanceOf(investor);
        if (shares == 0) return 0;
        return (shares * exchangeRate()) / 1e18;
    }

    // Get investor's yield earned (difference between current value and initial deposit)
    function getInvestorYield(address investor) external view returns (uint256) {
        InvestorDeposit[] memory deposits = investorDeposits[investor];
        uint256 totalInitialValue = 0;
        
        // Calculate current value directly
        uint256 shares = balanceOf(investor);
        uint256 currentValue = shares == 0 ? 0 : (shares * exchangeRate()) / 1e18;
        
        for (uint256 i = 0; i < deposits.length; i++) {
            totalInitialValue += deposits[i].amount;
        }
        
        return currentValue > totalInitialValue ? currentValue - totalInitialValue : 0;
    }

    // Get utilization rate for dashboard
    function utilizationRate() external view returns (uint256) {
        if (totalAssets == 0) return 0;
        return (totalBorrows * 10000) / totalAssets; // Return as basis points
    }

    // Get current APR/interest rate
    function currentAPR() external view returns (uint256) {
        return riskPremium; // Already exists, just expose it properly
    }

    // Get pool TVL (Total Value Locked)
    function getTVL() external view returns (uint256) {
        return totalAssets;
    }

    // Get pool value in USD using oracle
    function getPoolValueUSD() external view returns (uint256) {
        uint256 grainPrice = priceOracle.getPrice(grainType);
        return (totalAssets * grainPrice) / 1e18;
    }

    // Get pool health score (0-10000, where 10000 is perfect)
    function getPoolHealthScore() external view returns (uint256) {
        uint256 utilization = totalAssets == 0 ? 0 : (totalBorrows * 10000) / totalAssets;
        uint256 healthScore = 10000; // Start with perfect score
        
        // Reduce score based on utilization rate
        if (utilization > 8000) healthScore -= 2000; // 80%+ utilization
        else if (utilization > 6000) healthScore -= 1000; // 60%+ utilization
        
        return healthScore;
    }

    // Get estimated yield for an investor
    function getEstimatedYield(address investor) external view returns (uint256) {
        uint256 shares = balanceOf(investor);
        if (shares == 0) return 0;
        
        // Calculate estimated yield based on current APR and time
        uint256 currentValue = (shares * exchangeRate()) / 1e18;
        return (currentValue * riskPremium) / 10000;
    }

    // Get investor's deposit history
    function getInvestorDepositHistory(address investor) external view returns (InvestorDeposit[] memory) {
        return investorDeposits[investor];
    }

    // Get investor's total deposits
    function getInvestorTotalDeposits(address investor) external view returns (uint256) {
        InvestorDeposit[] memory deposits = investorDeposits[investor];
        uint256 total = 0;
        for (uint256 i = 0; i < deposits.length; i++) {
            total += deposits[i].amount;
        }
        return total;
    }

    // Update daily stats (call this periodically)
    function updateDailyStats() external {
        uint256 today = block.timestamp / 86400; // Days since epoch
        
        dailyStats[today] = DailyStats({
            date: today,
            totalAssets: totalAssets,
            totalBorrows: totalBorrows,
            exchangeRate: exchangeRate(),
            utilizationRate: totalAssets == 0 ? 0 : (totalBorrows * 10000) / totalAssets
        });

        emit PoolStatsUpdated(totalAssets, totalBorrows, totalAssets == 0 ? 0 : (totalBorrows * 10000) / totalAssets, exchangeRate(), block.timestamp);
    }

    // Get daily stats for a specific date
    function getDailyStats(uint256 date) external view returns (DailyStats memory) {
        return dailyStats[date];
    }

    // Get current pool stats
    function getCurrentPoolStats() external view returns (
        uint256 _totalAssets,
        uint256 _totalBorrows,
        uint256 _totalReserves,
        uint256 _availableLiquidity,
        uint256 _utilizationRate,
        uint256 _exchangeRate,
        uint256 _currentAPR,
        uint256 _healthScore
    ) {
        _totalAssets = totalAssets;
        _totalBorrows = totalBorrows;
        _totalReserves = totalReserves;
        _availableLiquidity = availableLiquidity();
        _utilizationRate = totalAssets == 0 ? 0 : (totalBorrows * 10000) / totalAssets;
        _exchangeRate = exchangeRate();
        _currentAPR = riskPremium;
        
        // Calculate health score directly
        uint256 utilization = totalAssets == 0 ? 0 : (totalBorrows * 10000) / totalAssets;
        uint256 healthScore = 10000; // Start with perfect score
        if (utilization > 8000) healthScore -= 2000; // 80%+ utilization
        else if (utilization > 6000) healthScore -= 1000; // 60%+ utilization
        _healthScore = healthScore;
    }
}