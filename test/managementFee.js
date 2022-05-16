let { time } = require('@openzeppelin/test-helpers');
const utils = require("./utils/general");
const ERC20 = artifacts.require("IERC20")
const APContract = artifacts.require("./aps/APContract.sol");
const ProxyFactory = artifacts.require("./proxies/YieldsterVaultProxyFactory.sol");
const YieldsterVault = artifacts.require("./YieldsterVault.sol");
const ProfitManagementFee = artifacts.require("./delegateContract/ProfitManagementFee.sol")
const ManagementFee = artifacts.require("./delegateContract/ManagementFee.sol")
const USDC = artifacts.require("./dummytokens/dummyUSDC")
const DAI = artifacts.require("./dummytokens/dummyDAI")
const ETH = artifacts.require("./dummytokens/dummyETH")
const PriceModule = artifacts.require('./price/MockPriceModule.sol');
const SafeMinter = artifacts.require("./safeUtils/SafeMinter.sol")
const SafeUtils = artifacts.require("./safeUtils/SafeUtils.sol");
 
const Web3 = require("web3");
let web3 = new Web3("ws://localhost:8545");
const BN = web3.utils.BN;
 
async function to18(amount) {
    let tokenBalance = (new BN(amount)).mul((new BN('10').pow(new BN("18"))));
    return tokenBalance.toString();
}
 
async function getVaultNAV(vault) {
    let vaultNAV = await vault.getVaultNAV()
    // return (vaultNAV.div((new BN("10").pow("18")))).toString()
    console.log("Vault NAV =", vaultNAV.toString())
}
 
