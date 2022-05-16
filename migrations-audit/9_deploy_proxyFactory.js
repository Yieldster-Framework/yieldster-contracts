const ProxyFactory = artifacts.require("./proxies/YieldsterVaultProxyFactory.sol");


module.exports = async (deployer, network, accounts) => {
    await deployer.deploy(ProxyFactory, "0xf1f7587440cadf1b630a03827a04a821852ed69d", "0xCf854a4b799A78bc2b5d311CCDA9e27933A6e477")
    const proxyFactory = await ProxyFactory.deployed();

    console.log("proxyFactory address ", proxyFactory.address);
};
