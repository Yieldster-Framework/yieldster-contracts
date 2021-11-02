pragma solidity >=0.5.0 <0.7.0;
import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/IPriceModule.sol";

contract ConvexPrice is Ownable {
    mapping(address => address) convexToCurveLP;
    address public priceModule;

    constructor(address _priceModule) public {
        priceModule = _priceModule;
    }

    function setPriceModule(address _priceModule) public onlyOwner {
        priceModule = _priceModule;
    }

    function addConvexToCurveLP(address convexToken, address curveLPToken)
        public
        onlyOwner
    {
        convexToCurveLP[convexToken] = curveLPToken;
    }

    function addConvexToCurveLPBatch(
        address[] calldata convexTokens,
        address[] calldata curveLPTokens
    ) external onlyOwner {
        for (uint256 i = 0; i < convexTokens.length; i++) {
            convexToCurveLP[convexTokens[i]] = curveLPTokens[i];
        }
    }

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
