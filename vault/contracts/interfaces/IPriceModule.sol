// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;
interface IPriceModule
{
    function getUSDPrice(address ) external view returns(uint256);
}