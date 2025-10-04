// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title PriceOracle
 * @notice Chainlink-style price oracle for agricultural assets with staleness checks
 * @dev Supports multiple price feeds with validation and fallback mechanisms
 */
contract PriceOracle is Ownable, Pausable {
    
    // ============ Constants ============
    uint256 constant MAX_PRICE_DEVIATION = 5000; // 50% max deviation
    uint256 constant MIN_PRICE = 1e6; // Minimum price (prevents zero/dust prices)
    uint256 constant MAX_PRICE = 1e30; // Maximum reasonable price
    uint256 constant PRECISION = 10000;
    uint256 constant DEFAULT_HEARTBEAT = 1 hours;
    uint256 constant MIN_HEARTBEAT = 5 minutes;
    uint256 constant MAX_HEARTBEAT = 24 hours;
    uint256 constant MAX_ASSET_NAME_LENGTH = 32;
    uint256 constant MAX_PRICE_SOURCES = 5;
    
    // ============ Structs ============
    
    struct PriceData {
        uint256 price;              // Price in 18 decimals
        uint256 timestamp;          // Last update timestamp
        uint256 heartbeat;          // Maximum time before price is stale
        address priceSource;        // Address of price source
        bool isActive;              // Whether price feed is active
        uint256 updateCount;        // Number of updates
        uint256 lastBlockNumber;    // Last update block
    }
    
    struct PriceSource {
        address sourceAddress;
        string sourceName;
        bool isActive;
        uint256 weight;             // Weight for aggregation (basis points)
        uint256 lastUpdate;
    }
    
    struct AssetConfig {
        bool exists;
        bool requiresMultipleSources;
        uint256 minSources;
        uint256 maxPriceAge;
        uint256 priceDeviationThreshold;
    }
    
    struct PriceStats {
        uint256 currentPrice;
        uint256 previousPrice;
        uint256 priceChange;        // Percentage change (basis points)
        uint256 lastUpdate;
        uint256 updateCount;
        bool isStale;
        uint256 timeUntilStale;
    }
    
    // ============ State Variables ============
    
    mapping(string => PriceData) public prices;
    mapping(string => AssetConfig) public assetConfigs;
    mapping(string => PriceSource[]) public priceSources;
    mapping(string => uint256[]) public priceHistory; // Last 10 prices
    mapping(string => mapping(address => bool)) public authorizedUpdaters;
    
    string[] public allAssets;
    mapping(string => bool) public assetExists;
    
    address public emergencyAdmin;
    bool public emergencyMode;
    
    // ============ Events ============
    
    event PriceUpdated(
        string indexed assetType,
        uint256 oldPrice,
        uint256 newPrice,
        uint256 timestamp,
        address indexed updater
    );
    
    event PriceSourceAdded(
        string indexed assetType,
        address indexed source,
        string sourceName,
        uint256 weight
    );
    
    event PriceSourceRemoved(
        string indexed assetType,
        address indexed source
    );
    
    event PriceSourceUpdated(
        string indexed assetType,
        address indexed source,
        uint256 newWeight,
        bool isActive
    );
    
    event HeartbeatUpdated(
        string indexed assetType,
        uint256 oldHeartbeat,
        uint256 newHeartbeat
    );
    
    event AssetAdded(
        string indexed assetType,
        uint256 initialPrice,
        uint256 heartbeat,
        address priceSource
    );
    
    event AssetConfigured(
        string indexed assetType,
        bool requiresMultipleSources,
        uint256 minSources,
        uint256 maxPriceAge
    );
    
    event UpdaterAuthorized(
        string indexed assetType,
        address indexed updater,
        bool authorized
    );
    
    event EmergencyModeToggled(bool enabled, address indexed admin);
    
    event PriceDeviation(
        string indexed assetType,
        uint256 oldPrice,
        uint256 newPrice,
        uint256 deviation
    );
    
    // ============ Custom Errors ============
    
    error InvalidPrice();
    error InvalidAssetName();
    error AssetNotFound();
    error AssetAlreadyExists();
    error PriceStale();
    error InvalidHeartbeat();
    error UnauthorizedUpdater();
    error InvalidAddress();
    error PriceDeviationTooHigh();
    error InsufficientPriceSources();
    error InvalidWeight();
    error MaxSourcesReached();
    error SourceNotFound();
    error InvalidParameter();
    error EmergencyModeActive();
    
    // ============ Modifiers ============
    
    modifier validAsset(string memory assetType) {
        if (bytes(assetType).length == 0 || bytes(assetType).length > MAX_ASSET_NAME_LENGTH) {
            revert InvalidAssetName();
        }
        _;
    }
    
    modifier validPrice(uint256 price) {
        if (price < MIN_PRICE || price > MAX_PRICE) {
            revert InvalidPrice();
        }
        _;
    }
    
    modifier onlyAuthorizedUpdater(string memory assetType) {
        if (!authorizedUpdaters[assetType][msg.sender] && msg.sender != owner()) {
            revert UnauthorizedUpdater();
        }
        _;
    }
    
    modifier notEmergencyMode() {
        if (emergencyMode) {
            revert EmergencyModeActive();
        }
        _;
    }
    
    // ============ Constructor ============
    
    constructor() Ownable() {
        emergencyAdmin = msg.sender;
    }
    
    // ============ Core Functions ============
    
    /**
     * @notice Set price for an asset
     * @param assetType The asset identifier
     * @param price The new price (18 decimals)
     */
    function setPrice(string memory assetType, uint256 price) 
        external 
        validAsset(assetType) 
        validPrice(price) 
        onlyAuthorizedUpdater(assetType) 
        notEmergencyMode 
    {
        PriceData storage priceData = prices[assetType];
        uint256 oldPrice = priceData.price;
        
        // Check price deviation if not first update
        if (oldPrice > 0) {
            uint256 deviation = _calculateDeviation(oldPrice, price);
            if (deviation > assetConfigs[assetType].priceDeviationThreshold) {
                emit PriceDeviation(assetType, oldPrice, price, deviation);
                if (deviation > MAX_PRICE_DEVIATION) {
                    revert PriceDeviationTooHigh();
                }
            }
        }
        
        priceData.price = price;
        priceData.timestamp = block.timestamp;
        priceData.updateCount++;
        priceData.lastBlockNumber = block.number;
        
        // Add to price history
        _addToPriceHistory(assetType, price);
        
        emit PriceUpdated(assetType, oldPrice, price, block.timestamp, msg.sender);
    }
    
    /**
     * @notice Get current price for an asset
     * @param assetType The asset identifier
     * @return The current price
     */
    function getPrice(string memory assetType) external view validAsset(assetType) returns (uint256) {
        if (!assetExists[assetType]) {
            revert AssetNotFound();
        }
        return prices[assetType].price;
    }
    
    /**
     * @notice Check if price is stale
     * @param assetType The asset identifier
     * @return True if price is stale
     */
    function isPriceStale(string memory assetType) external view validAsset(assetType) returns (bool) {
        if (!assetExists[assetType]) {
            return true;
        }
        
        PriceData memory priceData = prices[assetType];
        if (priceData.price == 0) {
            return true;
        }
        
        return block.timestamp - priceData.timestamp > priceData.heartbeat;
    }
    
    /**
     * @notice Get last update time for an asset
     * @param assetType The asset identifier
     * @return The timestamp of last update
     */
    function getLastUpdateTime(string memory assetType) external view validAsset(assetType) returns (uint256) {
        return prices[assetType].timestamp;
    }
    
    // ============ Admin Functions ============
    
    /**
     * @notice Add a new asset
     * @param assetType The asset identifier
     * @param initialPrice The initial price
     * @param heartbeat The heartbeat interval
     */
    function addAsset(
        string memory assetType,
        uint256 initialPrice,
        uint256 heartbeat
    ) external onlyOwner validAsset(assetType) validPrice(initialPrice) {
        if (assetExists[assetType]) {
            revert AssetAlreadyExists();
        }
        
        if (heartbeat < MIN_HEARTBEAT || heartbeat > MAX_HEARTBEAT) {
            revert InvalidHeartbeat();
        }
        
        assetExists[assetType] = true;
        allAssets.push(assetType);
        
        prices[assetType] = PriceData({
            price: initialPrice,
            timestamp: block.timestamp,
            heartbeat: heartbeat,
            priceSource: msg.sender,
            isActive: true,
            updateCount: 1,
            lastBlockNumber: block.number
        });
        
        // Default configuration
        assetConfigs[assetType] = AssetConfig({
            exists: true,
            requiresMultipleSources: false,
            minSources: 1,
            maxPriceAge: heartbeat,
            priceDeviationThreshold: 1000 // 10%
        });
        
        emit AssetAdded(assetType, initialPrice, heartbeat, msg.sender);
    }
    
    /**
     * @notice Authorize an updater for an asset
     * @param assetType The asset identifier
     * @param updater The updater address
     * @param authorized Whether to authorize or revoke
     */
    function authorizeUpdater(
        string memory assetType,
        address updater,
        bool authorized
    ) external onlyOwner validAsset(assetType) {
        if (updater == address(0)) {
            revert InvalidAddress();
        }
        
        authorizedUpdaters[assetType][updater] = authorized;
        emit UpdaterAuthorized(assetType, updater, authorized);
    }
    
    /**
     * @notice Toggle emergency mode
     * @param enabled Whether to enable emergency mode
     */
    function toggleEmergencyMode(bool enabled) external {
        if (msg.sender != owner() && msg.sender != emergencyAdmin) {
            revert UnauthorizedUpdater();
        }
        
        emergencyMode = enabled;
        emit EmergencyModeToggled(enabled, msg.sender);
    }
    
    // ============ Internal Functions ============
    
    function _calculateDeviation(uint256 oldPrice, uint256 newPrice) internal pure returns (uint256) {
        if (oldPrice == 0) return 0;
        
        uint256 diff = oldPrice > newPrice ? oldPrice - newPrice : newPrice - oldPrice;
        return (diff * PRECISION) / oldPrice;
    }
    
    function _addToPriceHistory(string memory assetType, uint256 price) internal {
        priceHistory[assetType].push(price);
        
        // Keep only last 10 prices
        if (priceHistory[assetType].length > 10) {
            // Remove first element
            for (uint256 i = 0; i < priceHistory[assetType].length - 1; i++) {
                priceHistory[assetType][i] = priceHistory[assetType][i + 1];
            }
            priceHistory[assetType].pop();
        }
    }
}