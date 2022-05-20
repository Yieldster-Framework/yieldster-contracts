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

contract("Should create a vault with condition2, test vault functions and deposit 10 different tokens to it", async (accounts) => {

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
            [tokens[0],tokens[3]],
            [tokens[0],tokens[3]],
            [],
            [],
        );
        assert.equal(await apContract.isDepositAsset(tokens[0], { from: testVault.address }), true, "Error: asset not set as deposit asset")
        assert.equal(await apContract.isWithdrawalAsset(tokens[0], { from: testVault.address }), true, "Error: asset not set as withdrawal asset")
    })

    it("Should change god and enable emergency exit", async () => {
            
        await apContract.setYieldsterGOD(accounts[2])
        god = await apContract.yieldsterGOD();
        await apContract.setEmergencyVault(accounts[4]);
        await testVault.enableEmergencyExit({from:god})
        assert.equal(await apContract.yieldsterGOD(), accounts[2], "error: god mismatch")
    })

    //test cases for assets        
    it("Should try to set deposit & withdrawal asset where asset exists & fail", async () => {

        await expectRevert(
            testVault.setVaultAssets([ether],[ether],[],[]), 
           "safe inactive",
       )       
        
    })

    it("Should try to set deposit & withdrawal asset where asset do not exists & fail", async () => {

        await expectRevert(
            testVault.setVaultAssets(["0x76Eb2FE28b36B3ee97F3Adae0C69606eeDB2A37c"],["0x76Eb2FE28b36B3ee97F3Adae0C69606eeDB2A37c"],[],[]), 
           "safe inactive",
       ) 
    })

    it("Should try to set deposit & withdrawal asset enable and disable asset in same call & fail", async () => {
        await expectRevert(
            testVault.setVaultAssets([tokens[5]],[tokens[5]],[tokens[5]],[tokens[5]]), 
           "safe inactive",
       )
        
    })

     //test cases for smart strategies
     it("Should try to set vault smart startegy not approved by aps & fail", async () => {
        await expectRevert(
            testVault.setVaultSmartStrategy("0x76Eb2FE28b36B3ee97F3Adae0C69606eeDB2A37c",1),
           "Smart Strategy not Supported by Yieldster",
       ) 
    })

    it("Should try to set strategy percentage and beneficiary  & fail",async ()=>{
        await expectRevert(
            testVault.setBeneficiaryAndPercentage(accounts[3],"2000000000000000000"),
           "safe inactive",
       )
    })

    it("Should check isVaultAdmin modifier by changing threshold value",async ()=>{
        await testVault.setThreshold("2000000000000000000")
        assert.equal("2000000000000000000",(await testVault.threshold()).toString(),"Wrong Threshold")
        await expectRevert(
            testVault.setThreshold("5000000000000000000000",{from:accounts[4]}),
           "not vaultAdmin",
        )
    })

     //test cases for deposit
     it("Should try to deposit 10  ${tokens[0]}  to the vault & fail", async () => {
        let token = await ERC20.at(tokens[0])

        await token.approve(testVault.address, convertUtils.to18("10"), {
            from: accounts[0]
        })
        await expectRevert(
            testVault.deposit(token.address, convertUtils.to18("10"), {from: accounts[0]}),
           "safe inactive",
      ) 
    })

    it("Should try to deposit 1 Ether to the vault & fail", async () => {
        assert.equal(0, convertUtils.from18((await testVault.getTokenBalance(ether)).toString()))
        await expectRevert(
            testVault.deposit(ether, convertUtils.to18("1"), { value: convertUtils.to18("1"),from: accounts[0]}),
           "safe inactive",
      )
    })

    it("Should direct transfer 10 dai", async () => {                
        let token = await ERC20.at(tokens[0])
        assert.equal(0, convertUtils.from18((await testVault.getTokenBalance(token.address)).toString()))
        assert.equal(0, convertUtils.from18((await token.balanceOf(testVault.address)).toString()))
        await token.transfer(testVault.address,convertUtils.to18("10"),{from: accounts[0]});
        assert.equal(0, convertUtils.from18((await testVault.getTokenBalance(token.address)).toString()))
        assert.equal(10, convertUtils.from18((await token.balanceOf(testVault.address)).toString()))
    })

    it("Should direct transfer 1 ether", async () => {
        assert.equal(0, convertUtils.from18((await testVault.getTokenBalance(ether)).toString()))
        assert.equal(0, convertUtils.from18(( await web3.eth.getBalance(testVault.address)).toString()))
        await web3.eth.sendTransaction({ to: testVault.address, from: accounts[1], value: convertUtils.to18("1") })            
        assert.equal(0, convertUtils.from18((await testVault.getTokenBalance(ether)).toString()))
        assert.equal(1, convertUtils.from18(( await web3.eth.getBalance(testVault.address)).toString()))
    })

    it("Should try to deposit 10 USDC to the vault (asset is not part of vaultAsset) & fail", async () => {
        let usdc = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"

        await expectRevert(
            testVault.deposit(usdc, convertUtils.to6("100"), {from:accounts[0]}),
            "safe inactive",
        )
    })


    //test cases for withdraw
        //3082 tokens
        it("Should try to withdraw 2 vault tokens in ${tokens[0]} & fail", async () => {
        let token = await ERC20.at(tokens[0])
        await expectRevert(
            testVault.withdraw(token.address,convertUtils.to18("2"), {from:accounts[0],gas:10000000}),
            "safe inactive",
        )
        })

        it("Should try to withdraw 10 vault tokens in ${tokens[0]} from user not having vault token", async () => {
        let token = await ERC20.at(tokens[0])
        await expectRevert(
            testVault.withdraw(token.address,convertUtils.to18("10"), {from:accounts[1],gas:10000000}),
            "safe inactive",
        )
        })

        it("Should try to withdraw 100 vault tokens in ether & fail", async () => {
            await expectRevert(
                testVault.withdraw(ether,convertUtils.to18("100"), {from:accounts[0],gas:10000000}),
                "safe inactive",
            )

        })

        it("Should try to withdraw 1000 vault tokens in ${tokens[3]}, but enough usdt is not present in vault", async () => {
        let token = await ERC20.at(tokens[3])
        await expectRevert(
            testVault.withdraw(token.address,convertUtils.to18("1000"), {from:accounts[0],gas:10000000}),
            "safe inactive",
        )
        })

        //out of gas test cases                                     
        it("enable emergency exit with large number of assets", async () => {
        let token = await ERC20.at(tokens[0])

            god = await apContract.yieldsterGOD();
            await apContract.setEmergencyVault(accounts[4]);
            await token.approve(testVault.address, convertUtils.to18("100"), {
                from: accounts[0]
            })
            try{
                 await testVault.deposit(token.address, convertUtils.to18("100"), {
                from: accounts[0]
            });
            }catch(err){
                assert.include(err.message, "safe inactive", 
                "The error message should contain 'safe inactive'"); 
            }
        })


        //god based test cases
        it("Should try to set yieldster vault by non god & fail", async () => {
            god = await apContract.yieldsterGOD();
            await expectRevert(
                testVault.upgradeMasterCopy(yieldsterVaultMasterCopy.address,{from:accounts[3]}),
                "unauthorized",
            )
        })

        it("Should set yieldster vault god", async () => {   
               await apContract.setYieldsterGOD(accounts[9],{from:accounts[2]}),
               assert.equal(accounts[9],await apContract.yieldsterGOD(),"god is not set")
              
        })

        it("Should not be able to set APS by non god", async () => {
            god = await apContract.yieldsterGOD();
            await expectRevert(
                testVault.setAPS("0x76Eb2FE28b36B3ee97F3Adae0C69606eeDB2A37c",{from:accounts[0]}),
                "unauthorized",
            )  
        })

        it("Should set APS by god", async () => {
            god = await apContract.yieldsterGOD();
            await testVault.setAPS("0x76Eb2FE28b36B3ee97F3Adae0C69606eeDB2A37c",{from:god})
            aps = await testVault.APContract()
            assert.equal(aps,"0x76Eb2FE28b36B3ee97F3Adae0C69606eeDB2A37c","error : aps not changed")
            
        })


});

