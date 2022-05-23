
const ManagementFee = artifacts.require("./delegateContract/ManagementFee.sol");
module.exports = async (deployer, network, accounts) => {

    await deployer.deploy(ManagementFee);
    const managementFee = await ManagementFee.deployed();

    console.log("management fee address ", managementFee.address);
};