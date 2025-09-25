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
    MockPriceOracle public priceOracle;

    uint256 public baseLTV;        
    uint256 public riskPremium;    
    uint256 public debtCeiling;    
    uint256 public protocolFee;    

    uint256 public totalAssets;    
    uint256 public totalBorrows;   
    uint256 public totalReserves;  

    uint256 public lastAccrualBlock;
    uint256 public borrowIndex = 1e18;

    mapping(address => uint256) public borrows;
    mapping(address => uint256) public collateral; // farmer collateral deposits

    event Deposited(address indexed supporter, uint256 amount, uint256 shares);
    event Withdrawn(address indexed supporter, uint256 amount, uint256 shares);
    event CollateralDeposited(address indexed farmer, uint256 amountUSD);
    event LoanCreated(address indexed farmer, uint256 amount);
    event LoanRepaid(address indexed farmer, uint256 amount, uint256 interest);

    constructor(
        string memory _grainType,
        address _lendingToken,
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
        baseLTV = _baseLTV;
        riskPremium = _riskPremium;
        debtCeiling = _debtCeiling;
        protocolFee = _protocolFee;
        priceOracle = MockPriceOracle(_oracle);
        transferOwnership(_owner);
        lastAccrualBlock = block.number;
    }

    // ------------------------------
    // Interest Accrual
    // ------------------------------
    function accrueInterest() public {
        uint256 currentBlock = block.number;
        if (currentBlock == lastAccrualBlock) return;

        uint256 blocksElapsed = currentBlock - lastAccrualBlock;
        if (totalBorrows > 0) {
            uint256 interest = (totalBorrows * riskPremium * blocksElapsed) / 10000;
            totalBorrows += interest;
            totalReserves += (interest * protocolFee) / 10000;
            borrowIndex += (borrowIndex * riskPremium * blocksElapsed) / 10000;
        }

        lastAccrualBlock = currentBlock;
    }

    // ------------------------------
    // Investor Actions
    // ------------------------------
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

        emit Deposited(msg.sender, amount, shares);
    }

    function withdraw(uint256 shares) external nonReentrant {
        accrueInterest();
        require(shares > 0, "Invalid shares");
        require(balanceOf(msg.sender) >= shares, "Not enough LP");

        uint256 withdrawAmount = (shares * totalAssets) / totalSupply();

        _burn(msg.sender, shares);
        totalAssets -= withdrawAmount;

        require(lendingToken.transfer(msg.sender, withdrawAmount), "Transfer failed");

        emit Withdrawn(msg.sender, withdrawAmount, shares);
    }

    // ------------------------------
    // Farmer Collateral & Loans
    // ------------------------------
    function depositCollateral(uint256 collateralUSD) external {
        accrueInterest();
        collateral[msg.sender] += collateralUSD;
        emit CollateralDeposited(msg.sender, collateralUSD);
    }

    function createLoan(uint256 amount) external nonReentrant {
        accrueInterest();
        uint256 maxBorrow = (collateral[msg.sender] * baseLTV) / 10000;
        require(amount <= maxBorrow, "Exceeds borrow limit");
        require(amount <= availableLiquidity(), "Insufficient liquidity");

        totalBorrows += amount;
        borrows[msg.sender] += amount;

        require(lendingToken.transfer(msg.sender, amount), "Transfer failed");
        emit LoanCreated(msg.sender, amount);
    }

    function repayLoan(uint256 amount) external nonReentrant {
        accrueInterest();
        require(borrows[msg.sender] > 0, "No loan");
        require(amount <= borrows[msg.sender], "Repay amount exceeds borrow");

        uint256 interest = (amount * riskPremium) / 10000;
        uint256 totalRepayment = amount + interest;

        require(lendingToken.transferFrom(msg.sender, address(this), totalRepayment), "Transfer failed");

        borrows[msg.sender] -= amount;
        totalBorrows -= amount;
        totalAssets += amount;
        totalReserves += interest;

        emit LoanRepaid(msg.sender, amount, interest);
    }

    function repayFullLoan() external nonReentrant {
        accrueInterest();
        require(borrows[msg.sender] > 0, "No loan");

        uint256 principal = borrows[msg.sender];
        uint256 interest = (principal * riskPremium) / 10000;
        uint256 totalRepayment = principal + interest;

        require(lendingToken.transferFrom(msg.sender, address(this), totalRepayment), "Transfer failed");

        borrows[msg.sender] = 0;
        totalBorrows -= principal; // This should reduce totalBorrows by the principal
        totalAssets += principal; // Only add the principal back to totalAssets
        totalReserves += interest; // The interest goes to reserves

        emit LoanRepaid(msg.sender, principal, interest);
    }

    // ------------------------------
    // Views
    // ------------------------------
    function availableLiquidity() public view returns (uint256) {
        return totalAssets - totalBorrows;
    }

    function getCollateralValue(address farmer) public view returns (uint256) {
        uint256 price = priceOracle.getPrice(grainType);
        return (collateral[farmer] * price) / 1e18;
    }

    function exchangeRate() public view returns (uint256) {
        if (totalSupply() == 0) return 1e18;
        // Include reserves to show LP holders benefit from interest
        uint256 totalValue = totalAssets + totalReserves;
        return (totalValue * 1e18) / totalSupply();
    }
}
