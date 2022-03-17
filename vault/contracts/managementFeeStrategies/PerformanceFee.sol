// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;
import "../storage/VaultStorage.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract PerformanceFee is VaultStorage {

    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    
    //TODO revert if insufficient withdrawal asset in vault
    //TODO check required

    function executeSafeCleanUp(address _tokenAddress,uint256 _type) public returns(uint256) {

        uint256 currentVaultNAV = getVaultNAV();
        uint256 feeAmountToTransfer = calculateFee(_tokenAddress);
        if(feeAmountToTransfer>0){

            address beneficiary = strategyBeneficiary;
            IERC20 token = IERC20(_tokenAddress);
            if(_type == 1)
                token.safeTransferFrom(msg.sender, strategyBeneficiary, feeAmountToTransfer);
            else
                {
                    if( tokenBalances.getTokenBalance(_tokenAddress) > feeAmountToTransfer )
                        token.safeTransferFrom(address(this), strategyBeneficiary, feeAmountToTransfer);
                    else
                        revert("Token not present in vault");
                }
        }
        
        tokenBalances.setLastTransactionNAV(currentVaultNAV);
        return feeAmountToTransfer;
    }

    function calculateFee(address _tokenAddress) public view returns(uint256){
        uint256 currentVaultNAV = getVaultNAV();
        if (currentVaultNAV > tokenBalances.getLastTransactionNav()) {
            uint256 profit = currentVaultNAV -
                tokenBalances.getLastTransactionNav();

            uint256 percentage = strategyPercentage;
            uint256 fee = (profit.mul(percentage)).div(1e20);
            uint256 tokenUSD = IAPContract(APContract).getUSDPrice(_tokenAddress);
            uint256 tokenCount = fee.mul(1e18).div(tokenUSD);
            uint256 tokenCountDecimals = IHexUtils(
                    IAPContract(APContract).stringUtils()
                ).fromDecimals(_tokenAddress, tokenCount);

            return tokenCountDecimals;
        
        }else{
            return 0;
        }
    }
}
