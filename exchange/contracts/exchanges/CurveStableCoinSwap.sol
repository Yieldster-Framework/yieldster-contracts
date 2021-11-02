pragma solidity ^0.8.0;

import "../interfaces/ICurveFunctions.sol";
import "../interfaces/ICurveSwap.sol";
import "../interfaces/ICurveUSDCPoolExchange.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract CurveStableCoinSwap {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;
    address public curveAddressProvider;
    uint256 public swapId;
    address public owner;

    modifier onlyOwner {
        require(msg.sender == owner, "Only owner allowed");
        _;
    }

    constructor() {
        owner = msg.sender;
        curveAddressProvider = address(
            0x0000000022D53366457F9d5E68Ec105046FC4383
        );
        swapId = 2;
    }

    function setOwner(address _owner) external onlyOwner {
        owner = _owner;
    }

    function changeAddressProvider(address _newAddress, uint256 _swapAddressId)
        external
        onlyOwner
    {
        curveAddressProvider = _newAddress;
        swapId = _swapAddressId;
    }

    function swap(
        address _from,
        address _to,
        uint256 _amount,
        uint256 _minReturn
    ) external returns (uint256) {
        address swapRegistry = ICurveFunctions(curveAddressProvider)
        .get_address(swapId);
        require(_amount > 0, "Amount is Zero!");
        IERC20(_from).safeTransferFrom(msg.sender, address(this), _amount);
        IERC20(_from).safeApprove(swapRegistry, _amount);
        uint256 _returnAmount = ICurveSwap(swapRegistry)
        .exchange_with_best_rate(_from, _to, _amount, _minReturn, msg.sender);
        return _returnAmount;
    }
}