contract("Testing ManagementFee", function (accounts) {
    let tokenUSD;
    let nav1,nav2,fee1,fee2,fee3,fee5;
    let dai, usdc, ether,eleven;
    let testVault;
    let one,z,nav3,nav5,nav4,nav6,nav7,nav8,nav9,nav10,amount,amount1,amount3,amount31,amountU1,seventh;
    let newamount2;
 
    it("before each", async () => {
        //---------------------------------CREATING-TOKENS-OBJECT-------------------------------------------//
        dai = await DAI.deployed();
        usdc = await USDC.deployed();
        ether = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
        weth = await ETH.deployed();
        //-------------------------------------------------------------------------------------------------//
        apContract = await APContract.deployed();
        yieldsterVaultMasterCopy = await YieldsterVault.deployed();
        proxyFactory = await ProxyFactory.deployed();
        profitManagementFee = await ProfitManagementFee.deployed();
        managementFee = await ManagementFee.deployed();
        priceModule = await PriceModule.deployed();
        safeMinter = await SafeMinter.deployed();
        safeUtils = await SafeUtils.deployed();
        //*******************************CONFIG********************************************************* */
        console.log("Adding tokens in batches")
        await priceModule.addTokenInBatches(
            [
                dai.address,//dummy dai
                usdc.address,//dummy usdc
                weth.address,//dummy ETH,
                ether
            ],
            [
                "0x0000000000000000000000000000000000000000",
                "0x0000000000000000000000000000000000000000",
                "0x0000000000000000000000000000000000000000",
                "0x0000000000000000000000000000000000000000"
            ],
            [
                "1",
                "2",
                "3",
                "3"
            ]
        );
 
        await apContract.addAsset(dai.address)
        await apContract.addAsset(usdc.address)
        await apContract.addAsset(weth.address)
        await apContract.addAsset(ether)
        await apContract.setWETH(weth.address)
        //********************************************************************************************** */
        const testVaultData = await yieldsterVaultMasterCopy.contract.methods
            .setup(
                apContract.address,
                accounts[0],
            )
            .encodeABI();
 
        testVault = await utils.getParamFromTxEvent(
            await proxyFactory.createProxy(testVaultData),
            "ProxyCreation",
            "proxy",
            proxyFactory.address,
            YieldsterVault,
            "create Yieldster Vault"
        );
 
        console.log(`vault owner:- ${await testVault.owner()}, vault address:- ${testVault.address}`);
 
        console.log("Register Vault with APS")
        await testVault.registerVaultWithAPS();
 
        console.log("Set Vault Assets")
        await testVault.setVaultAssets(
            [dai.address, usdc.address, ether],
            [dai.address, usdc.address, ether],
            [],
            [],
        );
 
        console.log("==============================setbeneficiary===========================")
        await testVault.setBeneficiaryAndPercentage(accounts[5], "2000000000000000000")
        console.log("beneficiary ", await testVault.strategyBeneficiary())
        console.log("percentage ", (await testVault.strategyPercentage()).toString())
 
        console.log("================Mint=tokens=to=user====================================")
        await dai.mintTokens("100000000000000000000000");
        await usdc.mintTokens("100000000000000000000000");
        await weth.mintTokens("100000000000000000000000");
    });
 
 
    it("initial deposit of 500 usdc,then 2000", async () => {
       
        await usdc.approve(testVault.address, "12000000000000000000000");
        nav1=(await testVault.getVaultNAV()).toString()
 
        await testVault.deposit(usdc.address, await to18("500"));
        nav2=(await testVault.getVaultNAV()).toString() 
        fee1=((new BN(nav2).sub(new BN(nav1))).mul(new BN('2000000000000000000'))).div(new BN('100000000000000000000'))
        tokenUSD=await priceModule.getUSDPrice(usdc.address)
        amount1=(fee1.mul(new BN('1000000000000000000'))).div(tokenUSD)
        //console.log("amount1",amount1.toString())
        assert.equal(
            (await usdc.balanceOf(accounts[5])).toString(),
            0,
            "incorrect value of USDC in Beneficiary"
        );
 
        await testVault.deposit(usdc.address, await to18("2000"));
        nav3=(await testVault.getVaultNAV()).toString()
        assert.equal(
            (await usdc.balanceOf(accounts[5])).toString(),
            amount1.toString(),
            "incorrect value of USDC in Beneficiary"
        );
   
    });
 
 
 
    it("Deposit 0.2 ether,0.2 ether", async () => {
        await testVault.deposit(ether, "200000000000000000", { value: "200000000000000000" });
        nav4=(await testVault.getVaultNAV()).toString()
        fee2=((new BN(nav4).sub(new BN(nav3))).mul(new BN('2000000000000000000'))).div(new BN('100000000000000000000'))
        //console.log("fee2",fee2.toString())
        let tokenEther=await priceModule.getUSDPrice(ether)
        amount2=(fee2.mul(new BN('1000000000000000000'))).div(tokenEther)
        newamount2=amount2.add(new BN('100000000000000000000'))
        await testVault.deposit(ether, "200000000000000000", { value: "200000000000000000" });
        nav5=(await testVault.getVaultNAV()).toString()
       // console.log("newamount2",newamount2.toString())
         assert.equal(
            await web3.eth.getBalance(accounts[5]),
            newamount2.toString(),
            "incorrect value of ether in Beneficiary"
        );
    });
 
 
    it(" 2000 usdc,then 2000", async () => {
        await testVault.deposit(usdc.address, await to18("2000"));
        nav6=(await testVault.getVaultNAV()).toString()
        fee3=((new BN(nav5).sub(new BN(nav4))).mul(new BN('2000000000000000000'))).div(new BN('100000000000000000000'))
        let tokenUSD=await priceModule.getUSDPrice(usdc.address)
         amount3=((fee3.mul(new BN('1000000000000000000'))).div(tokenUSD)).add(new BN(amount1))        
       // console.log("amount3",amount3.toString())
 
        assert.equal(
            (await usdc.balanceOf(accounts[5])).toString(),
            amount3.toString(),
            "incorrect value of USDC in Beneficiary"
        );
 
        await testVault.deposit(usdc.address, await to18("2000"));
 
        let fee4=((new BN(nav6).sub(new BN(nav5))).mul(new BN('2000000000000000000'))).div(new BN('100000000000000000000'))
        let tokenUSD1=await priceModule.getUSDPrice(usdc.address)
        amount31=((fee4.mul(new BN('1000000000000000000'))).div(tokenUSD1))
        amount31=amount31.add(new BN(amount3))
       // console.log("amount31",amount31.toString())
 
        nav7=(await testVault.getVaultNAV()).toString()
        //console.log("nav7",nav7)
        assert.equal(
            (await usdc.balanceOf(accounts[5])).toString(),
            amount31.toString(),
            "incorrect value of USDC in Beneficiary"
        );  
   
    });
 
 
    it(" withdraw 500 usdc then 2000 usdc", async () => {     
 
        await testVault.withdraw(usdc.address, await to18("500"));
        nav8=(await testVault.getVaultNAV()).toString()
         
 
 
        fee5=((new BN(nav7).sub(new BN(nav6))).mul(new BN('2000000000000000000'))).div(new BN('100000000000000000000'))
         let tokenUSD=await priceModule.getUSDPrice(usdc.address)
        amount4=((fee5.mul(new BN('1000000000000000000'))).div(tokenUSD)).add(new BN(amount31))
     
        // console.log("amount4",amount4.toString())
         assert.equal(
             (await usdc.balanceOf(accounts[5])).toString(),
             amount4.toString(),
             "incorrect value of USDC in Beneficiary"
         );
 
         await testVault.withdraw(usdc.address, await to18("2000"));
 
         assert.equal(
            (await usdc.balanceOf(accounts[5])).toString(),
            amount4.toString(),
            "incorrect value of USDC in Beneficiary"
        );
     });
 
 
     it(" withdraw 0.2 ether then 0.2 ether", async () => {
        assert.equal(
            await web3.eth.getBalance(accounts[5]),
            new BN('100004000000000000000'),
            "incorrect value of ether in Beneficiary"
        );
     
        await testVault.withdraw("0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", "200000000000000000");
        nav9=(await testVault.getVaultNAV()).toString() //510000000000000000000        //6th

         assert.equal(
            await web3.eth.getBalance(accounts[5]),
            new BN('100004000000000000000'),
            "incorrect value of ether in Beneficiary"
        );
     });

     it(" Deposit 2000 usdc twice", async () => {
        await testVault.deposit(usdc.address, await to18("2000"));
        nav10=(await testVault.getVaultNAV()).toString() 
       
    
    
        fee6=((new BN(nav9).sub(new BN(nav8))).mul(new BN('2000000000000000000'))).div(new BN('100000000000000000000'))
        let tokenUSD=await priceModule.getUSDPrice(usdc.address)
        let amount6=((fee6.mul(new BN('1000000000000000000'))).div(tokenUSD)).add(new BN(amount4))
    
        //console.log("amount4",amount4.toString())    
        assert.equal(
            (await usdc.balanceOf(accounts[5])).toString(),
            amount4.toString(),
            "incorrect value of USDC in Beneficiary"
        );
    
        await testVault.deposit(usdc.address, await to18("2000"));
    
    
        fee7=((new BN(nav10).sub(new BN(nav9))).mul(new BN('2000000000000000000'))).div(new BN('100000000000000000000'))
        amount7=((fee7.mul(new BN('1000000000000000000'))).div(tokenUSD))
        amount7=amount7.add(new BN(amount4))
        //console.log("amount7",amount7.toString())
        assert.equal(
            (await usdc.balanceOf(accounts[5])).toString(),
            amount7.toString(),
            "incorrect value of USDC in Beneficiary"
        );
        
    
     });
});
 

