const MockPriceModule = artifacts.require("./mocks/MockPriceModule.sol");
const TokenFactory = artifacts.require("./mocks/TokenFactory.sol");

module.exports = async(deployer,network,accounts) =>{
    await deployer.deploy(MockPriceModule)
    await deployer.deploy(TokenFactory)

    const mockPriceModule = await MockPriceModule.deployed();
    console.log("Mock Price Module address ", mockPriceModule.address);

    const tokenFactory = await TokenFactory.deployed();
    console.log("Mock token factory deployed at", tokenFactory.address)
    
}
