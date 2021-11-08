pragma solidity >=0.5.0 <0.8.0;
import "../token/ERC1155/ERC1155.sol";
import "../interfaces/IAPContract.sol";

contract SafeMinter is ERC1155 {
    address public owner; // Address of the owner of the contract
    address public executor; // Address of the executor of Safe Instructions.

    constructor(address _executor)
        public
        ERC1155("https://yieldster.finance/vault/meta/{id}.json")
    {
        owner = msg.sender;
        executor = _executor;
    }

    /// @dev Function to mint 1155 token to a vault address with bytes field containing encoded function call to be executed.
    /// @param safeAddress Address of the Vault.
    /// @param instruction Bytes containing encoded function call.
    function mintStrategy(address safeAddress, string memory instruction)
        public
    {
        require(executor == msg.sender, "Not Authorized");
        _mint(safeAddress, 0, 10**18, bytes(instruction)); // token ID is 0 indicating its Safe Instruction.
    }

    /// @dev Function to set address of the Safe Executor.
    /// @param _executor Address of the Executor.
    function setExecutor(address _executor) public {
        require(msg.sender == owner, "Not Authorized");
        executor = _executor;
    }
}
