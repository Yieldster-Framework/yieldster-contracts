// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract dummyToken is ERC20 {
    constructor(string memory name_, string memory symbol_) ERC20(name_, symbol_) {}

    function mintTokens(uint256 amount) public {
        // Mint 1000 tokens to msg.sender
        _mint(msg.sender, amount * 10**uint256(decimals()));
    }

    function mintTokensTo(address receiver) public {
        // Mint 1000 tokens to msg.sender
        _mint(receiver, 1000 * 10**uint256(decimals()));
    }
}