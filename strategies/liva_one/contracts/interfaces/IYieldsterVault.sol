// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IYieldsterVault {
    function tokenValueInUSD() external view returns (uint256);

    function earn(address[] calldata, uint256[] calldata, bytes calldata) external;
}
