
const SafeUtils = artifacts.require("./safeUtils/SafeUtils.sol");
module.exports = async (deployer, network, accounts) => {
    await deployer.deploy(SafeUtils);
    const safeUtils = await SafeUtils.deployed();

    console.log("safeUtils address ", safeUtils.address);
};