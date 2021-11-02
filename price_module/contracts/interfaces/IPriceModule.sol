// SPDX-License-Identifier: MIT
pragma solidity >=0.5.0 <0.7.0;

interface IPriceModule {
    function getUSDPrice(address) external view returns (uint256);
}
