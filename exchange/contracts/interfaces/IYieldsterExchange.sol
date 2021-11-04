// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IYieldsterExchange {
    function swap(
        address _from,
        address _to,
        uint256 _amount,
        uint256 _minReturn
    ) external returns (uint256);
}
