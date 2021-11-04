// SPDX-License-Identifier: MIT
pragma solidity >=0.5.0 <0.7.0;
import "@chainlink/contracts/src/v0.5/interfaces/AggregatorV3Interface.sol";

contract ChainlinkService {
    /// @dev Function to get price information of a token from using chainlink price feeds.
    /// @param feedAddress Feed address of the token.
    function getLatestPrice(address feedAddress)
        public
        view
        returns (
            int256,
            uint256,
            uint8
        )
    {
        AggregatorV3Interface priceFeed = AggregatorV3Interface(feedAddress);
        (, int256 price, , uint256 timeStamp, ) = priceFeed.latestRoundData();
        uint8 decimal = priceFeed.decimals();
        return (price, timeStamp, decimal);
    }
}
