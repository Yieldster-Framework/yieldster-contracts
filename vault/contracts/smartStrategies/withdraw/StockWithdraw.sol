// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;
import "../../storage/VaultStorage.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract StockWithdraw is VaultStorage {
   
    using SafeMath for uint256;
    using SafeERC20 for IERC20;


    function updateAndTransferTokens(
        address tokenAddress,
        uint256 updatedBalance,
        uint256 shares,
        uint256 transferAmount
    ) internal {
        tokenBalances.setTokenBalance(
            tokenAddress,
            tokenBalances.getTokenBalance(tokenAddress).sub(updatedBalance)
        );
        _burn(msg.sender, shares);
        if(tokenAddress==eth){
            address payable to = payable(msg.sender);
            to.transfer(transferAmount);
        }
        else{
            IERC20(tokenAddress).safeTransfer(msg.sender, transferAmount);
        }
    }

    

    /// @dev Function to Withdraw assets from the Vault.
    /// @param _tokenAddress Address of the withdraw token.
    /// @param _shares Amount of Vault token shares.
    function withdraw(address _tokenAddress, uint256 _shares) public {
        addToAssetList(_tokenAddress);
        uint256 tokenCountDecimals;
        uint256 tokenUSD = IAPContract(APContract).getUSDPrice(_tokenAddress);
        if(_tokenAddress==eth){
            uint256 tokenCount = (
            (_shares.mul(getVaultNAV())).div(totalSupply()).mul(1e18)
        ).div(tokenUSD);
         tokenCountDecimals = IHexUtils(
            IAPContract(APContract).stringUtils()
        ).fromDecimals(wEth, tokenCount);

        }
        else{
        uint256 tokenCount = (
            (_shares.mul(getVaultNAV())).div(totalSupply()).mul(1e18)
        ).div(tokenUSD);
         tokenCountDecimals = IHexUtils(
            IAPContract(APContract).stringUtils()
        ).fromDecimals(_tokenAddress, tokenCount);
        }
        if (tokenCountDecimals <= tokenBalances.getTokenBalance(_tokenAddress))
            {
                updateAndTransferTokens(
                _tokenAddress,
                tokenCountDecimals,
                _shares,
                tokenCountDecimals);
            }
        else
            revert("required asset not present in vault");
    }

    /// @dev Function to Withdraw shares from the Vault.
    /// @param _shares Amount of Vault token shares.
    function withdraw(uint256 _shares) public {
        uint256 safeTotalSupply = totalSupply();
        _burn(msg.sender, _shares);
        

        for (uint256 i = 0; i < assetList.length; i++) {
            IERC20 token = IERC20(assetList[i]);
            if (tokenBalances.getTokenBalance(assetList[i]) > 0) {
                uint256 tokensToGive = (
                    _shares.mul(tokenBalances.getTokenBalance(assetList[i]))
                ).div(safeTotalSupply);
                tokenBalances.setTokenBalance(
                    assetList[i],
                    tokenBalances.getTokenBalance(assetList[i]).sub(
                        tokensToGive
                    )
                );
                token.safeTransfer(msg.sender, tokensToGive);
            }
        }
    }
}
