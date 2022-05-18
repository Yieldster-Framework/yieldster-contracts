const utils = require("./utils/general");
const APContract = artifacts.require("./aps/APContract.sol");
const ProxyFactory = artifacts.require("./proxies/YieldsterVaultProxyFactory.sol");
const YieldsterVault = artifacts.require("./YieldsterVault.sol");
const ProfitManagementFee = artifacts.require('./delegateContract/ProfitManagementFee.sol')
const ManagementFee = artifacts.require('./delegateContract/ManagementFee.sol');
const Whitelist = artifacts.require("./whitelist/Whitelist.sol");

const { expectRevert } = require('@openzeppelin/test-helpers');
const USDC = artifacts.require('./mocks/dummyUSDC.sol'); 
const DAI = artifacts.require("./mocks/dummyDAI.sol");  
const ETH = artifacts.require("./mocks/dummyETH.sol");  
const USDT = artifacts.require("./mocks/dummyUSDT.sol");  
const FRAX = artifacts.require("./mocks/dummyFRAX.sol");  


contract("yieldster 2.0 AP contract", function (accounts) {
    let dai, usdc, frax, weth;
    let proxyFactory, apContract,profitManagementFee,managementFee;
    let yieldsterVaultMasterCopy,whitelist;
    let manager;

    describe("AP Module Functions", async () => {
        it("should create a new vault", async () => {
            //---------------------------------CREATING-TOKENS-OBJECT-------------------------------------------//
            ether = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
            dai = await DAI.deployed()
            usdc = await USDC.deployed()
            weth = await ETH.deployed()
            frax = await FRAX.deployed()
            //-------------------------------------------------------------------------------------------------//
    
                apContract = await APContract.deployed();
                yieldsterVaultMasterCopy = await YieldsterVault.deployed()
                proxyFactory = await ProxyFactory.deployed()
                whitelist = await Whitelist.deployed()
                profitManagementFee = await ProfitManagementFee.deployed()
                managementFee = await ManagementFee.deployed()
                
    
    
                manager = accounts[9];
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
    
    
                await testVault.setTokenDetails("Test Token", "TT");
    
                await testVault.registerVaultWithAPS()
    
                await testVault.setVaultAssets(
                    [dai.address, usdc.address],
                    [dai.address, usdc.address],
                    [weth.address],
                    [],
                );
    
            });


        it("should revert when we try to set up same vault again", async () => {
            await expectRevert(
                testVault.setup(
                    apContract.address,
                    accounts[0]
                ),
                "Vault is already setup",
            );
        });


        it("only Yieldster DAO can change manager", async () => {
            await expectRevert(
                apContract.addManager(accounts[2], { from: accounts[4] }),
                "Only Yieldster DAO is allowed to perform this operation",
            );
        });


        it("only Yieldster DAO can remove manager", async () => {
            await expectRevert(
                apContract.removeManager(accounts[0], { from: accounts[4] }),
                "Only Yieldster DAO is allowed to perform this operation",
            );
        });


        it("only Yieldster GOD can set YieldsterGOD", async () => {
            await expectRevert(
                apContract.setYieldsterGOD(accounts[5], { from: accounts[4] }),
                "Only Yieldster GOD can perform this operation",
            );
        });


        it("only Yieldster DAO can set YieldsterDAO", async () => {
            await expectRevert(
                apContract.setYieldsterDAO(accounts[2], { from: accounts[4] }),
                "Only Yieldster DAO can perform this operation",
            );
        });


        it("only Yieldster DAO can setYieldsterTreasury", async () => {
            await expectRevert(
                apContract.setYieldsterTreasury(accounts[0], { from: accounts[4] }),
                "Only Yieldster DAO can perform this operation",
            );
        });


        it("only Yieldster GOD can disableYieldsterGOD", async () => {
            await expectRevert(
                apContract.disableYieldsterGOD({ from: accounts[4] }),
                "Only Yieldster GOD can perform this operation",
            );
        });

        it("only Yieldster GOD can set YieldsterGOD", async () => {
            await apContract.setYieldsterGOD(accounts[3], { from: accounts[0] })
            assert.equal(
                await apContract.yieldsterGOD(),
                accounts[3],
                "yieldster god has'nt been set"
            );
        });

        it("disable YieldsterGOD", async () => {
            await apContract.disableYieldsterGOD({ from: accounts[3] }),
                assert.equal(
                    await apContract.yieldsterGOD(),
                    "0x0000000000000000000000000000000000000000",
                    "yieldster god has'nt been disabled"
                );
        });


        it("only YieldsterDAO can setEmergencyVault", async () => {
            await expectRevert(
                apContract.setEmergencyVault(accounts[7], { from: accounts[4] }),
                "Only Yieldster DAO is allowed to perform this operation",
            );
        });

        it("setEmergencyVault to accounts[6]", async () => {
            await apContract.setEmergencyVault(accounts[6], { from: accounts[0] })
            assert.equal(
                await apContract.emergencyVault(),
                accounts[6],
                "Emergency vault hasn't been set"
            );
        });


        it("only YieldsterDAO can set SafeMinter", async () => {
            await expectRevert(
                apContract.setSafeMinter(accounts[7], { from: accounts[4] }),
                "Only Yieldster DAO is allowed to perform this operation",
            );
        });

        it("set SafeMinter to accounts[3]", async () => {
            await apContract.setSafeMinter(accounts[3], { from: accounts[0] })
            assert.equal(
                await apContract.safeMinter(),
                accounts[3],
                "safe minter hasn't been set"
            );
        });


        it("only YieldsterDAO can set SafeUtils", async () => {
            await expectRevert(
                apContract.setSafeUtils(accounts[7], { from: accounts[4] }),
                "Only Yieldster DAO is allowed to perform this operation",
            );
        });

        it("set safeUtils to accounts[4]", async () => {
            await apContract.setSafeUtils(accounts[4], { from: accounts[0] })
            assert.equal(
                await apContract.safeUtils(),
                accounts[4],
                "safe utils hasn't been set"
            );
        });


        it("only YieldsterDAO can set StringUtils", async () => {
            await expectRevert(
                apContract.setStringUtils(accounts[7], { from: accounts[4] }),
                "Only Yieldster DAO is allowed to perform this operation",
            );

        });

        it("set StringUtils", async () => {
            await apContract.setStringUtils(accounts[5], { from: accounts[0] })
            assert.equal(
                await apContract.stringUtils(),
                accounts[5],
                "string utils hasn't been set"
            );
        });


        it("only YieldsterDAO can set WhitelistModule", async () => {
            await expectRevert(
                apContract.setWhitelistModule(accounts[7], { from: accounts[4] }),
                "Only Yieldster DAO is allowed to perform this operation",
            );
        });

        it("set WhitelistModule to accounts[7]", async () => {
            await apContract.setWhitelistModule(accounts[7], { from: accounts[0] })
            assert.equal(
                await apContract.whitelistModule(),
                accounts[7],
                "whitelist module hasn't been set"
            );
        });


        it("only YieldsterDAO can setExchangeRegistry", async () => {
            await expectRevert(
                apContract.setExchangeRegistry(accounts[7], { from: accounts[4] }),
                "Only Yieldster DAO is allowed to perform this operation",
            );
        });

        it("set ExchangeRegistry to accounts[7]", async () => {
            await apContract.setExchangeRegistry(accounts[7], { from: accounts[0] })
            assert.equal(
                await apContract.exchangeRegistry(),
                accounts[7],
                "Exchange Registry hasn't been set"
            );
        });


        it("only YieldsterDAO can setYieldsterExchange", async () => {
            await expectRevert(
                apContract.setYieldsterExchange(accounts[7], { from: accounts[4] }),
                "Only Yieldster DAO is allowed to perform this operation",
            );
        });

        it("setYieldsterExchange to accounts[7]", async () => {
            await apContract.setYieldsterExchange(accounts[7], { from: accounts[0] })
            assert.equal(
                await apContract.yieldsterExchange(),
                accounts[7],
                "yieldsterExchange hasn't been set"
            );
        });


        it("only vaultAdmin can setVaultSlippage", async () => {
            await expectRevert(
                apContract.setVaultSlippage(5, { from: accounts[5] }),
                "Vault is not present",
            );
        });


        it("only vaultAdmin can getVaultSlippage", async () => {
            await expectRevert(
                apContract.getVaultSlippage({ from: accounts[5] }),
                "Vault is not present",
            );
        });


        it("only Manager can change Price Module", async () => {
            await expectRevert(
                apContract.setPriceModule("0x7dF98189D32aa4e92649dBe5d837126bE4e53d1B", { from: accounts[5] }),
                "Only APS managers allowed to perform this operation!",
            );
        });


        it("set Price Module", async () => {
            await apContract.addManager(accounts[9], { from: accounts[0] })
            await apContract.setPriceModule("0x7dF98189D32aa4e92649dBe5d837126bE4e53d1B", { from: manager })
            assert.equal(
                await apContract.priceModule(),
                "0x7dF98189D32aa4e92649dBe5d837126bE4e53d1B",
                "Price module hasn't been set"
            );
        });


        it("only yieldsterDAO can setProfitAndPlatformManagementFeeStrategies", async () => {
            await expectRevert(
                apContract.setProfitAndPlatformManagementFeeStrategies(accounts[2], accounts[3], { from: accounts[5] }),
                "Only Yieldster DAO is allowed to perform this operation",
            );
        });


        it("set Profit And Platform ManagementFeeStrategies for vault", async () => {
            await apContract.setProfitAndPlatformManagementFeeStrategies(accounts[2], accounts[3], { from: accounts[0] })
            assert.equal(
                await apContract.profitManagementFee(),
                accounts[3],
                "profit management fee not set"
            );
            assert.equal(
                await apContract.platFormManagementFee(),
                accounts[2],
                "platform management not set"
            );
        });


        it("setManagementFeeStrategies", async () => {
            await apContract.addManagementFeeStrategies(testVault.address, accounts[9], { from: accounts[0] })
            await apContract.addManagementFeeStrategies(testVault.address, accounts[8], { from: accounts[0] })

            let m = await apContract.getVaultManagementFee({ from: testVault.address })
            assert.equal(
                m[0],
                managementFee.address,
                "not strategy"
            );
            assert.equal(
                m[1],
                profitManagementFee.address,
                "not strategy"
            );

            assert.equal(
                m[2],
                accounts[9],
                "not strategy"
            );

            assert.equal(
                m[3],
                accounts[8],
                "not strategy"
            );
        });


        it("removeManagementFeeStrategies", async () => {
            await apContract.removeManagementFeeStrategies(testVault.address, accounts[9])
            let m = await apContract.getVaultManagementFee({ from: testVault.address })
            assert.equal(
                m[2],
                accounts[8],
                "not strategy"
            );
        });

        it("checking if a token is a vaultAsset", async () => {
            assert.equal(
                await apContract._isVaultAsset(dai.address, { from: testVault.address }),
                true,
                "not Asset"
            );
        });


        it("checking if a nonVault token is a vaultAsset", async () => {
            assert.equal(
                await apContract._isVaultAsset(weth.address, { from: testVault.address }),
                false,
                "vault Asset"
            );
        });

        it("Only manager can add Asset", async () => {
            await expectRevert(
                apContract.addAsset(frax.address, { from: accounts[4] }),
                "Only APS managers allowed to perform this operation!",
            );
        });

        it("cannot add same asset 2 times", async () => {
            await apContract.addAsset(frax.address)
            await expectRevert(
                apContract.addAsset(frax.address),
                "Asset already present!",
            );
        });

        it("Only manager can remove Asset", async () => {
            await expectRevert(
                apContract.removeAsset(frax.address, { from: accounts[4] }),
                "Only APS managers allowed to perform this operation!",
            );
        });


        it("checking if a token is depositable asset in the vault", async () => {
            assert.equal(
                await apContract.isDepositAsset(weth.address, { from: testVault.address }),
                false,
                "a depositable Asset"
            );
        });

        it("checking if a token is withdrawable asset in the vault", async () => {
            assert.equal(
                await apContract.isWithdrawalAsset(dai.address, { from: testVault.address }),
                true,
                "not a withdrawable Asset"
            );
        });

        it("function should revert when not called via a vault", async () => {
            await expectRevert(
                apContract.isWithdrawalAsset(dai.address, { from: accounts[0] }),
                "Vault not present",
            );
        });

        it("only yieldsterDAO can setStockDepositWithdraw", async () => {
            await expectRevert(
                apContract.setStockDepositWithdraw(accounts[2], accounts[3], { from: accounts[5] }),
                "Only Yieldster DAO is allowed to perform this operation",
            );
        });

        it("setting StockDeposit and Withdraw", async () => {
            await apContract.setStockDepositWithdraw(accounts[2], accounts[3], { from: accounts[0] })
            assert.equal(
                await apContract.stockDeposit(),
                accounts[2],
                "Not Actual stockDeposit"
            );
            assert.equal(
                await apContract.stockWithdraw(),
                accounts[3],
                "Not Actual stockWithdraw"
            );
        });


        it("only Manager can addSmartStrategy", async () => {
            await expectRevert(
                apContract.addSmartStrategy(accounts[1], accounts[2], accounts[3], { from: accounts[5] }),
                "Only APS managers allowed to perform this operation!",
            );
        });


        it("only Manager can remove SmartStrategy", async () => {
            await expectRevert(
                apContract.removeSmartStrategy(accounts[2], { from: accounts[5] }),
                "Only APS managers allowed to perform this operation!",
            );
        });


        it("cannot add 2 same stategy", async () => {
            await apContract.addSmartStrategy(accounts[1], accounts[2], accounts[3], { from: accounts[0] });
            await expectRevert(
                apContract.addSmartStrategy(accounts[1], accounts[3], accounts[3], { from: accounts[0] }),
                "Smart Strategy already present!",
            );
        });


        it("set VaultSmartStrategy as withdraw or deposit strategy", async () => {
            await apContract.addSmartStrategy(accounts[2], accounts[2], accounts[3], { from: accounts[0] });
            await apContract.addSmartStrategy(accounts[5], accounts[6], accounts[7], { from: accounts[0] });

            await testVault.setVaultSmartStrategy(accounts[2], 1, { from: accounts[0] });
            assert.equal(
                await apContract.getDepositStrategy({ from: testVault.address }),
                accounts[2],
                "incorrect deposit strategy address"
            );

            await testVault.setVaultSmartStrategy(accounts[5], 2, { from: accounts[0] });
            assert.equal(
                await apContract.getWithdrawStrategy({ from: testVault.address }),
                accounts[5],
                "incorrect withdraw strategy address"
            );
        });

    });
});