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
//const { web3 } = require("@openzeppelin/test-helpers/src/setup");

contract("Should create a vault, test vault functions and deposit 10 different tokens to it", async (accounts) => {

    let ether = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
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
        tokens = await deployTokens(10, tokenFactory);
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
            [...tokens, ether],
            [...tokens, ether],
            [],
            [],
        );
        assert.equal(await apContract.isDepositAsset(ether, { from: testVault.address }), true, "Error: asset not set as deposit asset")
        assert.equal(await apContract.isWithdrawalAsset(ether, { from: testVault.address }), true, "Error: asset not set as withdrawal asset")
    })

    it("Should try to set assets not in aps as deposit & withdrawal assets", async () => {
        await expectRevert(
            testVault.setVaultAssets(
                ["0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"],
                ["0xdac17f958d2ee523a2206206994597c13d831ec7"],
                [],
                [],
            ),
            'Asset not supported by Yieldster',
        );
    })

    it("Should set strategy percentage and beneficiary", async () => {
        await testVault.setBeneficiaryAndPercentage(accounts[1], "2000000000000000000")
        assert.equal(accounts[1], await testVault.strategyBeneficiary(), "Wrong beneficiary")
        assert.equal("2000000000000000000", (await testVault.strategyPercentage()).toString(), "Wrong percentage")
    })

    it("Should set minimum threshold value", async () => {
        await testVault.setThreshold("2000000000000000000")
        assert.equal("2000000000000000000", (await testVault.threshold()).toString(), "Wrong Threshold")
    })

    //test cases for deposit
    it(`Should deposit 100 of ${tokens[0]} to the vault`, async () => {
        let token = await ERC20.at(tokens[0])
        await token.approve(testVault.address, convertUtils.to18("100"))
        await testVault.deposit(token.address, convertUtils.to18("100"));

        assert.equal(100, convertUtils.from18((await token.balanceOf(testVault.address)).toString()))
    })

    it("should deposit 1 Ether to the vault", async () => {

        console.log("eth bal of accounts[0]",await web3.eth.getBalance(accounts[0]))
        assert.equal(0, convertUtils.from18((await testVault.getTokenBalance(ether)).toString()))
        await mockPriceModule.addToken(ether, "4")
        await testVault.deposit(ether, convertUtils.to18("1"), { value: convertUtils.to18("1"), from: accounts[0] });
        assert.equal(1, convertUtils.from18((await testVault.getTokenBalance(ether)).toString()))
    })
   

    it("`Should transfer 100 of ${tokens[0]} to the vault`", async () => {
        let token = await ERC20.at(tokens[0])
        assert.equal(100, convertUtils.from18((await testVault.getTokenBalance(token.address)).toString()))
        assert.equal(100, convertUtils.from18((await token.balanceOf(testVault.address)).toString()))
        await token.transfer(testVault.address, convertUtils.to18("100"), { from: accounts[0] });
        assert.equal(100, convertUtils.from18((await testVault.getTokenBalance(token.address)).toString()))
        assert.equal(200, convertUtils.from18((await token.balanceOf(testVault.address)).toString()))
    })

    it("direct transfer 1 ether", async () => {
        assert.equal(1, convertUtils.from18((await testVault.getTokenBalance(ether)).toString()))
        assert.equal(1, convertUtils.from18(( await web3.eth.getBalance(testVault.address)).toString()))
        await web3.eth.sendTransaction({ to: testVault.address, from: accounts[1], value: convertUtils.to18("1") })            
        assert.equal(1, convertUtils.from18((await testVault.getTokenBalance(ether)).toString()))
        assert.equal(2, convertUtils.from18(( await web3.eth.getBalance(testVault.address)).toString()))
    })


