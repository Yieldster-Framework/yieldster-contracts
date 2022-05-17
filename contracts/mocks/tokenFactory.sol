// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./dummyToken.sol";

contract TokenFactory {
    event ERC20TokenCreated(address tokenAddress);

    function deployNewERC20Token(string calldata name, string calldata symbol)
        public
        returns (address)
    {
        dummyToken t = new dummyToken(name, symbol);
        emit ERC20TokenCreated(address(t));

        return address(t);
    }
}
