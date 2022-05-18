// SPDX-License-Identifier: MIT
/**
 This contract is a mock contract of the Yieldster Price module. Instead of relying on chainlink, it returns hardcoded values for the prices
 also, since we do not use chainlink for this, we do not need feed addresses as well.

 */
pragma solidity 0.8.13;
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract priceModuleMock {
    using SafeMath for uint256;

    struct Token {
        uint256 tokenType;
        bool created;
    }

    mapping(address => Token) tokens; // Mapping from address to Token Information
    address public priceModuleManager;

    constructor() public {
        priceModuleManager = msg.sender;
    }

    /// @dev Function to add a token to Price Module.
    /// @param _tokenAddress Address of the token.
    /// @param _tokenType Type of token.
    function addToken(
        address _tokenAddress,
        uint256 _tokenType
    ) external {
        require(msg.sender == priceModuleManager, "Not Authorized");
        Token memory newToken = Token({
            tokenType: _tokenType,
            created: true
        });
        tokens[_tokenAddress] = newToken;
    }

    /// @dev Function to add tokens to Price Module in batch.
    /// @param _tokenAddress Address List of the tokens.
    /// @param _tokenType Type of token list.
    function addTokenInBatches(
        address[] memory _tokenAddress,
        uint256[] memory _tokenType
    ) external {
        require(msg.sender == priceModuleManager, "Not Authorized");
        for (uint256 i = 0; i < _tokenAddress.length; i++) {
            Token memory newToken = Token({
                tokenType: _tokenType[i],
                created: true
            });
            tokens[address(_tokenAddress[i])] = newToken;
        }
    }

    /// @dev Function to get price of a token.
    /// @param _tokenAddress Address of the token..
    function getUSDPrice(address _tokenAddress) public view returns (uint256) {
        require(tokens[_tokenAddress].created, "Token not present");

        // Token Types
        //     1 = Token with price 1 dollar.
        //     2 = Token with price 1.1 dollar.
        //     3 = Token with price 2 dollar.
        if (tokens[_tokenAddress].tokenType == 1) {
            return uint256(1000000000000000000); // 1
        } else if (tokens[_tokenAddress].tokenType == 2) {
            return uint256(1100000000000000000); //1.1
        } else if (tokens[_tokenAddress].tokenType == 3) {
            return uint256(2000000000000000000); //2.0
        }
        else if (tokens[_tokenAddress].tokenType == 4) {
            return uint256(4000000000000000000); //4.0
        }
         else revert("Token not present");
    }
}
