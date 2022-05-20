const Whitelist = artifacts.require("./Whitelist.sol")

module.exports = async (deployer, network, accounts) => {
    console.log("Minter")
    await deployer.deploy(Whitelist);
    let whitelist = await Whitelist.deployed();
    console.log(`whitelist contract deployed at ${whitelist.address}`);
} 