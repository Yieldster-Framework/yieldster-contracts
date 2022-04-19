//Run only after deploying sdk contract
const utils = require("./utils/general");
const ERC20 = artifacts.require("IERC20")
const APContract = artifacts.require("./aps/APContract.sol");
const ProxyFactory = artifacts.require("./proxies/YieldsterVaultProxyFactory.sol");
const YieldsterVault = artifacts.require("./YieldsterVault.sol");
const Whitelist = artifacts.require("./whitelist/Whitelist.sol");
const SDKFunction = artifacts.require("./SDKFunction.sol")


var abi = require('ethereumjs-abi');

function to18(n) {
    return web3.utils.toWei(n, "ether");
}
function from18(n) {
    return web3.utils.fromWei(n, "ether");
}
function to6(n) {
    return web3.utils.toWei(n, "Mwei");
}
function from6(n) {
    return web3.utils.fromWei(n, "Mwei");
}
contract("yieldster 2.0", function (accounts) {
    let dai, usdc, usdt, busd;
    let uCrvUSDPToken, uCrvUSDNToken, uCrvBUSDToken, uCrvALUSDToken, uCrvLUSDToken;
    let crvUSDP, crvUSDN, crvALUSD, crvLUSD, crvBUSD, crv3;
    let proxyFactory, apContract;
    let yieldsterVaultMasterCopy;

    beforeEach(async function () {

        dai = await ERC20.at("0x6B175474E89094C44Da98b954EedeAC495271d0F")
        usdc = await ERC20.at("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48")
        usdt = await ERC20.at("0xdac17f958d2ee523a2206206994597c13d831ec7")
        ether = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
        
        apContract = await APContract.deployed();
        yieldsterVaultMasterCopy = await YieldsterVault.deployed()
        proxyFactory = await ProxyFactory.deployed()
        whitelist = await Whitelist.deployed()
        sdkFunction = await SDKFunction.deployed()
        console.log("apContract test",apContract.address)
        console.log("yieldsterVaultMasterCopy test",yieldsterVaultMasterCopy.address)
        console.log("proxyfactory test",proxyFactory.address)
        console.log("whitelist test",whitelist.address)

    });

    it("should create a new vault", async () => {
        testVaultData = await yieldsterVaultMasterCopy.contract.methods
            .setup(
                apContract.address,
                accounts[0]
            )
            .encodeABI();

            console.log("encoded data",testVaultData)

        testVault = await utils.getParamFromTxEvent(
            await proxyFactory.createProxy(testVaultData),
            "ProxyCreation",
            "proxy",
            proxyFactory.address,
            YieldsterVault,
            "create Yieldster Vault"
        );

        

        console.log(
            "vault owner",
            await testVault.owner(),
            "other address",
            accounts[0],"vaultAdmin",
            await testVault.vaultAdmin()," vaultaddress ",testVault.address
        );
        

        console.log("setUp TokenName and tokenSymbol");
        await testVault.setTokenDetails("Test Token","TT");

        console.log("Register Vault with APS")
        await testVault.registerVaultWithAPS()


        console.log("Set Vault Assets")
        await testVault.setVaultAssets(
            [dai.address, usdc.address, usdt.address,ether],
            [dai.address, usdc.address, usdt.address,ether],
            [],
            [],
        );
        

        console.log("vaultNAV ",from18(await testVault.getVaultNAV()).toString())

        //Transfer Token
        await dai.transfer(accounts[1], to18("2000"))

        //Approve Token
        await dai.approve(testVault.address, to18("2000"), { from: accounts[1] })

        //Deposit
        console.log("Vault NAV =", from18(await testVault.getVaultNAV()).toString())
        console.log("Vault Token Value =", from18(await testVault.tokenValueInUSD()).toString())
        console.log("usdc in User =", from6((await usdc.balanceOf(accounts[1])).toString()))
        console.log("usdc in Vault =", from6((await usdc.balanceOf(testVault.address)).toString()))
        console.log("dai in Vault =", from18((await dai.balanceOf(testVault.address)).toString()))
        console.log("usdc from vault",from6((await testVault.getTokenBalance(usdc.address)).toString()))
        console.log("dai from vault",from18((await testVault.getTokenBalance(dai.address)).toString()))
        
        console.log("==============================Deposit=============================")
        await testVault.deposit(dai.address, to18("2000"), { from: accounts[1] });

        //After Deposit

        console.log("Vault NAV =", from18(await testVault.getVaultNAV()).toString())
        console.log("Vault Token Value =", from18(await testVault.tokenValueInUSD()).toString())
        console.log("usdc in Vault =", from6((await usdc.balanceOf(testVault.address)).toString()))
        console.log("dai in Vault =", from18((await dai.balanceOf(testVault.address)).toString()))
        console.log("usdc from vault",from6((await testVault.getTokenBalance(usdc.address)).toString()))
        console.log("dai from vault",from18((await testVault.getTokenBalance(dai.address)).toString()))
        console.log("vault token in user ",from18((await testVault.balanceOf(accounts[1])).toString()))

        console.log("==========================using sdk functions======================")

        const data = web3.eth.abi.encodeFunctionCall({
            type:"function",
            name:"returnNothing",
            inputs:[{
                type:"address",
                name:"_fromToken",
            }]
        },[dai.address])

        console.log("data ",data )
        
        await testVault.toPause()
        await sdkFunction.protocolInteraction(testVault.address,"0x5402D6c0AAf70ad068c9C278d302F037047EA3FE",data,to18("7"),dai.address,[])

        
        const data1 = web3.eth.abi.encodeFunctionCall({
            type:"function",
            name:"acceptNothingReturnsNothing",
            inputs:[]
        },[])

        console.log("data ",data1 )
        await sdkFunction.protocolInteraction(testVault.address,"0x5402D6c0AAf70ad068c9C278d302F037047EA3FE",data1,[],[],[])

        const data2 = web3.eth.abi.encodeFunctionCall({
            type:"function",
            name:"returnUSDC",
            inputs:[]
        },[])

        console.log("data ",data2 )
        await sdkFunction.protocolInteraction(testVault.address,"0x5402D6c0AAf70ad068c9C278d302F037047EA3FE",data2,[],[],[usdc.address])

        const data3 = web3.eth.abi.encodeFunctionCall({
            type:"function",
            name:"acceptEther",
            inputs:[]
        },[])

        console.log("data ",data3 )
        await sdkFunction.protocolInteraction(testVault.address,"0x5402D6c0AAf70ad068c9C278d302F037047EA3FE",data3,[to18("7")],[ether],[])


        console.log("usdc in Vault =", from6((await usdc.balanceOf(testVault.address)).toString()))
        console.log("dai in Vault =", from18((await dai.balanceOf(testVault.address)).toString()))
        console.log("usdc from vault",from6((await testVault.getTokenBalance(usdc.address)).toString()))
        console.log("dai from vault",from18((await testVault.getTokenBalance(dai.address)).toString()))

        console.log("usdc in sdkFunction =", from6((await usdc.balanceOf(sdkFunction.address)).toString()))
        console.log("usdc from vault using sdk",from6((await sdkFunction.getTokenBalance(usdc.address,testVault.address)).toString()))
        console.log("dai from vault using sdk",from18((await sdkFunction.getTokenBalance(dai.address,testVault.address)).toString()))
       

       

    });
});
