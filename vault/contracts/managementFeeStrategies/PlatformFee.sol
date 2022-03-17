// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;
import "../storage/VaultStorage.sol";
import "./storage/ManagementFeeStorage.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract PlatformFee is VaultStorage {

    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    function processPlatformFee(uint256 amount,address _tokenAddress,uint256 _type)
        internal
    {
        IERC20 token = IERC20(_tokenAddress);
        if(_type == 1)
            token.safeTransferFrom(msg.sender, strategyBeneficiary, amount);
        else
            {
                if( tokenBalances.getTokenBalance(_tokenAddress) > amount )
                    token.safeTransferFrom(address(this), strategyBeneficiary, amount);
                else
                    revert("Token not present in vault");
            }
            
    }

    function feeAmount(uint256 blockDifference,address _tokenAddress) public view returns(uint256){
        uint256 vaultNAV = getVaultNAV();
        ManagementFeeStorage mStorage = ManagementFeeStorage(
            0x2c68D78114cDa255a66ee7CE4a6c32C9801e87E1
        );
        uint256 platformFee = mStorage.getPlatformFee();
        uint256 platformNavInterest = vaultNAV
        .mul(blockDifference.mul(1e18))
        .mul(platformFee)
        .div(uint256(262800000).mul(1e36));
        uint256 tokenUSD = IAPContract(APContract).getUSDPrice(_tokenAddress);
        uint256 platformShareCount = platformNavInterest.mul(1e18).div(
            tokenUSD
        );
        uint256 tokenCountDecimals = IHexUtils(
                    IAPContract(APContract).stringUtils()
                ).fromDecimals(_tokenAddress, platformShareCount);
        return tokenCountDecimals;
    }

    function calculateFee(address _tokenAddress) public returns(uint256) {
        uint256 blockDifference;
        if(tokenBalances.getLastTransactionBlockNumber() != 0){
            blockDifference = uint256(block.number).sub(
                tokenBalances.getLastTransactionBlockNumber()
            );
        }
        uint256 vaultNAV = getVaultNAV();
        if (vaultNAV > 0) {
            return feeAmount(blockDifference,_tokenAddress);
        }else{
            return 0;
        }
    }

    function executeSafeCleanUp(address _tokenAddress,uint256 _type) public returns(uint256) {
        uint256 amount = calculateFee(_tokenAddress);
        if(amount>0){
            processPlatformFee(amount,_tokenAddress,_type);
            tokenBalances.setLastTransactionBlockNumber();
        }
        return amount;
    }
}