//try putting usdc
    // it("deposit 10 ${tokens[11]} to the vault (asset is not part of vaultAsset)", async () => {
    //     let token = await ERC20.at(tokens[11])
    //     try {
    //         await token.approve(testVault.address, convertUtils.to6("100"), {
    //             from: accounts[0]
    //         })
    //         await testVault.deposit(token.address, convertUtils.to6("100"), {
    //             from: accounts[0]
    //         });
    //     } catch (err) {
    //         assert.include(err.message, "Not an approved deposit asset", "The error message should contain 'Not an approved deposit asset'");
    //     }
    // })



    // //test cases for withdraw
    // //3082 tokens
    it("withdraw 2 vault tokens in ${tokens[0]}", async () => {
        let token = await ERC20.at(tokens[0])

        let vaultTokenInUserBefore = convertUtils.from18((await testVault.balanceOf(accounts[0])).toString())
        console.log("vaultTokenInUserBefore",vaultTokenInUserBefore)
        await testVault.withdraw(token.address, convertUtils.to18("2"), { from: accounts[0], gas: 10000000 });
        let vaultTokenInUserAfter = convertUtils.from18((await testVault.balanceOf(accounts[0])).toString())
        console.log("vaultTokenInUserAfter",vaultTokenInUserAfter)

        assert.equal(2, vaultTokenInUserBefore - vaultTokenInUserAfter, "incorrect")
    })

    it("withdraw 10 vault tokens in ${tokens[0] from user not having vault token", async () => {
        let token = await ERC20.at(tokens[0])
        try {
            await testVault.withdraw(token.address, convertUtils.to18("10"), { from: accounts[3], gas: 10000000 });
        } catch (err) {
            assert.include(err.message, "You don't have enough shares", "The error message should contain 'You don't have enough shares'");
        }
    })

    it("withdraw 1 vault tokens in ether", async () => {
        let vaultTokenInUserBefore = convertUtils.from18((await testVault.balanceOf(accounts[0])).toString())
        console.log("vaultTokenInUserBefore",vaultTokenInUserBefore)
        await testVault.withdraw(ether, convertUtils.to18("1"), { from: accounts[0], gas: 10000000 });
        let vaultTokenInUserAfter = convertUtils.from18((await testVault.balanceOf(accounts[0])).toString())
        assert.equal(1, vaultTokenInUserBefore - vaultTokenInUserAfter, "incorrect")
    })

    it("withdraw 5 vault tokens in  ${tokens[2], but enough  ${tokens[2] is not present in vault", async () => {
        let token2 = await ERC20.at(tokens[2])
        let vaultTokenInUserBefore = convertUtils.from18((await testVault.balanceOf(accounts[0])).toString())
        console.log("vaultTokenInUserBefore",vaultTokenInUserBefore)
        try {
            await testVault.withdraw(token2.address, convertUtils.to18("5"), { from: accounts[0], gas: 10000000 });
        } catch (err) {
            assert.include(err.message, "required asset not present in vault", "The error message should contain 'required asset not present in vault'");
        }
    })

    
    //out of gas test cases
    it("enable emergency exit with large number of assets", async () => {
        let token = await ERC20.at(tokens[0])
        let token2 = await ERC20.at(tokens[2])

        god = await apContract.yieldsterGOD();
        assert.equal(god, accounts[0], "account[0] not god")
        await apContract.setEmergencyVault(accounts[4]);
        await token.approve(testVault.address, convertUtils.to18("100"), {
            from: accounts[0]
        })
        await testVault.deposit(token.address, convertUtils.to18("100"), {
            from: accounts[0]
        });
        await token2.approve(testVault.address, convertUtils.to6("100"), {
            from: accounts[0]
        })
        await testVault.deposit(token2.address, convertUtils.to6("100"), {
            from: accounts[0]
        });
        await testVault.enableEmergencyExit({ from: god })
    })

    //TODO isWhitelisted test

    //god based test cases
    it("set yieldster vault by non god", async () => {
        god = await apContract.yieldsterGOD();
        assert.equal(god, accounts[0], "account[0] not god")
        try {
            await testVault.upgradeMasterCopy(yieldsterVaultMasterCopy.address, { from: accounts[3] })
        } catch (err) {
            assert.include(err.message, "unauthorized", "The error message should contain 'unauthorized'")
        }
    })


    it("set yieldster vault god", async () => {
        god = await apContract.yieldsterGOD();
        assert.equal(god, accounts[0], "account[0] not god")
        await testVault.upgradeMasterCopy(yieldsterVaultMasterCopy.address, { from: god })
    })

    it("set APS by non god", async () => {
        god = await apContract.yieldsterGOD();
        assert.equal(god, accounts[0], "account[0] not god")
        try {
            await testVault.setAPS("0x76Eb2FE28b36B3ee97F3Adae0C69606eeDB2A37c", { from: accounts[3] })
        } catch (err) {
            assert.include(err.message, "unauthorized", "The error message should contain 'unauthorized'")
        }
    })

    it("set APS by god", async () => {
        god = await apContract.yieldsterGOD();
        await testVault.setAPS("0x76Eb2FE28b36B3ee97F3Adae0C69606eeDB2A37c", { from: god })
        aps = await testVault.APContract()
        assert.equal(aps, "0x76Eb2FE28b36B3ee97F3Adae0C69606eeDB2A37c", "error : aps not changed")

    })
});


/**
ganache-cli --chain.asyncRequestProcessing false --chain.vmErrorsOnRPCResponse true
 */