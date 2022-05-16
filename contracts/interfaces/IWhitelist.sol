// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

interface IWhitelist {
    function isMember(uint256, address) external view returns (bool);
}
