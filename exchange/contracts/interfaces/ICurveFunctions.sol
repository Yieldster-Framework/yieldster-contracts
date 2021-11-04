// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ICurveFunctions {
    function get_registry() external view returns (address);

    function get_address(uint256) external view returns (address);

    function get_n_coins(address) external view returns (uint256[2] calldata);

    function get_coins(address) external view returns (address[8] calldata);
}
