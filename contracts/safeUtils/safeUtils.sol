// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;
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
                        uint256 tokensToBeMinted;
                        if (_assetList[i] == eth) {
                            address wEth = IAPContract(APContract).getWETH();
                            tokensToBeMinted = getMintValue(
                                getDepositNAV(wEth, _amount[i])
                            );
                        } else {
                            tokensToBeMinted = getMintValue(
                                getDepositNAV(_assetList[i], _amount[i])
                            );
                        }
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
            require(
                gasCost[i] <= tokenBalances.getTokenBalance(gasToken[i]),
                "Not enough gas token"
            );
            tokenBalances.setTokenBalance(
                gasToken[i],
                tokenBalances.getTokenBalance(gasToken[i]).sub(gasCost[i])
            );
            if (gasToken[i] == eth) {
                address payable to = payable(beneficiary[i]);
                to.transfer(gasCost[i]);
            } else {
                IERC20(gasToken[i]).safeTransfer(beneficiary[i], gasCost[i]);
            }
        }
    }

    /// @dev Function to perform Management fee Calculations in the Vault.
    /// @param _tokenAddress Address of the token in which fee has to be given.
    /// @param _type Type OF CleanUp.
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

    /// @dev Function to process Ether amount and send to beneficiary.
    /// @param _etherAmount Amount of ether.
    /// @param _beneficiary Address of beneficiary.
    function processEther(uint256 _etherAmount, address _beneficiary) internal {
        address payable to = payable(_beneficiary);
        to.transfer(_etherAmount);
    }

    /// @dev Function to process Cleanup and send value to yieldsterTreasury.
    /// @param _asset Address of Asset on which cleanUp has to be performed.
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
