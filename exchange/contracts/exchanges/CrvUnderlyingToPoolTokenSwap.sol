pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

// TODO: not completed, to be removed if CurveStableCoinSwap &&  StableToCurvePoolTokens are working as expected

contract CrvUnderlyingToPoolTokenSwap {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;
    mapping(address => address) tokenToPool;
    address owner;

    modifier onlyOwner {
        require(msg.sender == owner, "Only owner allowed");
        _;
    }

    constructor() {
        tokenToPool[
            address(0x7Eb40E450b9655f4B3cC4259BCC731c63ff55ae6) //(crvUSDP)
        ] = address(0x42d7025938bEc20B69cBae5A77421082407f053A);
        tokenToPool[
            address(0x4f3E8F405CF5aFC05D68142F3783bDfE13811522) //(crvUSDN)
        ] = address(0x0f9cb53Ebe405d49A0bbdBD291A65Ff571bC83e1);
    }

    function setOwner(address _owner) external onlyOwner {
        owner = _owner;
    }

    function swap(
        address _from,
        address _to,
        uint256 _amount,
        uint256 _minReturn
    ) external returns (uint256) {
        require(_amount > 0, "Amount is Zero!");
        IERC20(_from).safeTransferFrom(msg.sender, address(this), _amount);
        IERC20(_from).safeApprove(tokenToPool[_to], _amount);
    }
}
