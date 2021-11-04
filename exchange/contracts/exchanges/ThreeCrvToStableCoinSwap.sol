// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../interfaces/ICurveFunctions.sol";
import "../interfaces/ICurveSwap.sol";
import "../interfaces/ICurveUSDCPoolExchange.sol";
import "../interfaces/IYieldsterExchange.sol";
import "../interfaces/ICrvPool.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract ThreeCrvToStableCoinSwap {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;
    address public curveAddressProvider; // Address of the Curve Address provider.
    address public owner; // Address of the owner.
    address public stableCoinSwapper; // Address of Stable Coin swap Contract.
    address public basePool; // Address of Curve DAI/USDC/USDT pool.
    address public basePoolToken; // Address of base pool Token (3Crv)

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner allowed");
        _;
    }

    constructor(address _stableCoinSwapper) {
        owner = msg.sender;
        curveAddressProvider = address(
            0x0000000022D53366457F9d5E68Ec105046FC4383
        );
        stableCoinSwapper = _stableCoinSwapper;
        basePool = address(0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7);
        basePoolToken = (0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490);
    }

    /// @dev Function to set owner.
    /// @param _owner Address of the owner.
    function setOwner(address _owner) external onlyOwner {
        owner = _owner;
    }

    /// @dev Function to change the address of Curve Address provider contract.
    /// @param _crvAddressProvider Address of new Curve Address provider contract.
    function changeAddressProvider(address _crvAddressProvider)
        external
        onlyOwner
    {
        curveAddressProvider = _crvAddressProvider;
    }

    /// @dev Function to swap From Token to To Token.
    /// @param _from Address of From Token.
    /// @param _to Address of To Token.
    /// @param _amount Amount of From Tokens to swap.
    /// @param _minReturn Min amount of To Token expected.
    function swap(
        address _from,
        address _to,
        uint256 _amount,
        uint256 _minReturn
    ) external returns (uint256) {
        require(_from == basePoolToken, "from token not a 3crv token");
        (bool isBase, int128 index, uint256 n_coin) = _isBaseToken(_from);
        IERC20(_from).safeTransferFrom(msg.sender, address(this), _amount);
        uint256 returnAmount;
        if (isBase) {
            returnAmount = _swapToBasePoolCoins(
                _from,
                _to,
                _amount,
                index,
                _minReturn
            );
        } else {
            returnAmount = _swapBaseToNonBaseToken(
                _to,
                _amount,
                n_coin,
                _minReturn
            );
        }
        IERC20(_to).safeTransfer(msg.sender, returnAmount);
        return returnAmount;
    }

    /// @dev Swap 3crv tokens into three pool base tokens (DAI,USDC,USDT)
    /// @param _from Address of From Token.
    /// @param _to Address of To Token.
    /// @param _amount Amount of From Tokens to swap.
    /// @param index Index of token in the pool.
    /// @param _minReturn Min amount of To Token expected.
    function _swapToBasePoolCoins(
        address _from,
        address _to,
        uint256 _amount,
        int128 index,
        uint256 _minReturn
    ) private returns (uint256) {
        IERC20(_from).safeApprove(basePool, _amount);
        uint256 balanceBefore = IERC20(_to).balanceOf(address(this));
        ICrvPool(basePool).remove_liquidity_one_coin(
            _amount,
            index,
            _minReturn
        );
        uint256 balanceAfter = IERC20(_to).balanceOf(address(this));
        uint256 _returnAmount = balanceAfter.sub(balanceBefore);
        return _returnAmount;
    }

    /// @dev Swap 3crv tokens into base tokens
    /// @param _to Address of To Token.
    /// @param _amount Amount of From Tokens to swap.
    /// @param _baseCoinLength Number of coins present in base pool.
    /// @param _minReturn Min amount of To Token expected.
    function _swapBaseToNonBaseToken(
        address _to,
        uint256 _amount,
        uint256 _baseCoinLength,
        uint256 _minReturn
    ) private returns (uint256) {
        address mainRegistry = ICurveFunctions(curveAddressProvider)
            .get_address(0);
        address swapRegistry = ICurveFunctions(curveAddressProvider)
            .get_address(2);
        address[8] memory baseTokens = ICurveFunctions(mainRegistry).get_coins(
            basePool
        );
        for (uint256 i; i < _baseCoinLength; i++) {
            (address _pool, ) = ICurveSwap(swapRegistry).get_best_rate(
                baseTokens[i],
                _to,
                _amount
            );
            if (_pool != address(0)) {
                uint256 _returnedBasecoins = _swapToBasePoolCoins(
                    basePoolToken,
                    baseTokens[i],
                    _amount,
                    int128(uint128(i)),
                    0
                );

                IERC20(baseTokens[i]).safeApprove(
                    stableCoinSwapper,
                    _returnedBasecoins
                );
                uint256 returnAmount = IYieldsterExchange(stableCoinSwapper)
                    .swap(baseTokens[i], _to, _returnedBasecoins, _minReturn);

                return (returnAmount);
            }
        }
        revert("no swappable pool");
    }

    /// @dev Function that returns if a token is base pool token, along with its position and total coins.
    /// @param _token Address of the Token.
    function _isBaseToken(address _token)
        private
        view
        returns (
            bool status,
            int128 index,
            uint256 length
        )
    {
        address mainRegistry = ICurveFunctions(curveAddressProvider)
            .get_address(0);
        uint256[2] memory n_coin = ICurveFunctions(mainRegistry).get_n_coins(
            basePool
        );
        address[8] memory baseTokens = ICurveFunctions(mainRegistry).get_coins(
            basePool
        );
        for (int128 i; uint256(int256(i)) < n_coin[0]; i++) {
            if (_token == baseTokens[uint256(int256(i))]) {
                return (true, i, n_coin[0]);
            }
        }
        return (false, 0, n_coin[0]);
    }
}
