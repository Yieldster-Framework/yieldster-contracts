const utils = require("./utils/general");
const convertUtils = require("./utils/conversion");
const APContract = artifacts.require("./aps/APContract.sol");
const ProxyFactory = artifacts.require("./proxies/YieldsterVaultProxyFactory.sol");
const YieldsterVault = artifacts.require("./YieldsterVault.sol");
const Whitelist = artifacts.require("./whitelist/Whitelist.sol");
const USDC = artifacts.require('./mocks/dummyUSDC.sol'); 
const DAI = artifacts.require("./mocks/dummyDAI.sol");  
const ETH = artifacts.require("./mocks/dummyETH.sol");  
const USDT = artifacts.require("./mocks/dummyUSDT.sol"); 
const SDKFunction = artifacts.require("./SDKFunction.sol")



contract("Yieldster Vault", function (accounts) {

    describe("Should create a vault with emergency condition 0", async () => {
        let dai, usdc, usdt,ether;
        let proxyFactory, apContract,whitelist;
        let yieldsterVaultMasterCopy, testVault,sdkFunction;

        beforeEach(async function () {
           
            ether = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
            dai = await DAI.deployed()
            usdc = await USDC.deployed()
            weth = await ETH.deployed()
            usdt = await USDT.deployed()

            apContract = await APContract.deployed();
            yieldsterVaultMasterCopy = await YieldsterVault.deployed()
            proxyFactory = await ProxyFactory.deployed()
            whitelist = await Whitelist.deployed()
            sdkFunction=await SDKFunction.deployed()
        });

        it("creating a new vault", async () => {
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
        await dai.mintTokens("30000000000000000000000000000000000000000000000000000");
        await usdc.mintTokens("30000000000000000000000000000000000000000000000000000");
        await usdt.mintTokens("30000000000000000000000000000000000000000000000000000");
        await weth.mintTokens("30000000000000000000000000000000000000000000000000000");


        await usdc.approve(testVault.address, "300000000000000000000000000000000000000");
        await usdt.approve(testVault.address, "300000000000000000000000000000000000000");
        await dai.approve(testVault.address, "300000000000000000000000000000000000000");
        await weth.approve(testVault.address,"300000000000000000000000000000000000000");


        await dai.transfer(accounts[5], "10000000000000000000000")

        })

        it("testing vault admin", async () => {
            assert.equal(await testVault.vaultAdmin(), accounts[0], "error: vault admin mismatch")
        })


        it("setting vault token name & symbol", async () => {
            await testVault.setTokenDetails("Test Token", "TT");
            assert.equal(await testVault.name(), "Test Token", "error: token name mismatch")
            assert.equal(await testVault.symbol(), "TT", "error: token symbol mismatch")
        })

        it("register vault with APS", async () => {
            await testVault.registerVaultWithAPS()
            try{
                await testVault.registerVaultWithAPS()
            }catch(err){
                assert.include(err.message, "Vault is already registered", "The error message should contain 'Vault is already registered'");  
            }
        })

        //test cases for assets        
        it("set deposit & withdrawal asset where asset exists", async () => {
            await testVault.setVaultAssets(
                [dai.address, usdc.address, usdt.address, ether],
                [dai.address, usdc.address, usdt.address, ether],
                [],
                [],
            );
            assert.equal(await apContract.isDepositAsset(dai.address, {
                from: testVault.address
            }), true, "Error: DAI not set as deposit asset")
            assert.equal(await apContract.isDepositAsset(ether, {
                from: testVault.address
            }), true, "Error: ETHER not set as deposit asset")
            assert.equal(await apContract.isWithdrawalAsset(dai.address, {
                from: testVault.address
            }), true, "Error: DAI not set as withdrawal asset")
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
                assert.include(err.message, "Asset not supported by Yieldster", 
                "The error message should contain 'Asset not supported by Yieldster'");
            }  
            
        })

        it("set deposit & withdrawal asset enable and disable asset in same call", async () => {
            await testVault.setVaultAssets(
                [usdc.address],
                [usdc.address],
                [usdc.address],
                [usdc.address],
            );
            assert.equal(await apContract.isDepositAsset(usdc.address, {
                from: testVault.address
            }), false, "Error: USDC is set as deposit asset")
            assert.equal(await apContract.isWithdrawalAsset(usdc.address, {
                from: testVault.address
            }), false, "Error: USDC is set as withdrawal asset")
            
        })
 
    //     it("Protocol interaction test (encoded swap function)", async () => {
    //         // const data = web3.eth.abi.encodeFunctionCall({
    //         //     type:"function",
    //         //     name:"swap",
    //         //     inputs:[{
    //         //         type:"uint256",
    //         //         name:"amount0",
    //         //     },{
    //         //         type:"uint256",
    //         //         name:"amount1",
    //         //     },{
    //         //         type:"address",
    //         //         name:"token",
    //         //     },{
    //         //         type:"bytes",
    //         //         name:"instruction"
    //         //     }]
    //         // },[0,convertUtils.to18("4"),testVault.address,"0x"])
    //         const data = web3.eth.abi.encodeFunctionCall(
    //         {
    //           type: "function",
    //           name: "add_liquidity",
    //           inputs: [
    //             {
    //               type: "uint256[4]",
    //               name: "amount0",
    //             },
    //             {
    //               type: "uint256",
    //               name: "amount1",
    //             },
    //           ],
    //         },
    //        [[convertUtils.to18("10"),convertUtils.to6("0"),convertUtils.to6("0"),convertUtils.to18("0")],convertUtils.to18("0")]
    //       );
        
    //       console.log("data ", data);
    //     await cvx.transfer(accounts[1], convertUtils.to18("2000"))
    //     await cvx.approve(testVault.address, convertUtils.to18("2000"), { from: accounts[1] })
    //     await testVault.deposit(cvx.address, convertUtils.to18("2000"), { from: accounts[1] });
    //     assert.equal(2000,convertUtils.from18((await sdkFunction.getTokenBalance(cvx.address,testVault.address)).toString()))
    //     await testVault.toPause()
    //     await sdkFunction.protocolInteraction(testVault.address,"0xA5407eAE9Ba41422680e2e00537571bcC53efBfD",data,[convertUtils.to18("10")],[dai.address],["0xc25a3a3b969415c80451098fa907ec722572917f"])
    //     await testVault.unPause()
    //     assert.equal(1993,convertUtils.from18((await sdkFunction.getTokenBalance(cvx.address,testVault.address)).toString()))
    // })

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
            await testVault.setBeneficiaryAndPercentage(accounts[3],"2000000000000000000")
            assert.equal(accounts[3],await testVault.strategyBeneficiary(),"Wrong beneficiary")
            assert.equal("2000000000000000000",(await testVault.strategyPercentage()).toString(),"Wrong percentage")
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
        it("deposit 10 DAI to the vault", async () => {
            assert.equal(0, convertUtils.from18((await testVault.getTokenBalance(dai.address)).toString()))

            await dai.approve(testVault.address, convertUtils.to18("10"), {
                from: accounts[0]
            })
            await testVault.deposit(dai.address, convertUtils.to18("10"), {
                from: accounts[0]
            });
            assert.equal(10, convertUtils.from18((await dai.balanceOf(testVault.address)).toString()))
        })

        it("deposit 1 Ether to the vault", async () => {
            assert.equal(0, convertUtils.from18((await testVault.getTokenBalance(ether)).toString()))
            await testVault.deposit(ether, convertUtils.to18("1"), { value: convertUtils.to18("1")});
            assert.equal(1, convertUtils.from18((await testVault.getTokenBalance(ether)).toString()))
        })

        it("direct transfer 10 dai", async () => {
            assert.equal(10, convertUtils.from18((await testVault.getTokenBalance(dai.address)).toString()))
            assert.equal(10, convertUtils.from18((await dai.balanceOf(testVault.address)).toString()))
            await dai.transfer(testVault.address,convertUtils.to18("10"),{from: accounts[0]});
            assert.equal(10, convertUtils.from18((await testVault.getTokenBalance(dai.address)).toString()))
            assert.equal(20, convertUtils.from18((await dai.balanceOf(testVault.address)).toString()))
        })

        it("direct transfer 1 ether", async () => {
            assert.equal(1, convertUtils.from18((await testVault.getTokenBalance(ether)).toString()))
            assert.equal(1, convertUtils.from18(( await web3.eth.getBalance(testVault.address)).toString()))
            await web3.eth.sendTransaction({ to: testVault.address, from: accounts[1], value: convertUtils.to18("1") })            
            assert.equal(1, convertUtils.from18((await testVault.getTokenBalance(ether)).toString()))
            assert.equal(2, convertUtils.from18(( await web3.eth.getBalance(testVault.address)).toString()))
        })

        it("deposit 10 USDC to the vault (asset is not part of vaultAsset)", async () => {
            try{
                await usdc.approve(testVault.address, convertUtils.to6("100"), {
                    from: accounts[0]
                })
                await testVault.deposit(usdc.address, convertUtils.to6("100"), {
                    from: accounts[0]
                });
            }catch(err){
                assert.include(err.message, "Not an approved deposit asset", "The error message should contain 'Not an approved deposit asset'");
            }
        })
        
        //  //test cases for withdraw
        // //3082 tokens
        it("withdraw 2 vault tokens in dai", async () => {
           // let vaultTokenInUserBefore = convertUtils.from18((await testVault.balanceOf(accounts[0])).toString())
            await dai.approve(testVault.address, convertUtils.to18("100"), {
                from: accounts[5]
            })
            await testVault.deposit(dai.address, convertUtils.to18("100"), {
                from: accounts[5]
            });
            let vaultTokenInUserBefore = convertUtils.from18((await testVault.balanceOf(accounts[5])).toString())
            await testVault.withdraw(dai.address,convertUtils.to18("2"), {from:accounts[5],gas:10000000});
            let vaultTokenInUserAfter = convertUtils.from18((await testVault.balanceOf(accounts[5])).toString())
            assert.equal(2,vaultTokenInUserBefore-vaultTokenInUserAfter,"incorrect")
        })

        ////////////////////////////////////////////////////////////////////////
        it("withdraw 2 vault tokens in dai", async () => {
            // let vaultTokenInUserBefore = convertUtils.from18((await testVault.balanceOf(accounts[0])).toString())
             await dai.approve(testVault.address, convertUtils.to18("100"), {
                 from: accounts[5]
             })
             await testVault.deposit(dai.address, convertUtils.to18("100"), {
                 from: accounts[5]
             });
             let vaultTokenInUserBefore = convertUtils.from18((await testVault.balanceOf(accounts[5])).toString())
             await testVault.withdraw(dai.address,convertUtils.to18("2"), {from:accounts[5],gas:10000000});
             let vaultTokenInUserAfter = convertUtils.from18((await testVault.balanceOf(accounts[5])).toString())
             assert.equal(2,vaultTokenInUserBefore-vaultTokenInUserAfter,"incorrect")
         })
         ///////////////////////////////////////////////////////////////////////


        
        it("withdraw 10 vault tokens in dai from user not having vault token", async () => {
            try{
                await testVault.withdraw(dai.address,convertUtils.to18("10"), {from:accounts[3],gas:10000000});
            }catch(err){
                assert.include(err.message, "You don't have enough shares", "The error message should contain 'You don't have enough shares'");
            }
        })

        it("withdraw 2 vault tokens in ether", async () => {
            let vaultTokenInUserBefore = convertUtils.from18((await testVault.balanceOf(accounts[0])).toString())
            await testVault.withdraw(ether,convertUtils.to18("2"), {from:accounts[0],gas:1000000000});
            let vaultTokenInUserAfter = convertUtils.from18((await testVault.balanceOf(accounts[0])).toString())
            assert.equal(2,vaultTokenInUserBefore-vaultTokenInUserAfter,"incorrect")
        })

        it("withdraw 1 vault tokens in usdt, but enough usdt is not present in vault", async () => {
             try{    
                await testVault.withdraw(usdt.address,convertUtils.to18("1"), {from:accounts[0],gas:10000000});
            }catch(err){
                assert.include(err.message, "required asset not present in vault", "The error message should contain 'required asset not present in vault'");
            }
        })
        
        
        
        //out of gas test cases
        it("enable emergency exit with large number of assets", async () => {
            god = await apContract.yieldsterGOD();
            assert.equal(god,accounts[0],"account[0] not god")
            await apContract.setEmergencyVault(accounts[4]);
            await dai.approve(testVault.address, convertUtils.to18("100"), {
                from: accounts[0]
            })
            await testVault.deposit(dai.address, convertUtils.to18("100"), {
                from: accounts[0]
            });
            await usdt.approve(testVault.address, convertUtils.to6("1"), {
                from: accounts[0]
            })
            await testVault.deposit(usdt.address, convertUtils.to6("1"), {
                from: accounts[0]
            });
            await testVault.enableEmergencyExit({from:god})
        })

        // //TODO isWhitelisted test
        
        //god based test cases
        it("set yieldster vault by non god", async () => {
            god = await apContract.yieldsterGOD();
            assert.equal(god,accounts[0],"account[0] not god")
            try{
                await testVault.upgradeMasterCopy(yieldsterVaultMasterCopy.address,{from:accounts[3]})
            }catch (err) {
                assert.include(err.message, "unauthorized","The error message should contain 'unauthorized'")
            }
        })
        

        it("set yieldster vault god", async () => {
            god = await apContract.yieldsterGOD();
            assert.equal(god,accounts[0],"account[0] not god")
            await testVault.upgradeMasterCopy(yieldsterVaultMasterCopy.address,{from:god})
        })

        it("set APS by non god", async () => {
            god = await apContract.yieldsterGOD();
            assert.equal(god,accounts[0],"account[0] not god")
            try{
                await testVault.setAPS("0x76Eb2FE28b36B3ee97F3Adae0C69606eeDB2A37c",{from:accounts[3]})
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
    })
});