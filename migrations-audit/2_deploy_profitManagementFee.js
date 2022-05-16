
const ProfitManagementFee = artifacts.require("./delegateContract/ProfitManagementFee.sol");
module.exports = async (deployer, network, accounts) => {

    await deployer.deploy(ProfitManagementFee);
    const profitManagementFee = await ProfitManagementFee.deployed();

    console.log("Profit Management fee address ", profitManagementFee.address);
};