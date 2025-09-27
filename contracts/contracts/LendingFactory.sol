// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./LendingPool.sol";
import "./MockPriceOracle.sol";
import "./HederaTokenService.sol";
import "./IHederaTokenService.sol";
import "./HederaResponseCode.sol";

contract LendingFactory is Ownable, HederaTokenService {
    
    struct PoolInfo { address poolAddress; address oracleAddress; string assetType; }
    struct PoolStats { address pool; string assetType; uint256 totalAssets; uint256 totalBorrows; uint256 availableLiquidity; uint256 utilizationRate; uint256 currentAPR; }

    mapping(string => PoolInfo) public lendingPools;
    string[] public allAssets;

    event PoolCreated(address indexed pool, address indexed oracle, string assetType);

    /// @notice Create a lending pool, its HTS tokens, and transfer treasury keys
    function createPool(
        string calldata assetType,
        address, 
        address, 
        uint256 baseLTV,
        uint256 protocolFee,
        uint256 initialPrice
    ) external onlyOwner returns (address, address) {
        require(lendingPools[assetType].poolAddress == address(0), "Pool exists");

        // ---------- Oracle ----------
        MockPriceOracle oracle = new MockPriceOracle();
        oracle.setPrice(assetType, initialPrice);
        oracle.transferOwnership(msg.sender); 

        // ---------- HTS Tokens (Create with Factory as Treasury) ----------
        IHederaTokenService.HederaToken memory lendingConfig;
        lendingConfig.name = string(abi.encodePacked("HTS ", assetType, " Lending Token"));
        lendingConfig.symbol = string(abi.encodePacked("h", assetType, "LEND"));
        lendingConfig.treasury = address(this); 

        (int lendResp, address lendingTokenAddr) = createFungibleToken(lendingConfig, int64(0), int32(6));
        require(lendResp == HederaResponseCodes.SUCCESS, "Lending token creation failed");

        IHederaTokenService.HederaToken memory collateralConfig;
        collateralConfig.name = string(abi.encodePacked("HTS ", assetType, " Collateral Token"));
        collateralConfig.symbol = string(abi.encodePacked("h", assetType, "COLL"));
        collateralConfig.treasury = address(this); 

        (int collResp, address collateralTokenAddr) = createFungibleToken(collateralConfig, int64(0), int32(6));
        require(collResp == HederaResponseCodes.SUCCESS, "Collateral token creation failed");

        // Factory must associate with tokens
        _associateToken(lendingTokenAddr);
        _associateToken(collateralTokenAddr);

        // ---------- Pool Deployment ----------
        LendingPool newPool = new LendingPool(
            assetType,
            lendingTokenAddr,
            collateralTokenAddr,
            lendingTokenAddr, 
            baseLTV,
            protocolFee, 
            address(oracle),
            msg.sender
        );
        
        // Note: In Hedera HTS, treasury cannot be changed after creation
        // The factory remains the treasury, and the pool will need to work with this limitation
        
        lendingPools[assetType] = PoolInfo({
            poolAddress: address(newPool),
            oracleAddress: address(oracle),
            assetType: assetType
        });
        allAssets.push(assetType);

        emit PoolCreated(address(newPool), address(oracle), assetType);
        return (address(newPool), address(oracle));
    }

    // ---------------- HTS Helpers ----------------
    function _associateToken(address token) private {
        IHederaTokenService(address(0x167)).associateToken(address(this), token); 
    }
    
    // ---------------- Views ----------------
    function getPool(string calldata assetType) external view returns (PoolInfo memory) {
        return lendingPools[assetType];
    }

    function getAllPools() external view returns (PoolInfo[] memory) {
        PoolInfo[] memory pools = new PoolInfo[](allAssets.length);
        for (uint256 i = 0; i < allAssets.length; i++) {
            pools[i] = lendingPools[allAssets[i]];
        }
        return pools;
    }

    function getPoolStats() external view returns (PoolStats[] memory) {
        PoolStats[] memory stats = new PoolStats[](allAssets.length);
        for (uint256 i = 0; i < allAssets.length; i++) {
            LendingPool pool = LendingPool(lendingPools[allAssets[i]].poolAddress);
            stats[i] = PoolStats({
                pool: lendingPools[allAssets[i]].poolAddress,
                assetType: allAssets[i],
                totalAssets: pool.totalAssets(),
                totalBorrows: pool.totalBorrows(),
                availableLiquidity: pool.availableLiquidity(),
                utilizationRate: pool.utilizationRate(),
                currentAPR: pool.currentAPR()
            });
        }
        return stats;
    }
}