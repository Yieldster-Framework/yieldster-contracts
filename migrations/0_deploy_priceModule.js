const MockPriceModule = artifacts.require("./mocks/priceModuleMock.sol");

module.exports = async(deployer,network,accounts) =>{
    await deployer.deploy(MockPriceModule)
    const mockPriceModule = await MockPriceModule.deployed();
    console.log("Mock Price Module address ", mockPriceModule.address);

    
}
