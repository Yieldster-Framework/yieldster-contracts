// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "../interfaces/IAPContract.sol";

contract SafeMinter is ERC1155 {
    address public owner;
    address public executor;

    constructor(address _executor)
        
        ERC1155("https://yieldster.finance/vault/meta/{id}.json")
    {
        owner = msg.sender;
        executor = _executor;
    }

    /// @dev Function to mint 1155 token to a vault address with bytes field containing encoded function call to be executed.
    /// @param safeAddress Address of the Vault.
    /// @param instruction Bytes containing encoded function call.
    function mintStrategy(address safeAddress,  bytes memory instruction)
        public
    {
        require(executor == msg.sender, "Not Authorized");
        _mint(safeAddress, 0, 10**18, instruction);
    }

    /// @dev Function to set address of the Safe Executor.
    /// @param _executor Address of the Executor.
    function setExecutor(address _executor) public {
        require(msg.sender == owner, "Not Authorized");
        executor = _executor;
    }
}
