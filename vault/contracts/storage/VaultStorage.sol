pragma solidity >=0.5.0 <0.7.0;
import "../common/MasterCopy.sol";
import "../token/ERC1155/ERC1155Receiver.sol";
import "../token/ERC20Detailed.sol";
import "../interfaces/IAPContract.sol";
import "../interfaces/IWhitelist.sol";
import "../interfaces/IExchangeRegistry.sol";
import "../interfaces/IExchange.sol";
import "../interfaces/IStrategy.sol";
import "../interfaces/IHexUtils.sol";
import "./TokenBalanceStorage.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

contract VaultStorage is MasterCopy, ERC20, ERC20Detailed, ERC1155Receiver {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    uint8 public emergencyConditions; // 0 - Normal Mode, 1 - Emergency Break, 2 - Emergency Exit.
    bool internal vaultSetupCompleted; // set to true when vault is setup.
    bool internal vaultRegistrationCompleted; //Boolean indicating if the vault has been registered with the AP contract.

    address public APContract; // Address of the AP contract.
    address public owner; // Address of the owner of the vault.
    address public vaultAPSManager; // Address of the vault APS Manager.
    address public vaultStrategyManager; // Address of the vault Strategy Manager.

    uint256[] internal whiteListGroups; // list of whitelist groups applied to the vault.
    address[] internal assetList; // list of assets in the vault.
    mapping(address => bool) isAssetPresent; // Mapping of assets to their presence in the vault.

    // Token balance storage keeps track of tokens that are deposited to safe without worrying direct transfers affecting the NAV;
    TokenBalanceStorage tokenBalances;

    /// @dev Function to revert in case of low level call fail.
    /// @param delegateStatus Boolean indicating the status of low level call.
    function revertDelegate(bool delegateStatus) internal pure {
        if (delegateStatus == false) {
            assembly {
                let ptr := mload(0x40)
                let size := returndatasize()
                returndatacopy(ptr, 0, size)
                revert(ptr, size)
            }
        }
    }

    /// @dev Function to get the balance of token from tokenBalances.
    /// @param _tokenAddress Address of the token.
    function getTokenBalance(address _tokenAddress)
        external
        view
        returns (uint256)
    {
        return tokenBalances.getTokenBalance(_tokenAddress);
    }

    /// @dev Function to add a token to assetList.
    /// @param _asset Address of the asset.
    function addToAssetList(address _asset) internal {
        if (!isAssetPresent[_asset]) {
            isAssetPresent[_asset] = true;
            assetList.push(_asset);
        }
    }

    /// @dev Function to get the address list of active strategies in the vault.
    function getVaultActiveStrategy() public view returns (address[] memory) {
        return IAPContract(APContract).getVaultActiveStrategy(address(this));
    }

    /// @dev Function to return the NAV of the Vault.
    function getVaultNAV() public view returns (uint256) {
        address[] memory strategies = getVaultActiveStrategy();
        uint256 nav = 0;
        //Finding NAV of all the assets.
        for (uint256 i = 0; i < assetList.length; i++) {
            if (tokenBalances.getTokenBalance(assetList[i]) > 0) {
                uint256 tokenUSD = IAPContract(APContract).getUSDPrice(
                    assetList[i]
                );
                nav += IHexUtils(IAPContract(APContract).stringUtils())
                    .toDecimals(
                        assetList[i],
                        tokenBalances.getTokenBalance(assetList[i])
                    )
                    .mul(tokenUSD);
            }
        }
        if (strategies.length == 0) {
            return nav.div(1e18);
        } else {
            //Finding NAV of all the strategies.
            for (uint256 i = 0; i < strategies.length; i++) {
                if (IERC20(strategies[i]).balanceOf(address(this)) > 0) {
                    uint256 strategyTokenUSD = IStrategy(strategies[i])
                        .tokenValueInUSD();
                    nav += IERC20(strategies[i]).balanceOf(address(this)).mul(
                        strategyTokenUSD
                    );
                }
            }
            return nav.div(1e18);
        }
    }

    /// @dev Function to return the NAV of the Vault excluding Strategy Tokens.
    function getVaultNAVWithoutStrategyToken() public view returns (uint256) {
        uint256 nav = 0;
        for (uint256 i = 0; i < assetList.length; i++) {
            if (tokenBalances.getTokenBalance(assetList[i]) > 0) {
                uint256 tokenUSD = IAPContract(APContract).getUSDPrice(
                    assetList[i]
                );
                nav += (
                    IHexUtils(IAPContract(APContract).stringUtils())
                        .toDecimals(
                            assetList[i],
                            tokenBalances.getTokenBalance(assetList[i])
                        )
                        .mul(tokenUSD)
                );
            }
        }
        return nav.div(1e18);
    }

    /// @dev Function to return NAV for Deposit token and amount.
    /// @param _tokenAddress Address of the deposit Token.
    /// @param _amount Amount of the Deposit tokens.
    function getDepositNAV(address _tokenAddress, uint256 _amount)
        internal
        view
        returns (uint256)
    {
        uint256 tokenUSD = IAPContract(APContract).getUSDPrice(_tokenAddress);
        return
            (
                IHexUtils(IAPContract(APContract).stringUtils())
                    .toDecimals(_tokenAddress, _amount)
                    .mul(tokenUSD)
            ).div(1e18);
    }

    /// @dev Function to get the amount of Vault Tokens to be minted for the deposit NAV.
    /// @param depositNAV NAV of the Deposit Amount.
    function getMintValue(uint256 depositNAV) internal view returns (uint256) {
        return (depositNAV.mul(totalSupply())).div(getVaultNAV());
    }

    /// @dev Function to return Value of the Vault Token.
    function tokenValueInUSD() public view returns (uint256) {
        if (getVaultNAV() == 0 || totalSupply() == 0) {
            return 0;
        } else {
            return (getVaultNAV().mul(1e18)).div(totalSupply());
        }
    }

    /// @dev Function to approve ERC20 token to the spendor.
    /// @param _token Address of the Token.
    /// @param _spender Address of the Spendor.
    /// @param _amount Amount of the tokens.
    function _approveToken(
        address _token,
        address _spender,
        uint256 _amount
    ) internal {
        if (IERC20(_token).allowance(address(this), _spender) > 0) {
            IERC20(_token).safeApprove(_spender, 0);
            IERC20(_token).safeApprove(_spender, _amount);
        } else IERC20(_token).safeApprove(_spender, _amount);
    }

    /// @dev Function to update token balance in tokenBalances.
    /// @param tokenAddress Address of the Token.
    /// @param tokenAmount Amount of the tokens.
    /// @param isAddition Boolean indicating if token addition or substraction.
    function updateTokenBalance(
        address tokenAddress,
        uint256 tokenAmount,
        bool isAddition
    ) internal {
        if (isAddition) {
            tokenBalances.setTokenBalance(
                tokenAddress,
                tokenBalances.getTokenBalance(tokenAddress).add(tokenAmount)
            );
        } else {
            tokenBalances.setTokenBalance(
                tokenAddress,
                tokenBalances.getTokenBalance(tokenAddress).sub(tokenAmount)
            );
        }
    }

    /// @dev Function to update token balance in tokenBalances if the updation is part of a low level call.
    /// @param data Return data from low level call.
    function updateBalance(bytes memory data) internal {
        bool assetUpdation = abi.decode(data, (bool));
        if (assetUpdation) {
            (, address asset, uint256 amount) = abi.decode(
                data,
                (bool, address, uint256)
            );
            if (asset != address(0)) updateTokenBalance(asset, amount, true);
        }
    }
}
