
const StockWithdraw = artifacts.require("./smartStrategies/withdraw/StockWithdraw.sol");

module.exports = async (deployer, network, accounts) => {
    await deployer.deploy(StockWithdraw);
    const stockWithdraw = await StockWithdraw.deployed();

    console.log("stockWithdraw address ", stockWithdraw.address);
};