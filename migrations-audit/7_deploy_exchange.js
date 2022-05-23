
const Exchange = artifacts.require("./exchange/Exchange.sol");

module.exports = async (deployer, network, accounts) => {
    await deployer.deploy(Exchange);
    const exchange = await Exchange.deployed();

    console.log("exchange address ", exchange.address);
};
