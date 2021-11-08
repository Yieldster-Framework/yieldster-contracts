// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "./interfaces/IAPContract.sol";
import "./interfaces/IYieldsterVault.sol";

contract LivaOneMinter is ERC1155 {
    address public APContract; // Address of the AP contract
    address public strategy; // Address of the strategy contract
    address public owner; // Address of the owner of the contract

    constructor(address _APContract, address _strategyAddress)
        ERC1155("https://yieldster.finance/strategy/meta/{id}.json")
    {
        APContract = _APContract;
        strategy = _strategyAddress;
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only permitted to owner");
        _;
    }

    /// @dev Function to set address of the AP Contract.
    /// @param _APContract Address of the AP Contract.
    function setAPContract(address _APContract) public onlyOwner {
        APContract = _APContract;
    }

    /// @dev Function to set address of the Strategy.
    /// @param _strategyAddress Address of the Strategy.
    function setStrategyAddress(address _strategyAddress) public onlyOwner {
        strategy = _strategyAddress;
    }

    /// @dev Function to mint 1155 token to a vault address with bytes field containing encoded function call to be executed.
    /// @param safeAddress Address of the Vault.
    /// @param instruction Bytes containing encoded function call.
    function mintStrategy(address safeAddress, bytes memory instruction)
        public
    {
        require(
            IAPContract(APContract).strategyExecutor(strategy) == msg.sender,
            "Only Yieldster Strategy Executor"
        );
        _mint(safeAddress, 1, 10**18, instruction); // 1 represents the token id, which is strategy instruction.
    }

    /// @dev Function to deposit assets from vault to strategy.
    /// @param safeAddress Address of the Vault.
    /// @param _assets Address list containing assets to be deposited into strategy.
    /// @param _amount Amount list containing corresponding amounts of assets to be deposited into strategy.
    /// @param data Bytes containing encoded parameters that strategy can make use of.
    function earn(
        address safeAddress,
        address[] memory _assets,
        uint256[] memory _amount,
        bytes memory data
    ) public {
        require(
            IAPContract(APContract).strategyExecutor(strategy) == msg.sender,
            "Only Yieldster Strategy Executor"
        );
        IYieldsterVault(safeAddress).earn(_assets, _amount, data);
    }
}
