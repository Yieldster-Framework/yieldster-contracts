// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import "./ChainlinkService.sol";
import "../interfaces/IAddressProvider.sol";
import "../interfaces/IRegistry.sol";
import "../interfaces/yearn/IVault.sol";
import "../interfaces/IYieldsterVault.sol";
import "../interfaces/IPriceModule.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract PriceModuleV4 is ChainlinkService, Initializable {
    using SafeMath for uint256;

    address public priceModuleManager; // Address of the Price Module Manager
    address public curveAddressProvider; // Address of the Curve Address provider contract.

    struct Token {
        address feedAddress;
        uint256 tokenType;
        bool created;
    }

    mapping(address => Token) tokens; // Mapping from address to Token Information

    /// @dev Function to initialize priceModuleManager and curveAddressProvider.
    function initialize() public {
        priceModuleManager = msg.sender;
        curveAddressProvider = 0x0000000022D53366457F9d5E68Ec105046FC4383;
    }

    /// @dev Function to change the address of Curve Address provider contract.
    /// @param _crvAddressProvider Address of new Curve Address provider contract.
    function changeCurveAddressProvider(address _crvAddressProvider) external {
        require(msg.sender == priceModuleManager, "Not Authorized");
        curveAddressProvider = _crvAddressProvider;
    }

    /// @dev Function to set new Price Module Manager.
    /// @param _manager Address of new Manager.
    function setManager(address _manager) external {
        require(msg.sender == priceModuleManager, "Not Authorized");
        priceModuleManager = _manager;
    }

    /// @dev Function to add a token to Price Module.
    /// @param _tokenAddress Address of the token.
    /// @param _feedAddress Chainlink feed address of the token if it has a Chainlink price feed.
    /// @param _tokenType Type of token.
    function addToken(
        address _tokenAddress,
        address _feedAddress,
        uint256 _tokenType
    ) external {
        require(msg.sender == priceModuleManager, "Not Authorized");
        Token memory newToken = Token({
            feedAddress: _feedAddress,
            tokenType: _tokenType,
            created: true
        });
        tokens[_tokenAddress] = newToken;
    }

    /// @dev Function to add tokens to Price Module in batch.
    /// @param _tokenAddress Address List of the tokens.
    /// @param _feedAddress Chainlink feed address list of the tokens if it has a Chainlink price feed.
    /// @param _tokenType Type of token list.
    function addTokenInBatches(
        address[] memory _tokenAddress,
        address[] memory _feedAddress,
        uint256[] memory _tokenType
    ) external {
        require(msg.sender == priceModuleManager, "Not Authorized");
        for (uint256 i = 0; i < _tokenAddress.length; i++) {
            Token memory newToken = Token({
                feedAddress: address(_feedAddress[i]),
                tokenType: _tokenType[i],
                created: true
            });
            tokens[address(_tokenAddress[i])] = newToken;
        }
    }

    /// @dev Function to retrieve price of a token from Chainlink price feed.
    /// @param _feedAddress Chainlink feed address the tokens.
    function getPriceFromChainlink(address _feedAddress)
        internal
        view
        returns (uint256)
    {
        (int256 price, , uint8 decimals) = getLatestPrice(_feedAddress);
        if (decimals < 18) {
            return (uint256(price)).mul(10**uint256(18 - decimals));
        } else if (decimals > 18) {
            return (uint256(price)).div(uint256(decimals - 18));
        } else {
            return uint256(price);
        }
    }

    /// @dev Function to get price of a token.
    /// @param _tokenAddress Address of the token..
    function getUSDPrice(address _tokenAddress) public view returns (uint256) {
        require(tokens[_tokenAddress].created, "Token not present");

        // Token Types
        //     1 = Token with a Chainlink price feed.
        //     2 = USD based Curve Liquidity Pool token.
        //     3 = Yearn Vault Token.
        //     4 = Yieldster Strategy Token.
        //     5 = Yieldster Vault Token.
        //     6 = Ether based Curve Liquidity Pool Token.
        //     7 = Euro based Curve Liquidity Pool Token.
        //     8 = BTC based Curve Liquidity Pool Token.
        //     9 = Convex based Token.

        if (tokens[_tokenAddress].tokenType == 1) {
            return getPriceFromChainlink(tokens[_tokenAddress].feedAddress);
        } else if (tokens[_tokenAddress].tokenType == 2) {
            return
                IRegistry(IAddressProvider(curveAddressProvider).get_registry())
                    .get_virtual_price_from_lp_token(_tokenAddress);
        } else if (tokens[_tokenAddress].tokenType == 3) {
            address token = IVault(_tokenAddress).token();
            uint256 tokenPrice = getUSDPrice(token);
            return
                (tokenPrice.mul(IVault(_tokenAddress).pricePerShare())).div(
                    1e18
                );
        } else if (tokens[_tokenAddress].tokenType == 5) {
            return IYieldsterVault(_tokenAddress).tokenValueInUSD();
        } else if (tokens[_tokenAddress].tokenType == 6) {
            uint256 priceInEther = getPriceFromChainlink(
                tokens[_tokenAddress].feedAddress
            );
            uint256 etherToUSD = getUSDPrice(address(0));
            return (priceInEther.mul(etherToUSD)).div(1e18);
        } else if (tokens[_tokenAddress].tokenType == 7) {
            uint256 lpPriceEuro = IRegistry(
                IAddressProvider(curveAddressProvider).get_registry()
            ).get_virtual_price_from_lp_token(_tokenAddress);
            uint256 euroToUSD = getUSDPrice(
                address(0xb49f677943BC038e9857d61E7d053CaA2C1734C1) // Address representing Euro.
            );
            return (lpPriceEuro.mul(euroToUSD)).div(1e18);
        } else if (tokens[_tokenAddress].tokenType == 8) {
            uint256 lpPriceBTC = IRegistry(
                IAddressProvider(curveAddressProvider).get_registry()
            ).get_virtual_price_from_lp_token(_tokenAddress);
            uint256 btcToUSD = getUSDPrice(
                address(0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c) // Address representing BTC.
            );
            return (lpPriceBTC.mul(btcToUSD)).div(1e18);
        } else if (tokens[_tokenAddress].tokenType == 9) {
            return
                IPriceModule(0x5F660abd9dDFC3f405C370FEeBB48efD7b1788C8) //Address of ConvexPrice contract.
                    .getUSDPrice(_tokenAddress);
        } else revert("Token not present");
    }
}
