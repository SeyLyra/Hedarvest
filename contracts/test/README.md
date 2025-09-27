# Full Lending Flow Test

This comprehensive test suite demonstrates the complete DeFi lending protocol flow using Hedera HTS tokens.

## Test Overview

The test simulates a realistic DeFi lending scenario with:
- **2 Liquidity Providers (LPs)**: Deposit assets and earn yield
- **2 Borrowers**: Deposit collateral and take loans
- **Factory Pattern**: Creates lending pools with HTS tokens
- **Interest Accrual**: Time-based interest calculation
- **Liquidation**: Risk management through liquidation

## Test Phases

### Phase 1: Factory Deployment & Pool Creation
- Deploy LendingFactory contract
- Create a lending pool for "Wheat" asset
- Deploy HTS tokens (lending, collateral, LP tokens)
- Set up price oracle with initial price

### Phase 2: Liquidity Providers - Yield Farming
- Mint tokens to liquidity providers
- LP1 deposits $100K, LP2 deposits $50K
- Receive LP tokens representing share of pool
- Verify TVL and available liquidity

### Phase 3: Borrowers - Collateralized Lending
- Mint collateral tokens to borrowers
- Borrower1 deposits 1000 units wheat ($200K value)
- Borrower2 deposits 500 units wheat ($100K value)
- Borrower1 takes $150K loan (75% LTV)
- Borrower2 takes $75K loan (75% LTV)

### Phase 4: Interest Accrual & Yield Generation
- Simulate 2 days of time passage
- Accrue interest on outstanding loans
- Calculate LP yield and exchange rates
- Verify protocol fee collection

### Phase 5: Loan Repayment & Yield Realization
- Borrower1 repays 50% of loan
- Borrower2 repays full loan
- LPs withdraw with earned yield
- Verify yield distribution

### Phase 6: Liquidation Scenario
- Simulate 50% price crash
- Check borrower health factors
- Execute liquidation on unhealthy position
- Verify collateral seizure

### Phase 7: Final Statistics
- Display comprehensive pool statistics
- Verify all DeFi mechanics worked correctly

## Key DeFi Concepts Demonstrated

### Liquidity Provision (Yield Farming)
- **TVL (Total Value Locked)**: Total assets deposited in pool
- **LP Tokens**: Represent share ownership in the pool
- **Exchange Rate**: Value of LP tokens relative to underlying assets
- **Yield**: Earnings from interest paid by borrowers

### Collateralized Lending
- **LTV (Loan-to-Value)**: Maximum loan amount relative to collateral value
- **Health Factor**: Collateral value / debt ratio
- **Collateral Factor**: Risk parameter for each asset type
- **Liquidation Threshold**: When positions become liquidatable

### Interest Rate Model
- **Risk Premium**: Base interest rate for borrowing
- **Utilization Rate**: Percentage of available liquidity borrowed
- **APR**: Annual Percentage Rate for lenders
- **Protocol Fee**: Fee collected by protocol

### Risk Management
- **Liquidation**: Seizing collateral when health factor drops
- **Price Oracle**: External price feeds for collateral valuation
- **Debt Ceiling**: Maximum total borrowing capacity
- **Reserve Factor**: Portion of interest held as reserves

## Running the Test

```bash
# Navigate to contracts directory
cd contracts

# Install dependencies
pnpm install

# Run the full flow test
npx hardhat test test/FullLendingFlow.test.js --verbose

# Run with gas reporting
REPORT_GAS=true npx hardhat test test/FullLendingFlow.test.js

# Run on local network
npx hardhat test test/FullLendingFlow.test.js --network localhost
```

## Expected Output

The test will output detailed logs showing:
- Contract deployment addresses
- Token minting and transfers
- Deposit/withdrawal amounts and shares
- Interest accrual calculations
- Yield earned by liquidity providers
- Liquidation execution details
- Final pool statistics

## Test Parameters

- **Asset Type**: Wheat
- **Initial Price**: $200 per unit
- **Base LTV**: 75%
- **Risk Premium**: 8% APR
- **Protocol Fee**: 10%
- **LP1 Deposit**: $100,000
- **LP2 Deposit**: $50,000
- **Borrower1 Collateral**: 1000 units ($200,000)
- **Borrower2 Collateral**: 500 units ($100,000)
- **Borrower1 Loan**: $150,000
- **Borrower2 Loan**: $75,000

## Hedera HTS Integration

This test demonstrates:
- HTS token creation via factory
- HTS token transfers and approvals
- HTS token minting and burning
- Integration with Hedera Token Service precompiles
- Faucet functionality for testing

## Security Considerations

The test includes:
- Reentrancy protection
- Access control (onlyOwner)
- Input validation
- Event logging for transparency
- Proper error handling

## Extending the Test

To add more scenarios:
1. Add more asset types
2. Test different LTV ratios
3. Simulate extreme market conditions
4. Test edge cases and error conditions
5. Add stress testing with multiple users
