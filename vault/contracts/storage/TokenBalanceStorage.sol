pragma solidity >=0.5.0 <0.7.0;

contract TokenBalanceStorage {
    uint256 private blockNumber; // block number of the last transaction in which management fee was paid.
    uint256 private lastTransactionNav; // last transaction NAV value.
    address private owner; // owner of the contract.
    mapping(address => uint256) tokenBalance; // Balance of each tokens.

    constructor() public {
        blockNumber = block.number;
        owner = msg.sender;
    }

    /// @dev Function to set the balance of a token.
    /// @param _tokenAddress Address of the token.
    /// @param _balance Balance of the token.
    function setTokenBalance(address _tokenAddress, uint256 _balance) public {
        require(msg.sender == owner, "only Owner");
        tokenBalance[_tokenAddress] = _balance;
    }

    /// @dev Function to get the balance of a token.
    /// @param _token Address of the token.
    function getTokenBalance(address _token) public view returns (uint256) {
        return tokenBalance[_token];
    }

    /// @dev Function to set the block Number of the current transaction.
    function setLastTransactionBlockNumber() public {
        require(msg.sender == owner, "only Owner");
        blockNumber = block.number;
    }

    /// @dev Function to get the block Number of the last transaction.
    function getLastTransactionBlockNumber() public view returns (uint256) {
        return blockNumber;
    }

    /// @dev Function to get the NAV of the last transaction.
    function getLastTransactionNav() public view returns (uint256) {
        return lastTransactionNav;
    }

    /// @dev Function to set the NAV of the vault in last transaction.
    /// @param _nav Nav of the vault.
    function setLastTransactionNav(uint256 _nav) public {
        require(msg.sender == owner, "only Owner");
        lastTransactionNav = _nav;
    }
}
