//initially migrate this and then add managagement fee address to platform and profit management fee contracts before deploying them

const ManagementFeeStorage = artifacts.require("./delegateContract/storage/ManagementFeeStorage.sol");

module.exports = async (deployer, network, accounts) => {
    console.log(network)
    await deployer.deploy(ManagementFeeStorage, "500000000000000000");
    const managementFeeStorage = await ManagementFeeStorage.deployed();

    console.log("management fee storage address ", managementFeeStorage.address);
};