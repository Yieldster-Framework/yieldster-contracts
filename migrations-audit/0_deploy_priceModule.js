const MockPriceModule = artifacts.require("./mocks/MockPriceModule.sol");
const Factory = artifacts.require("./mocks/TokenFactory.sol");

module.exports = async (deployer, network, accounts) => {
    await deployer.deploy(MockPriceModule)
    await deployer.deploy(Factory)

}
