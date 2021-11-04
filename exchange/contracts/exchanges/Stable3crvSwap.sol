// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../interfaces/ICurveFunctions.sol";
import "../interfaces/ICurveSwap.sol";
import "../interfaces/ICurveUSDCPoolExchange.sol";
import "../interfaces/IYieldsterExchange.sol";
import "../interfaces/ICrvPool.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract Stable3crvSwap {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;
    address public curveAddressProvider; // Address of the Curve Address provider.
    address public owner; // Address of the owner.
    address public stableCoinSwapper; // Address of Stable Coin swap Contract.
    address public basePool; // Address of Curve DAI/USDC/USDT pool.

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
        (bool isBase, uint256 index, uint256 n_coin) = _isBaseToken(_from);
        IERC20(_from).safeTransferFrom(msg.sender, address(this), _amount);
        uint256[3] memory baseTokenShare;

        if (!isBase) {
            (
                uint256 returnAmount,
                uint256 baseTokenIndex,
                address _swappedAsset
            ) = _swapNoneBase(_from, _amount, n_coin);
            IERC20(_swappedAsset).safeApprove(basePool, returnAmount);
            baseTokenShare[baseTokenIndex] = returnAmount;
        } else {
            baseTokenShare[index] = _amount;
            IERC20(_from).safeApprove(basePool, _amount);
        }
        uint256 balanceBefore = IERC20(_to).balanceOf(address(this));
        ICrvPool(basePool).add_liquidity(baseTokenShare, _minReturn);
        uint256 balanceAfter = IERC20(_to).balanceOf(address(this));
        uint256 _returnAmount = balanceAfter.sub(balanceBefore);
        IERC20(_to).safeTransfer(msg.sender, _returnAmount);
        return _returnAmount;
    }

    /// @dev Function that returns if a token is base pool token, along with its position and total coins.
    /// @param _token Address of the Token.
    function _isBaseToken(address _token)
        private
        view
        returns (
            bool status,
            uint256 index,
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
        for (uint256 i; i < n_coin[0]; i++) {
            if (_token == baseTokens[i]) {
                return (true, i, n_coin[0]);
            }
        }
        return (false, 0, n_coin[0]);
    }

    /// @dev Function to swap From Token to any available base pool token.
    /// @param _from Address of From Token.
    /// @param _amount Amount of From Tokens to swap.
    /// @param _baseCoinLength Number of coins present in base pool.
    function _swapNoneBase(
        address _from,
        uint256 _amount,
        uint256 _baseCoinLength
    )
        private
        returns (
            uint256,
            uint256,
            address
        )
    {
        address mainRegistry = ICurveFunctions(curveAddressProvider)
            .get_address(0);
        address swapRegistry = ICurveFunctions(curveAddressProvider)
            .get_address(2);
        address[8] memory baseTokens = ICurveFunctions(mainRegistry).get_coins(
            basePool
        );
        for (uint256 i; i < _baseCoinLength; i++) {
            (address _pool, ) = ICurveSwap(swapRegistry).get_best_rate(
                _from,
                baseTokens[i],
                _amount
            );
            if (_pool != address(0)) {
                IERC20(_from).safeApprove(stableCoinSwapper, _amount);
                uint256 returnAmount = IYieldsterExchange(stableCoinSwapper)
                    .swap(_from, baseTokens[i], _amount, 0);

                return (returnAmount, i, baseTokens[i]);
            }
        }
        revert("no swappable pool");
    }
}
