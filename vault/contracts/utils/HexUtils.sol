pragma solidity >=0.5.0 <0.7.0;
import "../token/ERC20Detailed.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

contract HexUtils {
    using SafeMath for uint256;

    function toDecimals(address tokenAddress, uint256 tokenCount)
        public
        view
        returns (uint256)
    {
        uint8 decimals = ERC20Detailed(tokenAddress).decimals();
        if (decimals < 18) {
            return tokenCount.mul(10**uint256(18 - decimals));
        } else if (decimals > 18) {
            return tokenCount.div(10**uint256(decimals - 18));
        } else {
            return tokenCount;
        }
    }

    function fromDecimals(address tokenAddress, uint256 tokenCount)
        public
        view
        returns (uint256)
    {
        uint8 decimals = ERC20Detailed(tokenAddress).decimals();
        if (decimals < 18) {
            return tokenCount.div(10**uint256(18 - decimals));
        } else if (decimals > 18) {
            return tokenCount.mul(10**uint256(decimals - 18));
        } else {
            return tokenCount;
        }
    }
}
