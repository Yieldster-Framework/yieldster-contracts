// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract dummyToken is ERC20 {
    constructor() ERC20("dummyDAI", "dDAI") {}

    function mintTokens() public {
        // Mint 1000 tokens to msg.sender
        _mint(msg.sender, 1000 * 10**uint256(decimals()));
    }

    function mintTokensTo(address receiver) public {
        // Mint 1000 tokens to msg.sender
        _mint(receiver, 1000 * 10**uint256(decimals()));
    }
}