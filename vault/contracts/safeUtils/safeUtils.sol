// SPDX-License-Identifier: MIT
pragma solidity >=0.5.0 <0.7.0;
import "../storage/VaultStorage.sol";

contract SafeUtils is VaultStorage {
    /// @dev Function to cleanup vault unsupported tokens to the Yieldster Treasury.
    /// @param cleanUpList List of unsupported tokens to be transfered.
    function safeCleanUp(address[] memory cleanUpList) public {
        for (uint256 i = 0; i < cleanUpList.length; i++) {
            if (!(IAPContract(APContract)._isVaultAsset(cleanUpList[i]))) {
                uint256 _amount = IERC20(cleanUpList[i]).balanceOf(
                    address(this)
                );
                if (_amount > 0) {
                    // Transfer unsupported tonken to Yieldster Treasury.
                    IERC20(cleanUpList[i]).safeTransfer(
                        IAPContract(APContract).yieldsterTreasury(),
                        _amount
                    );
                }
            }
        }
    }

    /// @dev Function to cleanup vault supported tokens and mint corresponding vault tokens to depositor.
    /// @param _assetList Address list of tokens transfered.
    /// @param _amount Amount list of tokens transfered.
    /// @param reciever Address list of transferer.
    function approvedAssetCleanUp(
        address[] memory _assetList,
        uint256[] memory _amount,
        address[] memory reciever
    ) public {
        for (uint256 i = 0; i < _assetList.length; i++) {
            if ((IAPContract(APContract)._isVaultAsset(_assetList[i]))) {
                addToAssetList(_assetList[i]);
                uint256 unmintedShare = IERC20(_assetList[i])
                .balanceOf(address(this))
                .sub(tokenBalances.getTokenBalance(_assetList[i]));
                if (unmintedShare >= _amount[i]) {
                    uint256 tokensToBeMinted = getMintValue(
                        getDepositNAV(_assetList[i], _amount[i])
                    );
                    _mint(reciever[i], tokensToBeMinted);
                    tokenBalances.setTokenBalance(
                        _assetList[i],
                        tokenBalances.getTokenBalance(_assetList[i]).add(
                            _amount[i]
                        )
                    );
                }
            }
        }
    }

    /// @dev Function to pay executor of strategy actions in assets present in vault.
    /// @param gasCost list of gas costs of transactions.
    /// @param beneficiary Address list of beneficiary.
    /// @param gasToken Address list of gasTokens.
    function paybackExecutor(
        uint256[] memory gasCost,
        address[] memory beneficiary,
        address[] memory gasToken
    ) public {
        for (uint256 i = 0; i < gasCost.length; i++) {
            uint256 gasTokenUSD = IAPContract(APContract).getUSDPrice(
                gasToken[i]
            );
            uint256 gasCostUSD = (
                gasCost[i].mul(IAPContract(APContract).getUSDPrice(address(0)))
            )
            .div(1e18);
            uint256 gasTokenCount = IHexUtils(
                IAPContract(APContract).stringUtils()
            ).fromDecimals(
                gasToken[i],
                (gasCostUSD.mul(1e18)).div(gasTokenUSD)
            );
            require(
                gasTokenCount <= tokenBalances.getTokenBalance(gasToken[i]),
                "Not enough gas token"
            );
            tokenBalances.setTokenBalance(
                gasToken[i],
                tokenBalances.getTokenBalance(gasToken[i]).sub(gasTokenCount)
            );
            IERC20(gasToken[i]).safeTransfer(beneficiary[i], gasTokenCount);
        }
    }

    /// @dev Function to update token balance in case of any inconsistancy.
    /// @param _assetList Address list of Assets.
    /// @param _amount Amount list of Assets.
    function tokenBalanceUpdation(
        address[] memory _assetList,
        uint256[] memory _amount
    ) public {
        for (uint256 i = 0; i < _assetList.length; i++) {
            tokenBalances.setTokenBalance(_assetList[i], _amount[i]);
        }
    }

    /// @dev Function to perform Management fee Calculations in the Vault.
    function managementFeeCleanUp() public {
        address[] memory managementFeeStrategies = IAPContract(APContract)
        .getVaultManagementFee();
        // Perform delegate call to management fee strategies.
        for (uint256 i = 0; i < managementFeeStrategies.length; i++) {
            managementFeeStrategies[i].delegatecall(
                abi.encodeWithSignature("executeSafeCleanUp()")
            );
        }
    }
}
