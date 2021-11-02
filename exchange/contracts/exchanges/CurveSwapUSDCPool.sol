pragma solidity ^0.8.0;
import "../interfaces/ICurveUSDCPoolExchange.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract CurveSwapUSDCPool {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;
    address owner;
    address poolAddress;
    mapping(address => int128) tokenIndices;

    constructor() {
        owner = msg.sender;
        poolAddress = address(0xA5407eAE9Ba41422680e2e00537571bcC53efBfD);
        tokenIndices[address(0x6B175474E89094C44Da98b954EedeAC495271d0F)] = 0;
        tokenIndices[address(0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48)] = 1;
        tokenIndices[address(0xdAC17F958D2ee523a2206206994597C13D831ec7)] = 2;
        tokenIndices[address(0x57Ab1ec28D129707052df4dF418D58a2D46d5f51)] = 3;
    }

    modifier onlyOwner {
        require(msg.sender == owner, "Only owner allowed");
        _;
    }

    function swap(
        address _from,
        address _to,
        uint256 _amount,
        uint256 _minReturn
    ) external returns (uint256) {
        require(_amount > 0, "Amount is Zero!");
        IERC20(_from).safeTransferFrom(msg.sender, address(this), _amount);
        IERC20(_from).safeApprove(poolAddress, _amount);
        uint256 balanceBefore = IERC20(_to).balanceOf(address(this));
        ICurveUSDCPoolExchange(poolAddress).exchange(
            tokenIndices[_from],
            tokenIndices[_to],
            _amount,
            _minReturn
        );
        uint256 balanceAfter = IERC20(_to).balanceOf(address(this));
        uint256 _returnAmount = balanceAfter.sub(balanceBefore);
        IERC20(_to).safeTransfer(msg.sender, _returnAmount);
        return _returnAmount;
    }

    function setOwner(address _owner) external onlyOwner {
        owner = _owner;
    }

    function addOrChangeTokenIndex(address _token, int128 _index)
        external
        onlyOwner
    {
        tokenIndices[_token] = _index;
    }

    function removeTokenIndex(address _token) external onlyOwner {
        delete tokenIndices[_token];
    }

    function changePoolAddress(address _poolAddress) external onlyOwner {
        poolAddress = _poolAddress;
    }
}
