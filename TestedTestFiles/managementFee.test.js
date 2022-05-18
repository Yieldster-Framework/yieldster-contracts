let { time } = require('@openzeppelin/test-helpers');
const utils = require("./utils/general");
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
// const { web3 } = require("@openzeppelin/test-helpers/src/setup");
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

contract("Vault 2.0", function (accounts) {
    let dai, usdc, ether;
    let testVault;
    beforeEach(async function () {

        //---------------------------------CREATING-TOKENS-OBJECT-------------------------------------------//
        ether = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
        dai = await DAI.deployed()
        usdc = await USDC.deployed()
        weth = await ETH.deployed()
        //-------------------------------------------------------------------------------------------------//
        apContract = await APContract.deployed()
        yieldsterVaultMasterCopy = await YieldsterVault.deployed()
        proxyFactory = await ProxyFactory.deployed()
        profitManagementFee = await ProfitManagementFee.deployed()
        managementFee = await ManagementFee.deployed()
        priceModule = await PriceModule.deployed()
        safeMinter = await SafeMinter.deployed()
        safeUtils = await SafeUtils.deployed()
       
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
        await testVault.setBeneficiaryAndPercentage(accounts[1], "2000000000000000000")
        console.log("beneficiary ", await testVault.strategyBeneficiary())
        console.log("percentage ", (await testVault.strategyPercentage()).toString())

        console.log("================Mint=tokens=to=user====================================")
        await dai.mintTokens("100000000000000000000000");
        await usdc.mintTokens("100000000000000000000000");
        await weth.mintTokens("100000000000000000000000");


    });

    it("should collect management fee", async () => {
        await usdc.approve(testVault.address, "12000000000000000000000");
        await dai.approve(testVault.address, await to18("12000"));

        console.log("====================BEFORE=DEPOSIT=============================")

        console.log("USDC in Depositor:-", (await usdc.balanceOf(accounts[0])).toString());
        console.log("USDC in Vault:-", (await usdc.balanceOf(testVault.address)).toString());
        console.log("USDC in Beneficiary:-", (await usdc.balanceOf(accounts[1])).toString());
        console.log("ETHER in Depositor:-", await web3.eth.getBalance(accounts[0]));
        console.log("ETHER in Vault:-", await web3.eth.getBalance(testVault.address));
        console.log("ETHER in Beneficiary:-", await web3.eth.getBalance(accounts[1]));
        console.log("DAI in Vault:-", (await dai.balanceOf(testVault.address)).toString());
        console.log("DAI in Beneficiary:-", (await dai.balanceOf(accounts[1])).toString());
        console.log("DAI in Beneficiary:-", (await dai.balanceOf(accounts[1])).toString());
        console.log("USDC in YielsterDAO:-", (await usdc.balanceOf(accounts[2])).toString());
        console.log("DAI in YieldsterDAO:-", (await dai.balanceOf(accounts[2])).toString());
        console.log("ETHER in YielsterDAO:-", await web3.eth.getBalance(accounts[2]));

        console.log("===========================DEPOSIT=============================")

        console.log("\nDepositing 500 usdc")
        await testVault.deposit(usdc.address, await to18("500"));
        await getVaultNAV(testVault)
        console.log("Vault Token Value =", (await testVault.tokenValueInUSD()).toString())
        console.log("USDC in Depositor:-", (await usdc.balanceOf(accounts[0])).toString());
        console.log("USDC in Vault:-", (await usdc.balanceOf(testVault.address)).toString());
        console.log("USDC in Beneficiary:-", (await usdc.balanceOf(accounts[1])).toString());
        console.log("USDC in YielsterDAO:-", (await usdc.balanceOf(accounts[2])).toString());

        console.log("\n===================Increasing block Height===================")
        let target = await web3.eth.getBlockNumber();
        console.log(`Latest Block :- ${target}`)
        await time.advanceBlockTo(target+100)
        console.log(`Latest Block :- ${await web3.eth.getBlockNumber()}`)
        console.log("===============================================================")

        console.log("\nDepositing 2000 usdc")
        await testVault.deposit(usdc.address, await to18("2000"));
        await getVaultNAV(testVault)
        console.log("Vault Token Value =", (await testVault.tokenValueInUSD()).toString())
        console.log("USDC in Depositor:-", (await usdc.balanceOf(accounts[0])).toString());
        console.log("USDC in Vault:-", (await usdc.balanceOf(testVault.address)).toString());
        console.log("USDC in Beneficiary:-", (await usdc.balanceOf(accounts[1])).toString());
        console.log("USDC in YielsterDAO:-", (await usdc.balanceOf(accounts[2])).toString());

        console.log("\n===================Increasing block Height===================")
        target = await web3.eth.getBlockNumber();
        console.log(`Latest Block :- ${target}`)
        await time.advanceBlockTo(target+100)
        console.log(`Latest Block :- ${await web3.eth.getBlockNumber()}`)
        console.log("===============================================================")

        console.log("\nDepositing 0.2 Ether")
        await testVault.deposit(ether, "200000000000000000", { value: "200000000000000000" });
        await getVaultNAV(testVault)
        console.log("Vault Token Value =", (await testVault.tokenValueInUSD()).toString())
        console.log("ETHER in Depositor:-", await web3.eth.getBalance(accounts[0]));
        console.log("ETHER in Vault:-", await web3.eth.getBalance(testVault.address));
        console.log("ETHER in Beneficiary:-", await web3.eth.getBalance(accounts[1]));
        console.log("ETHER in YielsterDAO:-", await web3.eth.getBalance(accounts[2]));

        console.log("\n===================Increasing block Height===================")
        target = await web3.eth.getBlockNumber();
        console.log(`Latest Block :- ${target}`)
        await time.advanceBlockTo(target+100)
        console.log(`Latest Block :- ${await web3.eth.getBlockNumber()}`)
        console.log("===============================================================")
        
        console.log("\nDepositing 0.2 Ether")
        await testVault.deposit(ether, "200000000000000000", { value: "200000000000000000" });
        await getVaultNAV(testVault)
        console.log("Vault Token Value =", (await testVault.tokenValueInUSD()).toString())
        console.log("ETHER in Depositor:-", await web3.eth.getBalance(accounts[0]));
        console.log("ETHER in Vault:-", await web3.eth.getBalance(testVault.address));
        console.log("ETHER in Beneficiary:-", await web3.eth.getBalance(accounts[1]));
        console.log("ETHER in YielsterDAO:-", await web3.eth.getBalance(accounts[2]));

        console.log("\nDepositing 2000 usdc")
        await testVault.deposit(usdc.address, await to18("2000"));
        await getVaultNAV(testVault)
        console.log("Vault Token Value =", (await testVault.tokenValueInUSD()).toString())
        console.log("USDC in Depositor:-", (await usdc.balanceOf(accounts[0])).toString());
        console.log("USDC in Vault:-", (await usdc.balanceOf(testVault.address)).toString());
        console.log("USDC in Beneficiary:-", (await usdc.balanceOf(accounts[1])).toString());
        console.log("USDC in YielsterDAO:-", (await usdc.balanceOf(accounts[2])).toString());

        console.log("\n===================Increasing block Height===================")
        target = await web3.eth.getBlockNumber();
        console.log(`Latest Block :- ${target}`)
        await time.advanceBlockTo(target+100)
        console.log(`Latest Block :- ${await web3.eth.getBlockNumber()}`)
        console.log("===============================================================")

        console.log("\nDepositing 2000 usdc")
        await testVault.deposit(usdc.address, await to18("2000"));
        await getVaultNAV(testVault)
        console.log("Vault Token Value =", (await testVault.tokenValueInUSD()).toString())
        console.log("USDC in Depositor:-", (await usdc.balanceOf(accounts[0])).toString());
        console.log("USDC in Vault:-", (await usdc.balanceOf(testVault.address)).toString());
        console.log("USDC in Beneficiary:-", (await usdc.balanceOf(accounts[1])).toString());
        console.log("USDC in YielsterDAO:-", (await usdc.balanceOf(accounts[2])).toString());

        console.log("\n===================Increasing block Height===================")
        target = await web3.eth.getBlockNumber();
        console.log(`Latest Block :- ${target}`)
        await time.advanceBlockTo(target+100)
        console.log(`Latest Block :- ${await web3.eth.getBlockNumber()}`)
        console.log("===============================================================")

        console.log("\nDepositing 0.2 Ether")
        await testVault.deposit(ether, "200000000000000000", { value: "200000000000000000" });
        await getVaultNAV(testVault)
        console.log("Vault Token Value =", (await testVault.tokenValueInUSD()).toString())
        console.log("ETHER in Depositor:-", await web3.eth.getBalance(accounts[0]));
        console.log("ETHER in Vault:-", await web3.eth.getBalance(testVault.address));
        console.log("ETHER in Beneficiary:-", await web3.eth.getBalance(accounts[1]));
        console.log("ETHER in YielsterDAO:-", await web3.eth.getBalance(accounts[2]));

        console.log("\n===================Increasing block Height===================")
        target = await web3.eth.getBlockNumber();
        console.log(`Latest Block :- ${target}`)
        await time.advanceBlockTo(target+100)
        console.log(`Latest Block :- ${await web3.eth.getBlockNumber()}`)
        console.log("===============================================================")

        console.log("\nDepositing 0.2 Ether")
        await testVault.deposit(ether, "200000000000000000", { value: "200000000000000000" });
        await getVaultNAV(testVault)
        console.log("Vault Token Value =", (await testVault.tokenValueInUSD()).toString())
        console.log("ETHER in Depositor:-", await web3.eth.getBalance(accounts[0]));
        console.log("ETHER in Vault:-", await web3.eth.getBalance(testVault.address));
        console.log("ETHER in Beneficiary:-", await web3.eth.getBalance(accounts[1]));
        console.log("ETHER in YielsterDAO:-", await web3.eth.getBalance(accounts[2]));

        console.log("\n===================Increasing block Height===================")
        target = await web3.eth.getBlockNumber();
        console.log(`Latest Block :- ${target}`)
        await time.advanceBlockTo(target+100)
        console.log(`Latest Block :- ${await web3.eth.getBlockNumber()}`)
        console.log("===============================================================")
        
        console.log("=======================AFTER=DEPOSIT===========================")
        console.log("USDC in Depositor:-", (await usdc.balanceOf(accounts[0])).toString());
        console.log("USDC in Vault:-", (await usdc.balanceOf(testVault.address)).toString());
        console.log("USDC in Beneficiary:-", (await usdc.balanceOf(accounts[1])).toString());
        console.log("USDC in YielsterDAO:-", (await usdc.balanceOf(accounts[2])).toString());
        console.log("ETHER in Depositor:-", await web3.eth.getBalance(accounts[0]));
        console.log("ETHER in Vault:-", await web3.eth.getBalance(testVault.address));
        console.log("ETHER in Beneficiary:-", await web3.eth.getBalance(accounts[1]));
        console.log("ETHER in YielsterDAO:-", await web3.eth.getBalance(accounts[2]));
        console.log("==========================END=DEPOSIT=============================")

        console.log("\n===================Increasing block Height===================")
        target = await web3.eth.getBlockNumber();
        console.log(`Latest Block :- ${target}`)
        await time.advanceBlockTo(target+100)
        console.log(`Latest Block :- ${await web3.eth.getBlockNumber()}`)
        console.log("===============================================================")

        console.log("==========================WITHDRAW================================")

        await testVault.withdraw("0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", "200000000000000000");
        await testVault.withdraw(usdc.address, await to18("2000"));
        console.log("USDC in Depositor:-", (await usdc.balanceOf(accounts[0])).toString());
        console.log("USDC in Vault:-", (await usdc.balanceOf(testVault.address)).toString());
        console.log("USDC in Beneficiary:-", (await usdc.balanceOf(accounts[1])).toString());
        console.log("USDC in YielsterDAO:-", (await usdc.balanceOf(accounts[2])).toString());
        console.log("ETHER in Depositor:-", await web3.eth.getBalance(accounts[0]));
        console.log("ETHER in Vault:-", await web3.eth.getBalance(testVault.address));
        console.log("ETHER in Beneficiary:-", await web3.eth.getBalance(accounts[1]));
        console.log("ETHER in YielsterDAO:-", await web3.eth.getBalance(accounts[2]));


        console.log("\n===================Increasing block Height===================")
        target = await web3.eth.getBlockNumber();
        console.log(`Latest Block :- ${target}`)
        await time.advanceBlockTo(target+100)
        console.log(`Latest Block :- ${await web3.eth.getBlockNumber()}`)
        console.log("===============================================================")

        console.log("==========================END=WITHDRAW=============================")
        console.log("===========================DEPOSIT=================================")

        console.log("\nDepositing 5 dai")
        await testVault.deposit(dai.address, await to18("5"));
        await getVaultNAV(testVault)
        console.log("Vault Token Value =", (await testVault.tokenValueInUSD()).toString())
        console.log("DAI in Depositor:-", (await dai.balanceOf(accounts[0])).toString());
        console.log("DAI in Vault:-", (await dai.balanceOf(testVault.address)).toString());
        console.log("DAI in Beneficiary:-", (await dai.balanceOf(accounts[1])).toString());
        console.log("DAI in YieldsterDAO:-", (await dai.balanceOf(accounts[2])).toString());

        console.log("\n===================Increasing block Height===================")
        target = await web3.eth.getBlockNumber();
        console.log(`Latest Block :- ${target}`)
        await time.advanceBlockTo(target+100)
        console.log(`Latest Block :- ${await web3.eth.getBlockNumber()}`)
        console.log("===============================================================")

        console.log("\nDepositing 5 dai")
        await testVault.deposit(dai.address, await to18("5"));
        await getVaultNAV(testVault)
        console.log("Vault Token Value =", (await testVault.tokenValueInUSD()).toString())
        console.log("DAI in Depositor:-", (await dai.balanceOf(accounts[0])).toString());
        console.log("DAI in Vault:-", (await dai.balanceOf(testVault.address)).toString());
        console.log("DAI in Beneficiary:-", (await dai.balanceOf(accounts[1])).toString());
        console.log("DAI in YieldsterDAO:-", (await dai.balanceOf(accounts[2])).toString());
        console.log("==========================END=DEPOSIT=============================")

        console.log("\n===================Increasing block Height===================")
        target = await web3.eth.getBlockNumber();
        console.log(`Latest Block :- ${target}`)
        await time.advanceBlockTo(target+100)
        console.log(`Latest Block :- ${await web3.eth.getBlockNumber()}`)
        console.log("===============================================================")

    });

});
