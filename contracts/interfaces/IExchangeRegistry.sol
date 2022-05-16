// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

interface IExchangeRegistry {
    function getPair(address, address) external returns (address);
}
