// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

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


contract VaultStorage is MasterCopy,ERC20Detailed,ERC1155Receiver,Pausable{

    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    uint8 public emergencyConditions;
    bool internal vaultSetupCompleted;
    bool internal vaultRegistrationCompleted;
    address public APContract;
    address public owner;
    address public vaultAdmin;
    uint256[] internal whiteListGroups;
    mapping(uint256=>bool)isWhiteListGroupPresent;
    address[] internal assetList;
    mapping(address=>bool) internal isAssetPresent;
    address public strategyBeneficiary;
    uint256 public strategyPercentage;
    
    address public  eth;
    address public wEth;

    TokenBalanceStorage tokenBalances;

    
    
    //TODO verify if this code has to be used for this fn
    function revertDelegate(bool _delegateStatus) internal pure{
        if(!_delegateStatus){
            assembly{
                let ptr := mload(0x40)
                let size := returndatasize()
                returndatacopy(ptr,0,size)
                revert(ptr,size)
            }
        }
    }

    function getTokenBalance(address _tokenAddress) external view returns (uint256)
    {
        return tokenBalances.getTokenBalance(_tokenAddress);
    }

    function addToAssetList(address _asset) internal{
        require(_asset!=address(0),"invalid asset address");
        if(!isAssetPresent[_asset]){
            assetList.push(_asset);
            isAssetPresent[_asset] = true;
        }
    }

   

     /// @dev Function to return the NAV of the Vault.
    function getVaultNAV() public view returns (uint256) {
       
        uint256 nav = 0;
        for (uint256 i = 0; i < assetList.length; i++) {


            if (tokenBalances.getTokenBalance(assetList[i]) > 0) {
                uint256 tokenUSD = IAPContract(APContract).getUSDPrice(
                    assetList[i]
                );
                if( assetList[i]==eth){
                    nav += IHexUtils(IAPContract(APContract).stringUtils())
                    .toDecimals(
                    wEth, 
                        tokenBalances.getTokenBalance(assetList[i])
                    ).mul(tokenUSD);

                }
                else{
                    nav += IHexUtils(IAPContract(APContract).stringUtils())
                    .toDecimals(
                        assetList[i],   
                        tokenBalances.getTokenBalance(assetList[i])
                    ).mul(tokenUSD);
                }
            }
        }
        return nav.div(1e18);
    }

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
        return
            (
                IHexUtils(IAPContract(APContract).stringUtils())
                    .toDecimals(_tokenAddress, _amount)
                    .mul(tokenUSD)
            )
                .div(1e18);
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


}