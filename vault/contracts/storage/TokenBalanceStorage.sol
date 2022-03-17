// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

contract TokenBalanceStorage {

    uint256 public blockNumber;
    uint256 public lastTransactionNAV;
    address private owner;
    mapping(address=>uint256) tokenBalance;

    constructor() public {
        // blockNumber = block.number;
        owner = msg.sender;
    }

    function setTokenBalance(address _tokenAddress, uint256 _balance) public {
        require(msg.sender == owner, "only Owner");
        tokenBalance[_tokenAddress] = _balance;
    }
    

   function getTokenBalance(address _token) public view returns (uint256) {
        return tokenBalance[_token];
    }

    function setLastTransactionBlockNumber() public{
        require(msg.sender==owner,"not authorized");
        blockNumber = block.number;
    }

    function setLastTransactionNAV(uint256 _nav) public{
        require(msg.sender==owner,"not authorized");
        lastTransactionNAV = _nav;
    }

    function getLastTransactionBlockNumber() public view returns (uint256) {
        return blockNumber;
    }

    function getLastTransactionNav() public view returns (uint256) {
        return lastTransactionNAV;
    }


}