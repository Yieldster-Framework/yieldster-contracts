const AnyswapV6ERC20 = artifacts.require("./AnyswapV6ERC20.sol")

module.exports = async (deployer, network, accounts) => {
    let _name = "rinkeby YXL";
    let _symbol = "rYXLV2";
    let _decimals = "18";
    let _underlying = "0x0000000000000000000000000000000000000000";
    let _vault = accounts[0];
    
    await deployer.deploy(AnyswapV6ERC20,
        _name,
        _symbol,
        _decimals,
        _underlying,
        _vault);
    let token = await AnyswapV6ERC20.deployed();
    console.log(`YXL Token Deployed at ${token.address}`)
    await token.initVault(accounts[0]);

};