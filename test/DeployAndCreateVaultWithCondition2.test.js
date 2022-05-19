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

    it("changing god and enabling emergency exit", async () => {
            
        await apContract.setYieldsterGOD(accounts[2])
        god = await apContract.yieldsterGOD();
        await apContract.setEmergencyVault(accounts[4]);
        await testVault.enableEmergencyExit({from:god})
        assert.equal(await apContract.yieldsterGOD(), accounts[2], "error: god mismatch")
    })

    //test cases for assets        
    it("set deposit & withdrawal asset where asset exists", async () => {
        try{
            await testVault.setVaultAssets(
                [ether],
                [ether],
                [],
                [],
            );
        }catch (err) {
            assert.include(err.message, "safe inactive", 
            "The error message should contain 'safe inactive'");
        }
       
        
    })

    it("set deposit & withdrawal asset where asset do not exists", async () => {
        try{
            await testVault.setVaultAssets(
                ["0x76Eb2FE28b36B3ee97F3Adae0C69606eeDB2A37c"],
                ["0x76Eb2FE28b36B3ee97F3Adae0C69606eeDB2A37c"],
                [],
                [],
            );
        }catch(err){
            assert.include(err.message, "safe inactive", 
            "The error message should contain 'safe inactive'");
        }  
        
    })

    it("set deposit & withdrawal asset enable and disable asset in same call", async () => {
        try{
            await testVault.setVaultAssets(
                [tokens[5]],
                [tokens[5]],
                [tokens[5]],
                [tokens[5]],
            );
        }catch(err){
            assert.include(err.message, "safe inactive", 
            "The error message should contain 'safe inactive'");
        }
        
    })

     //test cases for smart strategies
     it("set vault smart startegy not approved by aps", async () => {
        try{
            await testVault.setVaultSmartStrategy("0x76Eb2FE28b36B3ee97F3Adae0C69606eeDB2A37c",1);
        }catch(err){
            assert.include(err.message, "Smart Strategy not Supported by Yieldster", 
            "The error message should contain 'Smart Strategy not Supported by Yieldster'");
        }
        
    })

    it("set strategy percentage and beneficiary",async ()=>{
        try{
            await testVault.setBeneficiaryAndPercentage(accounts[3],"2000000000000000000")
                }catch(err){
                    assert.include(err.message, "safe inactive", 
                    "The error message should contain 'safe inactive'"); 
                }
    })

    it("checking isVaultAdmin modifier by changing threshold value",async ()=>{
        await testVault.setThreshold("2000000000000000000")
        assert.equal("2000000000000000000",(await testVault.threshold()).toString(),"Wrong Threshold")
        try{
            await testVault.setThreshold("5000000000000000000000",{from:accounts[4]})
        }catch (err) {
            assert.include(err.message, "not vaultAdmin", "The error message should contain 'not vaultAdmin'");
        }
        
    })

     //test cases for deposit
     it("deposit 10  ${tokens[0]}  to the vault", async () => {
        let token = await ERC20.at(tokens[0])

        await token.approve(testVault.address, convertUtils.to18("10"), {
            from: accounts[0]
        })
        try{
            await testVault.deposit(token.address, convertUtils.to18("10"), {
                from: accounts[0]
            });
        }catch(err){
            assert.include(err.message, "safe inactive", 
            "The error message should contain 'safe inactive'"); 
        }
        
    })

    it("deposit 1 Ether to the vault", async () => {
        assert.equal(0, convertUtils.from18((await testVault.getTokenBalance(ether)).toString()))
        try{
            await testVault.deposit(ether, convertUtils.to18("1"), { value: convertUtils.to18("1"),from: accounts[0]});

        }catch(err){
            assert.include(err.message, "safe inactive", 
            "The error message should contain 'safe inactive'"); 
        }
    })

    it("direct transfer 10 dai", async () => {                  //check
        let token = await ERC20.at(tokens[0])

        assert.equal(0, convertUtils.from18((await testVault.getTokenBalance(token.address)).toString()))
        assert.equal(0, convertUtils.from18((await token.balanceOf(testVault.address)).toString()))
        await token.transfer(testVault.address,convertUtils.to18("10"),{from: accounts[0]});
        assert.equal(0, convertUtils.from18((await testVault.getTokenBalance(token.address)).toString()))
        assert.equal(10, convertUtils.from18((await token.balanceOf(testVault.address)).toString()))
    })

    it("direct transfer 1 ether", async () => {
        assert.equal(0, convertUtils.from18((await testVault.getTokenBalance(ether)).toString()))
        assert.equal(0, convertUtils.from18(( await web3.eth.getBalance(testVault.address)).toString()))
        await web3.eth.sendTransaction({ to: testVault.address, from: accounts[1], value: convertUtils.to18("1") })            
        assert.equal(0, convertUtils.from18((await testVault.getTokenBalance(ether)).toString()))
        assert.equal(1, convertUtils.from18(( await web3.eth.getBalance(testVault.address)).toString()))
    })

    // it("deposit 10 USDC to the vault (asset is not part of vaultAsset)", async () => {
    //     try{
    //         await usdc.approve(testVault.address, convertUtils.to6("100"), {
    //             from: accounts[0]
    //         })
    //         await testVault.deposit(usdc.address, convertUtils.to6("100"), {
    //             from: accounts[0]
    //         });
    //     }catch(err){
    //         assert.include(err.message, "safe inactive", 
    //         "The error message should contain 'safe inactive'"); 
    //     }
    // })


    //test cases for withdraw
        //3082 tokens
        it("withdraw 2 vault tokens in ${tokens[0]}", async () => {
        let token = await ERC20.at(tokens[0])

            let vaultTokenInUserBefore = convertUtils.from18((await testVault.balanceOf(accounts[0])).toString())
            try{
                await testVault.withdraw(token.address,convertUtils.to18("2"), {from:accounts[0],gas:10000000});
            }catch(err){
                assert.include(err.message, "safe inactive", 
                "The error message should contain 'safe inactive'");  
            }
        })

        it("withdraw 10 vault tokens in ${tokens[0]} from user not having vault token", async () => {
        let token = await ERC20.at(tokens[0])

            try{
                await testVault.withdraw(token.address,convertUtils.to18("10"), {from:accounts[1],gas:10000000});
            }catch(err){
               assert.include(err.message, "safe inactive", 
               "The error message should contain 'safe inactive'"); 
            }
        })

        it("withdraw 100 vault tokens in ether", async () => {

            try{
            await testVault.withdraw(ether,convertUtils.to18("100"), {from:accounts[0],gas:10000000});

            }catch(err){
                assert.include(err.message, "safe inactive", 
                "The error message should contain 'safe inactive'"); 
            }

        })

        it("withdraw 1000 vault tokens in ${tokens[3]}, but enough usdt is not present in vault", async () => {
        let token = await ERC20.at(tokens[3])

            try{
                await testVault.withdraw(token.address,convertUtils.to18("1000"), {from:accounts[0],gas:10000000});
            }catch(err){
               assert.include(err.message, "safe inactive", 
               "The error message should contain 'safe inactive'"); 
            }
        })

        //out of gas test cases                                         //check
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

        //TODO isWhitelisted test

        //god based test cases
        it("set yieldster vault by non god", async () => {
            god = await apContract.yieldsterGOD();
            try{
                await testVault.upgradeMasterCopy(yieldsterVaultMasterCopy.address,{from:accounts[3]})
            }catch (err) {
                assert.include(err.message, "unauthorized","The error message should contain 'unauthorized'")
            }
        })

        it("set yieldster vault god", async () => {               
            god = await apContract.yieldsterGOD();
            await testVault.upgradeMasterCopy(yieldsterVaultMasterCopy.address,{from:god})
        })

        it("set APS by non god", async () => {
            god = await apContract.yieldsterGOD();
            try{
                await testVault.setAPS("0x76Eb2FE28b36B3ee97F3Adae0C69606eeDB2A37c",{from:accounts[0]})
            }catch (err) {
                assert.include(err.message, "unauthorized","The error message should contain 'unauthorized'")
            }
        })

        it("set APS by god", async () => {
            god = await apContract.yieldsterGOD();
            await testVault.setAPS("0x76Eb2FE28b36B3ee97F3Adae0C69606eeDB2A37c",{from:god})
            aps = await testVault.APContract()
            assert.equal(aps,"0x76Eb2FE28b36B3ee97F3Adae0C69606eeDB2A37c","error : aps not changed")
            
        })


});

