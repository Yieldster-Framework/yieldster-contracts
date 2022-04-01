// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;
import "../storage/VaultStorage.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract SafeUtils is VaultStorage {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    /// @dev Function to cleanup vault unsupported tokens to the Yieldster Treasury.
    /// @param cleanUpList List of unsupported tokens to be transfered.
    function safeCleanUp(address[] memory cleanUpList) public {
        for (uint256 i = 0; i < cleanUpList.length; i++) {
            if (!(IAPContract(APContract)._isVaultAsset(cleanUpList[i]))) {
                if (cleanUpList[i] == eth) {
                    uint256 amount = address(this).balance;
                    processEther(
                        amount,
                        IAPContract(APContract).yieldsterTreasury()
                    );
                } else {
                    uint256 _amount = IERC20(cleanUpList[i]).balanceOf(
                        address(this)
                    );
                    if (_amount > 0) {
                        IERC20(cleanUpList[i]).safeTransfer(
                            IAPContract(APContract).yieldsterTreasury(),
                            _amount
                        );
                    }
                }
            }
        }
    }

    function approvedAssetCleanUp(
        address[] memory _assetList,
        uint256[] memory _amount,
        address[] memory reciever
    ) public {
        for (uint256 i = 0; i < _assetList.length; i++) {
            if ((IAPContract(APContract)._isVaultAsset(_assetList[i]))) {
                addToAssetList(_assetList[i]);
                if (
                    reciever[i] == IAPContract(APContract).yieldsterTreasury()
                ) {
                    processCleanup(_assetList[i]);
                } else {
                    uint256 unmintedShare;
                    if (_assetList[i] == eth) {
                        unmintedShare = (address(this).balance).sub(
                            tokenBalances.getTokenBalance(_assetList[i])
                        );
                    } else {
                        unmintedShare = IERC20(_assetList[i])
                            .balanceOf(address(this))
                            .sub(tokenBalances.getTokenBalance(_assetList[i]));
                    }

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
    }

    function paybackExecutor(
        uint256[] memory gasCost,
        address[] memory beneficiary,
        address[] memory gasToken
    ) public {
        for (uint256 i = 0; i < gasCost.length; i++) {
            require(
                gasCost[i] <= tokenBalances.getTokenBalance(gasToken[i]),
                "Not enough gas token"
            );
            tokenBalances.setTokenBalance(
                gasToken[i],
                tokenBalances.getTokenBalance(gasToken[i]).sub(gasCost[i])
            );
            IERC20(gasToken[i]).safeTransfer(beneficiary[i], gasCost[i]);
        }
    }

    function managementFeeCleanUp(address _tokenAddress, uint256 _type) public {
        address[] memory managementFeeStrategies = IAPContract(APContract)
            .getVaultManagementFee();
        for (uint256 i = 0; i < managementFeeStrategies.length; i++) {
            managementFeeStrategies[i].delegatecall(
                abi.encodeWithSignature(
                    "executeSafeCleanUp(address,uint256)",
                    _tokenAddress,
                    _type
                )
            );
        }
    }

    function tokenBalanceUpdation(
        address[] memory _assetList,
        uint256[] memory _amount
    ) public {
        for (uint256 i = 0; i < _assetList.length; i++) {
            tokenBalances.setTokenBalance(_assetList[i], _amount[i]);
        }
    }

    function processEther(uint256 _etherAmount, address _beneficiary) internal {
        address payable to = payable(_beneficiary);
        to.transfer(_etherAmount);
    }

    function processCleanup(address _asset) internal {
        if (_asset == eth) {
            uint256 amount = address(this).balance;
            processEther(amount, IAPContract(APContract).yieldsterTreasury());
        } else {
            uint256 _amount = IERC20(_asset).balanceOf(address(this));
            if (_amount > 0) {
                IERC20(_asset).safeTransfer(
                    IAPContract(APContract).yieldsterTreasury(),
                    _amount
                );
            }
        }
    }
}
