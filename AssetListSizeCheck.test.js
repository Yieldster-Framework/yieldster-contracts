const utils = require("./test/utils/general");
const convertUtils = require("./test/utils/conversion");
const APContract = artifacts.require("./aps/APContract.sol");
const ProxyFactory = artifacts.require("./proxies/YieldsterVaultProxyFactory.sol");
const YieldsterVault = artifacts.require("./YieldsterVault.sol");
const Whitelist = artifacts.require("./whitelist/Whitelist.sol");
const TokenFactory = artifacts.require("./mocks/TokenFactory.sol");
const ERC20 = artifacts.require("ERC20")
const MockPriceModule = artifacts.require("./mocks/MockPriceModule.sol");
const { deployTokens, mintTokens, massApprove, massDeposit, sleep } = require("./test/utils/tokenFactoryUtils");

// const ganache = require('ganache');
// const Web3 = require('web3');
// const provider = ganache.provider();
// const web3 = new Web3(provider);

const {
    BN,           // Big Number support
    constants,    // Common constants, like the zero address and largest integers
    expectEvent,  // Assertions for emitted events
    expectRevert, // Assertions for transactions that should fail
} = require('@openzeppelin/test-helpers');

contract("Should create a vault, test vault functions and deposit 10 different tokens to it", async (accounts) => {

    let ether = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
    let proxyFactory, apContract, tokenFactory, mockPriceModule, yieldsterVaultMasterCopy, testVault;
    let tokens = [];
    let length = 3;
    beforeEach(async function () {
        // web3.setProvider(ganache);
        apContract = await APContract.deployed();
        yieldsterVaultMasterCopy = await YieldsterVault.deployed()
        proxyFactory = await ProxyFactory.deployed()
        whitelist = await Whitelist.deployed()
        tokenFactory = await TokenFactory.deployed();
        mockPriceModule = await MockPriceModule.deployed();
    });

    it(`Should create x unique tokens and mint them to ${accounts[0]}`, async () => {
        tokens = await deployTokens(length, tokenFactory);
        await mintTokens(tokens, accounts[0])
    })

    it("Should add these tokens to priceModule and aps", async () => {
        await apContract.addAsset(ether)
        await mockPriceModule.addToken(ether, "4")
        let indices = tokens.map((e, i) => i % 3 + 1);
        await mockPriceModule.addTokenInBatches(tokens, indices)
        for (let index = 0; index < tokens.length; index++) {
            let token = tokens[index];
            await apContract.addAsset(token)
        }
    })

    it("Should create a new vault", async () => {
        testVaultData = await yieldsterVaultMasterCopy.contract.methods
            .setup(
                apContract.address,
                accounts[0]
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
        console.log("Test vault address: ", testVault.address)
        await testVault.setTokenDetails("Test Token", "TT");
    })

    it("Should test vault admin", async () => {
        assert.equal(await testVault.vaultAdmin(), accounts[0], "error: vault admin mismatch")
    })

    it("Should check vault token name & symbol", async () => {
        assert.equal(await testVault.name(), "Test Token", "error: token name mismatch")
        assert.equal(await testVault.symbol(), "TT", "error: token symbol mismatch")
    })

    it("Should register vault with APS", async () => {
        await testVault.registerVaultWithAPS()
    })

    it("Should set deposit & withdrawal assets", async () => {
        await testVault.setVaultAssets(
            [...tokens],
            [...tokens],
            [],
            [],
        );
    })

    it("Should set minimum threshold value", async () => {
        await testVault.setThreshold("2000000000000000000")
        assert.equal("2000000000000000000", (await testVault.threshold()).toString(), "Wrong Threshold")
    })

    it(`Should deposit 10 of each to the vault`, async () => {
        let token = await ERC20.at(tokens[length - 1])
        let token2 = await ERC20.at(tokens[length - 2])
        let token3 = await ERC20.at(tokens[length - 3])

        await massApprove(tokens, testVault.address, "100000000000000000000000", length, accounts)


        // await testVault.deposit(tokens[0], "100000000000000000000000");
        // console.log("Vault NAV", (await testVault.getVaultNAV()).toString())

        // await testVault.deposit(tokens[1], convertUtils.to18("10"));
        // console.log("Vault NAV", (await testVault.getVaultNAV()).toString())
        
        // await testVault.deposit(tokens[2], convertUtils.to18("10"));
        // console.log("Vault NAV", (await testVault.getVaultNAV()).toString())

        // await testVault.deposit(tokens[3], convertUtils.to18("10"));
        // console.log("Vault NAV", (await testVault.getVaultNAV()).toString())

        // await testVault.deposit(tokens[4], convertUtils.to18("10"));
        // console.log("Vault NAV", (await testVault.getVaultNAV()).toString())

        // await testVault.deposit(tokens[5], convertUtils.to18("10"));
        // console.log("Vault NAV", (await testVault.getVaultNAV()).toString())

        // await testVault.deposit(tokens[6], convertUtils.to18("10"));
        // console.log("Vault NAV", (await testVault.getVaultNAV()).toString())

        // await testVault.deposit(tokens[7], convertUtils.to18("10"));
        // console.log("Vault NAV", (await testVault.getVaultNAV()).toString())

        // await testVault.deposit(tokens[8], convertUtils.to18("10"));
        // console.log("Vault NAV", (await testVault.getVaultNAV()).toString())

        // await testVault.deposit(tokens[9], convertUtils.to18("10"));
        // console.log("Vault NAV", (await testVault.getVaultNAV()).toString())

        // await testVault.deposit(tokens[10], convertUtils.to18("10"));
        // console.log("Vault NAV", (await testVault.getVaultNAV()).toString())

        // await testVault.deposit(tokens[11], convertUtils.to18("10"));
        // console.log("Vault NAV", (await testVault.getVaultNAV()).toString())

        // await testVault.deposit(tokens[12], convertUtils.to18("10"));
        // console.log("Vault NAV", (await testVault.getVaultNAV()).toString())

        // await testVault.deposit(tokens[0], convertUtils.to18("10"));
        // console.log("Vault NAV", (await testVault.getVaultNAV()).toString())

        // await testVault.deposit(tokens[0], convertUtils.to18("10"));
        // console.log("Vault NAV", (await testVault.getVaultNAV()).toString())

        // await testVault.deposit(tokens[0], convertUtils.to18("10"));
        // console.log("Vault NAV", (await testVault.getVaultNAV()).toString())

        // await testVault.deposit(tokens[0], convertUtils.to18("10"));
        // console.log("Vault NAV", (await testVault.getVaultNAV()).toString())


    })

});
