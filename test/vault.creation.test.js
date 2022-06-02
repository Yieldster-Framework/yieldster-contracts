const utils = require("./utils/general");
const convertUtils = require("./utils/conversion");
const APContract = artifacts.require("./aps/APContract.sol");
const ProxyFactory = artifacts.require("./proxies/YieldsterVaultProxyFactory.sol");
const YieldsterVault = artifacts.require("./YieldsterVault.sol");
const Whitelist = artifacts.require("./whitelist/Whitelist.sol");
const TokenFactory = artifacts.require("./mocks/TokenFactory.sol");
const ERC20 = artifacts.require("ERC20")
const MockPriceModule = artifacts.require("./mocks/MockPriceModule.sol");
const { deployTokens, mintTokens } = require("./utils/tokenFactoryUtils");

const {
    BN,           // Big Number support
    constants,    // Common constants, like the zero address and largest integers
    expectEvent,  // Assertions for emitted events
    expectRevert, // Assertions for transactions that should fail
} = require('@openzeppelin/test-helpers');

contract("Should create a vault, test vault functions and deposit 10 different tokens to it", async (accounts) => {

    let ether = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
    // const gnosisEmergency = "0x671515ae6e11443ce81f726F60953367b304FC0F";
    const gnosisEmergency = accounts[2];

    let proxyFactory, apContract, tokenFactory, mockPriceModule, yieldsterVaultMasterCopy, testVault;

    let tokens = [];

    beforeEach(async function () {
        apContract = await APContract.deployed();
        yieldsterVaultMasterCopy = await YieldsterVault.deployed()
        proxyFactory = await ProxyFactory.deployed()
        whitelist = await Whitelist.deployed()
        tokenFactory = await TokenFactory.deployed();
        mockPriceModule = await MockPriceModule.deployed();
    });

    it(`Should create 10 unique tokens and mint them to ${accounts[0]}`, async () => {
        tokens = await deployTokens(5, tokenFactory);
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
        await apContract.setWETH(tokens[0])

    })

    it("Should create a new vault", async () => {
        testVaultData = await yieldsterVaultMasterCopy.contract.methods
            .setup(
                apContract.address,
                accounts[0],
                gnosisEmergency
            )
            .encodeABI();
        console.log(testVaultData, "Test Vault Data")
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
            [tokens[0], tokens[1]],
            [tokens[0], tokens[2]],
            [],
            [],
        )
        await testVault.setBeneficiaryAndPercentage(accounts[1], "2000000000000000000")
        await testVault.setThreshold("2000000000000000000")
    })

    //test cases for deposit
    it(`Should deposit 100 of tokens[0] to the vault from accounts[0]`, async () => {
        let token = await ERC20.at(tokens[0])
        await token.approve(testVault.address, "100000000000000000000")
        await testVault.deposit(token.address, "100000000000000000000");
    })

});