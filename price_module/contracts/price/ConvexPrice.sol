// SPDX-License-Identifier: MIT
pragma solidity >=0.5.0 <0.7.0;
import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/IPriceModule.sol";

contract ConvexPrice is Ownable {
    mapping(address => address) convexToCurveLP; // Mapping from Convex Token to curresponding Curve LP token.
    address public priceModule; // Address of the Yieldster Price Module.

    constructor(address _priceModule) public {
        priceModule = _priceModule;
    }

    /// @dev Function to set the address of Price Module.
    /// @param _priceModule Address of the Price Module.
    function setPriceModule(address _priceModule) public onlyOwner {
        priceModule = _priceModule;
    }

    /// @dev Function to add Convex to Curve LP token pairs.
    /// @param convexToken Address of the Convex Token.
    /// @param curveLPToken Address of the Curve LP Token.
    function addConvexToCurveLP(address convexToken, address curveLPToken)
        public
        onlyOwner
    {
        convexToCurveLP[convexToken] = curveLPToken;
    }

    /// @dev Function to add Convex to Curve LP token pair in Batch.
    /// @param convexTokens Address list of the Convex Tokens.
    /// @param curveLPTokens Address list of the Curve LP Tokens.
    function addConvexToCurveLPBatch(
        address[] calldata convexTokens,
        address[] calldata curveLPTokens
    ) external onlyOwner {
        for (uint256 i = 0; i < convexTokens.length; i++) {
            convexToCurveLP[convexTokens[i]] = curveLPTokens[i];
        }
    }

    /// @dev Function to get price of a token from Price Module.
    /// @param _tokenAddress Address of the token.
    function getUSDPrice(address _tokenAddress)
        external
        view
        returns (uint256)
    {
        return
            IPriceModule(priceModule).getUSDPrice(
                convexToCurveLP[_tokenAddress]
            );
    }
}
