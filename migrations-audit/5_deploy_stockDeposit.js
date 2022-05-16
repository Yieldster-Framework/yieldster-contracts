
const StockDeposit = artifacts.require("./smartStrategies/deposit/StockDeposit.sol");
module.exports = async (deployer, network, accounts) => {
    await deployer.deploy(StockDeposit);
    const stockDeposit = await StockDeposit.deployed();

    console.log("stockDeposit address ", stockDeposit.address);
};