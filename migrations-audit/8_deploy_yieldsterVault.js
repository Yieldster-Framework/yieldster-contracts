const YieldsterVault = artifacts.require("./YieldsterVault.sol");


module.exports = async (deployer, network, accounts) => {
    await deployer.deploy(YieldsterVault);
    const yieldsterVaultMasterCopy = await YieldsterVault.deployed()
    
    console.log("yieldsterVaultMasterCopy address ", yieldsterVaultMasterCopy.address);
};
