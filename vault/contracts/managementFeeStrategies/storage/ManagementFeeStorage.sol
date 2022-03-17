// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

contract ManagementFeeStorage {
    address public manager;
    uint256 platformFee;


    constructor(uint256 _platformFee) public {
        manager = msg.sender;
        platformFee = _platformFee;
    }

    modifier onlyManager {
        require(msg.sender == manager, "Not Authorized");
        _;
    }

    function setManager(address _manager) external onlyManager {
        manager = _manager;
    }

    function getPlatformFee() external view returns (uint256) {
        return platformFee;
    }

    function setPlatformFee(uint256 _platformFee) external onlyManager {
        platformFee = _platformFee;
    }

}
