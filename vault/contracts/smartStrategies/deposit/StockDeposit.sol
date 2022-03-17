// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;
import "../../storage/VaultStorage.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract StockDeposit is VaultStorage {

    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    /// @dev Function to Deposit assets into the Vault.
    /// @param _tokenAddress Address of the deposit token.
    /// @param _amount Amount of deposit token.
    function deposit(address _tokenAddress, uint256 _amount, uint256 _amountForFees) public {
        uint256 _share;
        IERC20 token = IERC20(_tokenAddress);
        if (totalSupply() == 0) {
            _share = IHexUtils(IAPContract(APContract).stringUtils())
                .toDecimals(_tokenAddress, _amount);
        } else {
            _share = getMintValue(getDepositNAV(_tokenAddress, _amount));
        }
        uint256 amountAfterFeeDeduction = _amount.sub(_amountForFees);
        token.safeTransferFrom(msg.sender, address(this), amountAfterFeeDeduction);
        tokenBalances.setTokenBalance(
            _tokenAddress,
            tokenBalances.getTokenBalance(_tokenAddress).add(amountAfterFeeDeduction)
        );
        _mint(msg.sender, _share);
        addToAssetList(_tokenAddress);
    }
}
