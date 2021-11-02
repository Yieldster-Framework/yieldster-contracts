pragma solidity ^0.8.0;

contract ExchangeRegistry {
    address owner;
    // frm asset -> to assets -> contract address
    mapping(address => mapping(address => address)) swapContracts;

    modifier onlyOwner {
        require(msg.sender == owner, "Only owner allowed");
        _;
    }

    function getSwapContract(address _from, address _to)
        public
        view
        returns (address)
    {
        require(
            swapContracts[_from][_to] != address(0),
            "No swap contract available!"
        );
        return swapContracts[_from][_to];
    }

    function setOwner(address _owner) external onlyOwner {
        owner = _owner;
    }

    function addOrChangeSwapContract(
        address _from,
        address _to,
        address _contract
    ) external onlyOwner {
        require(_contract != address(0), "contract address should not be zero");
        swapContracts[_from][_to] = _contract;
    }

    function removeSwapContract(address _from, address _to) external onlyOwner {
        delete swapContracts[_from][_to];
    }
}
