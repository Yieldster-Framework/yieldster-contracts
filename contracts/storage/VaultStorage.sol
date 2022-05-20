// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import "../common/MasterCopy.sol";
import "../token/ERC20Detailed.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../token/ERC1155Receiver.sol";
import "../interfaces/IAPContract.sol";
import "../interfaces/IHexUtils.sol";
import "../interfaces/IWhitelist.sol";
import "./TokenBalanceStorage.sol";
import "../interfaces/IExchangeRegistry.sol";
import "../interfaces/IExchange.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract VaultStorage is MasterCopy, ERC20Detailed, ERC1155Receiver, Pausable,ReentrancyGuard {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    uint256 constant arrSize = 200;
    uint8 public emergencyConditions;
    bool internal vaultSetupCompleted;
    bool internal vaultRegistrationCompleted;
    address public APContract;
    address public owner;
    address public vaultAdmin;
    uint256[] internal whiteListGroups;
    mapping(uint256 => bool) isWhiteListGroupPresent;
    address[] public assetList;
    mapping(address => bool) internal isAssetPresent;
    address public strategyBeneficiary;
    uint256 public strategyPercentage;
    uint256 public threshold;
    address public eth;

    TokenBalanceStorage tokenBalances;

    //TODO verify if this code has to be used for this fn
    /// @dev Function to revert in case of low level call fail.
    /// @param _delegateStatus Boolean indicating the status of low level call.
    function revertDelegate(bool _delegateStatus) internal pure {
        if (!_delegateStatus) {
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
        require(_asset != address(0), "invalid asset address");
        if (!isAssetPresent[_asset]) {
            checkLength(1);
            assetList.push(_asset);
            isAssetPresent[_asset] = true;
        }
    }

    /// @dev Function to return the NAV of the Vault.
    function getVaultNAV() public view returns (uint256) {
        uint256 nav = 0;
        address wEth = IAPContract(APContract).getWETH();
        for (uint256 i = 0; i < assetList.length; i++) {
            if (tokenBalances.getTokenBalance(assetList[i]) > 0) {
                uint256 tokenUSD = IAPContract(APContract).getUSDPrice(
                    assetList[i]
                );
                if (assetList[i] == eth) {
                    nav += IHexUtils(IAPContract(APContract).stringUtils())
                        .toDecimals(
                            wEth,
                            tokenBalances.getTokenBalance(assetList[i])
                        )
                        .mul(tokenUSD);
                } else {
                    nav += IHexUtils(IAPContract(APContract).stringUtils())
                        .toDecimals(
                            assetList[i],
                            tokenBalances.getTokenBalance(assetList[i])
                        )
                        .mul(tokenUSD);
                }
            }
        }
        return nav.div(1e18);
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

    /// @dev Function to return NAV for Deposit token and amount.
    /// @param _tokenAddress Address of the deposit Token.
    /// @param _amount Amount of the Deposit tokens.
    function getDepositNAV(address _tokenAddress, uint256 _amount)
        internal
        view
        returns (uint256)
    {
        uint256 tokenUSD = IAPContract(APContract).getUSDPrice(_tokenAddress);
        address tokenAddress = _tokenAddress;
        if (tokenAddress == eth)
            tokenAddress = IAPContract(APContract).getWETH();
        return
            (
                IHexUtils(IAPContract(APContract).stringUtils())
                    .toDecimals(tokenAddress, _amount)
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

    /// @dev Function to check if assetList length is <1000
    /// @param _increments The maximum size the assetList.length can be incremented by
    function checkLength(uint256 _increments) internal view {
        require(
            assetList.length + _increments <= arrSize,
            "Exceeds safe assetList length"
        );
    }
}
