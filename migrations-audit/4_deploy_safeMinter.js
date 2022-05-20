
const SafeMinter = artifacts.require("./safeUtils/SafeMinter.sol");
module.exports = async (deployer, network, accounts) => {
    await deployer.deploy(SafeMinter,accounts[0]);
    const safeMinter = await SafeMinter.deployed();

    console.log("safeMinter address ", safeMinter.address);
};
