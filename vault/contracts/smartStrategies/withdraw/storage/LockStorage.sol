pragma solidity >=0.5.0 <0.7.0;
import "../../../interfaces/IAPContract.sol";

contract LockStorage {
    struct WithdrawalStorage {
        address[] requestedAddresses; // Address list of the users who requested a withdrawal
        address[] withdrawalAsset; // address list of requested asset.
        uint256[] amounts; // safe share
    }
    mapping(address => WithdrawalStorage) vaultWithdrawalRequests; // Mapping from vault to Withdraw storage.
    address private APContract;

    constructor(address _APContract) public {
        APContract = _APContract;
    }

    /// @dev Function to add a withdrawal request to the storage.
    /// @param _withdrawer Address of the user who requested a withdrawal.
    /// @param _asset Address of the asset to be withdrawn.
    /// @param _amount Amount of shares of the withdrawal.
    function addRequest(
        address _withdrawer,
        address _asset,
        uint256 _amount
    ) external {
        require(
            IAPContract(APContract).isVault(msg.sender),
            "Not a registered vault!"
        );
        vaultWithdrawalRequests[msg.sender].requestedAddresses.push(
            _withdrawer
        );
        vaultWithdrawalRequests[msg.sender].withdrawalAsset.push(_asset);
        vaultWithdrawalRequests[msg.sender].amounts.push(_amount);
    }

    /// @dev Function to clear all the withdrawal requests of the vault.
    function clearWithdrawals() external {
        require(
            IAPContract(APContract).isVault(msg.sender),
            "Not a registered vault!"
        );
        vaultWithdrawalRequests[msg.sender] = WithdrawalStorage(
            new address[](0),
            new address[](0),
            new uint256[](0)
        );
    }

    /// @dev Function to get the withdrawal requests of the vault.
    /// @param _vaultAddress Address of the vault.
    function getWithdrawalList(address _vaultAddress)
        external
        view
        returns (
            address[] memory,
            address[] memory,
            uint256[] memory
        )
    {
        return (
            vaultWithdrawalRequests[_vaultAddress].requestedAddresses,
            vaultWithdrawalRequests[_vaultAddress].withdrawalAsset,
            vaultWithdrawalRequests[_vaultAddress].amounts
        );
    }
}
