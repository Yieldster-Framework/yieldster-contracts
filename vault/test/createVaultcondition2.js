const utils = require("./utils/general");
const convertUtils = require("./utils/conversion");
const ERC20 = artifacts.require("IERC20")
const APContract = artifacts.require("./aps/APContract.sol");
const ProxyFactory = artifacts.require("./proxies/YieldsterVaultProxyFactory.sol");
const YieldsterVault = artifacts.require("./YieldsterVault.sol");
const Whitelist = artifacts.require("./whitelist/Whitelist.sol");

contract("Yieldster Vault", function (accounts) {

    describe("Should create a vault with emergency condition 2 - emergency exit", async () => {
        let dai, usdc, usdt, crv3;
        let proxyFactory, apContract;
        let yieldsterVaultMasterCopy, testVault,ether;

        beforeEach(async function () {

            dai = await ERC20.at("0x6B175474E89094C44Da98b954EedeAC495271d0F")
            usdc = await ERC20.at("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48")
            usdt = await ERC20.at("0xdac17f958d2ee523a2206206994597c13d831ec7")
            crv3 = await ERC20.at("0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490")
            ether = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"



            apContract = await APContract.deployed();
            yieldsterVaultMasterCopy = await YieldsterVault.deployed()
            proxyFactory = await ProxyFactory.deployed()
            whitelist = await Whitelist.deployed()


        });

        
        it("creates vault and Admin", async () => {
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
            await testVault.setTokenDetails("Test Token", "TT");
            await testVault.registerVaultWithAPS()
            assert.equal(await testVault.vaultAdmin(), accounts[0], "error: vault admin mismatch")
        })

        it("Depositing assets such as dai,usdt", async () => {
            
            await testVault.setVaultAssets(
                [dai.address,usdt.address,crv3.address],
                [dai.address,usdt.address,crv3.address],
                [],
                [],
            );

            await dai.approve(testVault.address, convertUtils.to18("100"), {
                from: accounts[0]
            })
            await testVault.deposit(dai.address, convertUtils.to18("100"), {
                from: accounts[0]
            });
            await usdt.approve(testVault.address, convertUtils.to6("100"), {
                from: accounts[0]
            })
            await testVault.deposit(usdt.address, convertUtils.to6("100"), {
                from: accounts[0]
            });

            assert.equal(convertUtils.from18((await testVault.getTokenBalance(dai.address)).toString()),"100","not equal amount present")
            assert.equal(convertUtils.from6((await testVault.getTokenBalance(usdt.address)).toString()),"100","not equal amount present")

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
                    [usdc.address],
                    [usdc.address],
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
                    [usdc.address],
                    [usdc.address],
                    [usdc.address],
                    [usdc.address],
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
        it("deposit 10 DAI to the vault", async () => {
            await dai.approve(testVault.address, convertUtils.to18("10"), {
                from: accounts[0]
            })
            try{
                await testVault.deposit(dai.address, convertUtils.to18("10"), {
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

        it("direct transfer 10 dai", async () => {                  
            assert.equal(100, convertUtils.from18((await testVault.getTokenBalance(dai.address)).toString()))
            assert.equal(0, convertUtils.from18((await dai.balanceOf(testVault.address)).toString()))
            await dai.transfer(testVault.address,convertUtils.to18("10"),{from: accounts[0]});
            assert.equal(100, convertUtils.from18((await testVault.getTokenBalance(dai.address)).toString()))
            assert.equal(10, convertUtils.from18((await dai.balanceOf(testVault.address)).toString()))
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
                assert.include(err.message, "safe inactive", 
                "The error message should contain 'safe inactive'"); 
            }
        })

        //test cases for withdraw
        //3082 tokens
        it("withdraw 2 vault tokens in dai", async () => {
            let vaultTokenInUserBefore = convertUtils.from18((await testVault.balanceOf(accounts[0])).toString())
            try{
                await testVault.withdraw(dai.address,convertUtils.to18("2"), {from:accounts[0],gas:10000000});
            }catch(err){
                assert.include(err.message, "safe inactive", 
                "The error message should contain 'safe inactive'");  
            }
        })

        it("withdraw 10 vault tokens in dai from user not having vault token", async () => {
            try{
                await testVault.withdraw(dai.address,convertUtils.to18("10"), {from:accounts[1],gas:10000000});
            }catch(err){
               assert.include(err.message, "safe inactive", 
               "The error message should contain 'safe inactive'"); 
            }
        })

        it("withdraw 100 vault tokens in ether", async () => {
            let vaultTokenInUserBefore = convertUtils.from18((await testVault.balanceOf(accounts[0])).toString())

            try{
            await testVault.withdraw(ether,convertUtils.to18("100"), {from:accounts[0],gas:10000000});

            }catch(err){
                assert.include(err.message, "safe inactive", 
                "The error message should contain 'safe inactive'"); 
            }

        })

        it("withdraw 1000 vault tokens in usdt, but enough usdt is not present in vault", async () => {
            try{
                await testVault.withdraw(usdt.address,convertUtils.to18("1000"), {from:accounts[0],gas:10000000});
            }catch(err){
               assert.include(err.message, "safe inactive", 
               "The error message should contain 'safe inactive'"); 
            }
        })

        
        //out of gas test cases                                         //check
        it("enable emergency exit with large number of assets", async () => {
            god = await apContract.yieldsterGOD();
            await apContract.setEmergencyVault(accounts[4]);
            await dai.approve(testVault.address, convertUtils.to18("100"), {
                from: accounts[0]
            })
            try{
                 await testVault.deposit(dai.address, convertUtils.to18("100"), {
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

    })
});