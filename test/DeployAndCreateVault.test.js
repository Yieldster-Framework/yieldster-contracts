const truffleAssert = require('truffle-assertions');
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
    it(`deposit 10 of ${tokens[0]} to the vault`, async () => {
        console.log(tokens[0])
        let token = await ERC20.at(tokens[0])

        await token.approve(testVault.address, convertUtils.to18("10"))
        
        console.log((await token.allowance(accounts[0],testVault.address)).toString())
        await testVault.deposit(token.address, convertUtils.to18("10"));
        console.log((await token.balanceOf(testVault.address)).toString())
        console.log((await testVault.getVaultNAV()).toString())

        // assert.equal(10, convertUtils.from18((await token.balanceOf(testVault.address)).toString()))
    })

    // it("deposit 1 Ether to the vault", async () => {
    //     assert.equal(0, convertUtils.from18((await testVault.getTokenBalance(ether)).toString()))
    //     await testVault.deposit(ether, convertUtils.to18("1"), { value: convertUtils.to18("1"), from: accounts[0] });
    //     assert.equal(1, convertUtils.from18((await testVault.getTokenBalance(ether)).toString()))
    // })

    // it("direct transfer 10 dai", async () => {
    //     assert.equal(10, convertUtils.from18((await testVault.getTokenBalance(dai.address)).toString()))
    //     assert.equal(10, convertUtils.from18((await dai.balanceOf(testVault.address)).toString()))
    //     await dai.transfer(testVault.address, convertUtils.to18("10"), { from: accounts[0] });
    //     assert.equal(10, convertUtils.from18((await testVault.getTokenBalance(dai.address)).toString()))
    //     assert.equal(20, convertUtils.from18((await dai.balanceOf(testVault.address)).toString()))
    // })

    // it("direct transfer 1 ether", async () => {
    //     assert.equal(1, convertUtils.from18((await testVault.getTokenBalance(ether)).toString()))
    //     assert.equal(1, convertUtils.from18(( await web3.eth.getBalance(testVault.address)).toString()))
    //     await web3.eth.sendTransaction({ to: testVault.address, from: accounts[1], value: convertUtils.to18("1") })            
    //     assert.equal(1, convertUtils.from18((await testVault.getTokenBalance(ether)).toString()))
    //     assert.equal(2, convertUtils.from18(( await web3.eth.getBalance(testVault.address)).toString()))
    // })

    // it("deposit 10 USDC to the vault (asset is not part of vaultAsset)", async () => {
    //     try {
    //         await usdc.approve(testVault.address, convertUtils.to6("100"), {
    //             from: accounts[0]
    //         })
    //         await testVault.deposit(usdc.address, convertUtils.to6("100"), {
    //             from: accounts[0]
    //         });
    //     } catch (err) {
    //         assert.include(err.message, "Not an approved deposit asset", "The error message should contain 'Not an approved deposit asset'");
    //     }
    // })



    // //test cases for withdraw
    // //3082 tokens
    // it("withdraw 2 vault tokens in dai", async () => {
    //     let vaultTokenInUserBefore = convertUtils.from18((await testVault.balanceOf(accounts[0])).toString())
    //     await testVault.withdraw(dai.address, convertUtils.to18("2"), { from: accounts[0], gas: 10000000 });
    //     let vaultTokenInUserAfter = convertUtils.from18((await testVault.balanceOf(accounts[0])).toString())
    //     assert.equal(2, vaultTokenInUserBefore - vaultTokenInUserAfter, "incorrect")
    // })

    // it("withdraw 10 vault tokens in dai from user not having vault token", async () => {
    //     try {
    //         await testVault.withdraw(dai.address, convertUtils.to18("10"), { from: accounts[3], gas: 10000000 });
    //     } catch (err) {
    //         assert.include(err.message, "You don't have enough shares", "The error message should contain 'You don't have enough shares'");
    //     }
    // })

    // it("withdraw 100 vault tokens in ether", async () => {
    //     let vaultTokenInUserBefore = convertUtils.from18((await testVault.balanceOf(accounts[0])).toString())
    //     await testVault.withdraw(ether, convertUtils.to18("100"), { from: accounts[0], gas: 10000000 });
    //     let vaultTokenInUserAfter = convertUtils.from18((await testVault.balanceOf(accounts[0])).toString())
    //     assert.equal(100, vaultTokenInUserBefore - vaultTokenInUserAfter, "incorrect")
    // })

    // it("withdraw 1000 vault tokens in usdt, but enough usdt is not present in vault", async () => {
    //     try {
    //         await testVault.withdraw(usdt.address, convertUtils.to18("1000"), { from: accounts[0], gas: 10000000 });
    //     } catch (err) {
    //         assert.include(err.message, "required asset not present in vault", "The error message should contain 'required asset not present in vault'");
    //     }
    // })

    // //ERC1155 test
    // it("NFT received from other random NFT contract", async () => {
    //     let airData = web3.eth.abi.encodeFunctionCall({
    //         name: "addNewAirline",
    //         type: "function",
    //         inputs: [{
    //             name: "initialSupply",
    //             type: "uint256",
    //         }
    //         ]
    //     }, [convertUtils.to18("5")])

    //     try {
    //         await airlineTokens.mintVal(testVault.address, airData)
    //     } catch (err) {
    //         assert.include(err.message, "Only Safe Minter", "The error message should contain 'Only Safe Minter'")
    //     }
    // })

    // //out of gas test cases
    // it("enable emergency exit with large number of assets", async () => {
    //     god = await apContract.yieldsterGOD();
    //     assert.equal(god, accounts[0], "account[0] not god")
    //     await apContract.setEmergencyVault(accounts[4]);
    //     await dai.approve(testVault.address, convertUtils.to18("100"), {
    //         from: accounts[0]
    //     })
    //     await testVault.deposit(dai.address, convertUtils.to18("100"), {
    //         from: accounts[0]
    //     });
    //     await usdt.approve(testVault.address, convertUtils.to6("100"), {
    //         from: accounts[0]
    //     })
    //     await testVault.deposit(usdt.address, convertUtils.to6("100"), {
    //         from: accounts[0]
    //     });
    //     await testVault.enableEmergencyExit({ from: god })
    // })

    // //TODO isWhitelisted test

    // //god based test cases
    // it("set yieldster vault by non god", async () => {
    //     god = await apContract.yieldsterGOD();
    //     assert.equal(god, accounts[0], "account[0] not god")
    //     try {
    //         await testVault.upgradeMasterCopy(yieldsterVaultMasterCopy.address, { from: accounts[3] })
    //     } catch (err) {
    //         assert.include(err.message, "unauthorized", "The error message should contain 'unauthorized'")
    //     }
    // })


    // it("set yieldster vault god", async () => {
    //     god = await apContract.yieldsterGOD();
    //     assert.equal(god, accounts[0], "account[0] not god")
    //     await testVault.upgradeMasterCopy(yieldsterVaultMasterCopy.address, { from: god })
    // })

    // it("set APS by non god", async () => {
    //     god = await apContract.yieldsterGOD();
    //     assert.equal(god, accounts[0], "account[0] not god")
    //     try {
    //         await testVault.setAPS("0x76Eb2FE28b36B3ee97F3Adae0C69606eeDB2A37c", { from: accounts[3] })
    //     } catch (err) {
    //         assert.include(err.message, "unauthorized", "The error message should contain 'unauthorized'")
    //     }
    // })

    // it("set APS by god", async () => {
    //     god = await apContract.yieldsterGOD();
    //     await testVault.setAPS("0x76Eb2FE28b36B3ee97F3Adae0C69606eeDB2A37c", { from: god })
    //     aps = await testVault.APContract()
    //     assert.equal(aps, "0x76Eb2FE28b36B3ee97F3Adae0C69606eeDB2A37c", "error : aps not changed")

    // })
});


/**
vault = await YieldsterVault.at("0x2458Bd30cd5d1012f5ABdd97b7098F68d0b84De9")
let token = await ERC20.at("0x8C48f34F626cbAC5893a0c86fcCb13099C6d8F51")

ganache --chain.asyncRequestProcessing false --chain.vmErrorsOnRPCResponse 
 */