pragma solidity >=0.5.0 <0.7.0;

contract ManagementFeeStorage {
    address public manager; // Address that manages the storage
    uint256 platformFee; // Percentage of the fee that goes to the platform

    mapping(address => uint256) managementFees; // Mapping of Strategies and their corresponding fees.

    constructor(uint256 _platformFee) public {
        manager = msg.sender;
        platformFee = _platformFee;
    }

    modifier onlyManager {
        require(msg.sender == manager, "Not Authorized");
        _;
    }

    /// @dev Function to set manager of the storage.
    /// @param _manager Address of the new manager.
    function setManager(address _manager) external onlyManager {
        manager = _manager;
    }

    /// @dev Function to get percentage of the fee that goes to the platform.
    function getPlatformFee() external view returns (uint256) {
        return platformFee;
    }

    /// @dev Function to set percentage of the fee that goes to the platform.
    /// @param _platformFee Percentage of the fee that goes to the platform.
    function setPlatformFee(uint256 _platformFee) external onlyManager {
        platformFee = _platformFee;
    }

    /// @dev Function to get percentage of the fee that goes to the Strategy.
    /// @param _strategy Address of the Strategy.
    function getStrategyFee(address _strategy) external view returns (uint256) {
        return managementFees[_strategy];
    }

    /// @dev Function to set percentage of the fee that goes to the Strategy.
    /// @param _strategy Address of the Strategy.
    /// @param _strategyFee Percentage of the fee that goes to the Strategy.
    function setStrategyFee(address _strategy, uint256 _strategyFee)
        external
        onlyManager
    {
        managementFees[_strategy] = _strategyFee;
    }
}
