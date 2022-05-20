const utils = require("./utils/general");
const APContract = artifacts.require("./aps/APContract.sol");
const ProxyFactory = artifacts.require("./proxies/YieldsterVaultProxyFactory.sol");
const YieldsterVault = artifacts.require("./YieldsterVault.sol");
const ProfitManagementFee = artifacts.require('./delegateContract/ProfitManagementFee.sol')
const ManagementFee = artifacts.require('./delegateContract/ManagementFee.sol');
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

contract("Testing various functions of AP contract ", async (accounts) => {
    let manager;
    let frax = "0x853d955aCEf822Db058eb8505911ED77F175b99e";
    let ether = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
    let proxyFactory, apContract, tokenFactory, mockPriceModule, yieldsterVaultMasterCopy, testVault;
    let tokens = [];
    let token0, token1, token5;

    beforeEach(async function () {
        apContract = await APContract.deployed();
        yieldsterVaultMasterCopy = await YieldsterVault.deployed()
        proxyFactory = await ProxyFactory.deployed()
        whitelist = await Whitelist.deployed()
        tokenFactory = await TokenFactory.deployed();
        mockPriceModule = await MockPriceModule.deployed();
        managementFee = await ManagementFee.deployed()
        profitManagementFee = await ProfitManagementFee.deployed()
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
        manager = accounts[9];
        token0 = await ERC20.at(tokens[0])
        token1 = await ERC20.at(tokens[1])
        token5 = await ERC20.at(tokens[5])

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
        await testVault.registerVaultWithAPS()

        await testVault.setVaultAssets(
            [token0.address, token1.address],
            [token0.address, token1.address],
            [token5.address],
            [],
        );
    })
    it("should revert when we try to set up same vault again", async () => {
        await expectRevert(
            testVault.setup(
                apContract.address,
                accounts[0]
            ),
            "Vault is already setup",
        );
    });


    it("Should be able to change manager only through Yieldster DAO", async () => {
        await expectRevert(
            apContract.addManager(accounts[2], { from: accounts[4] }),
            "Only Yieldster DAO is allowed to perform this operation",
        );
    });


    it("Should be able to remove manager only through Yieldster DAO", async () => {
        await expectRevert(
            apContract.removeManager(accounts[0], { from: accounts[4] }),
            "Only Yieldster DAO is allowed to perform this operation",
        );
    });


    it("Should be able to set YieldsterGOD only through yieldsterGOD", async () => {
        await expectRevert(
            apContract.setYieldsterGOD(accounts[5], { from: accounts[4] }),
            "Only Yieldster GOD can perform this operation",
        );
    });


    it("Should be able to set YieldsterDAO only by current YieldsterDAO ", async () => {
        await expectRevert(
            apContract.setYieldsterDAO(accounts[2], { from: accounts[4] }),
            "Only Yieldster DAO can perform this operation",
        );
    });


    it("Should be able to set YieldsterTreasury only through yieldsterDAO ", async () => {
        await expectRevert(
            apContract.setYieldsterTreasury(accounts[0], { from: accounts[4] }),
            "Only Yieldster DAO can perform this operation",
        );
    });


    it("Should be able to disableYieldsterGOD only through current yieldsterGOD", async () => {
        await expectRevert(
            apContract.disableYieldsterGOD({ from: accounts[4] }),
            "Only Yieldster GOD can perform this operation",
        );
    });

    it("Should be able to set YieldsterGOD through existing YieldsterGOD ", async () => {
        await apContract.setYieldsterGOD(accounts[3], { from: accounts[0] })
        assert.equal(
            await apContract.yieldsterGOD(),
            accounts[3],
            "yieldster god has'nt been set"
        );
    });

    it("Should disable YieldsterGOD", async () => {
        await apContract.disableYieldsterGOD({ from: accounts[3] }),
            assert.equal(
                await apContract.yieldsterGOD(),
                "0x0000000000000000000000000000000000000000",
                "yieldster god has'nt been disabled"
            );
    });


    it("Should be able to setEmergencyVault only through Yieldster DAO", async () => {
        await expectRevert(
            apContract.setEmergencyVault(accounts[7], { from: accounts[4] }),
            "Only Yieldster DAO is allowed to perform this operation",
        );
    });

    it("Should set EmergencyVault to accounts[6]", async () => {
        await apContract.setEmergencyVault(accounts[6], { from: accounts[0] })
        assert.equal(
            await apContract.emergencyVault(),
            accounts[6],
            "Emergency vault hasn't been set"
        );
    });


    it("Should be able to set SafeMinter only by existing DAO", async () => {
        await expectRevert(
            apContract.setSafeMinter(accounts[7], { from: accounts[4] }),
            "Only Yieldster DAO is allowed to perform this operation",
        );
    });

    it("Should set SafeMinter to accounts[3]", async () => {
        await apContract.setSafeMinter(accounts[3], { from: accounts[0] })
        assert.equal(
            await apContract.safeMinter(),
            accounts[3],
            "safe minter hasn't been set"
        );
    });


    it("Should be able to set SafeUtils only through Yieldster DAO", async () => {
        await expectRevert(
            apContract.setSafeUtils(accounts[7], { from: accounts[4] }),
            "Only Yieldster DAO is allowed to perform this operation",
        );
    });

    it("Should set safeUtils to accounts[4]", async () => {
        await apContract.setSafeUtils(accounts[4], { from: accounts[0] })
        assert.equal(
            await apContract.safeUtils(),
            accounts[4],
            "safe utils hasn't been set"
        );
    });


    it("Should be able to set StringUtils only through Yieldster DAO", async () => {
        await expectRevert(
            apContract.setStringUtils(accounts[7], { from: accounts[4] }),
            "Only Yieldster DAO is allowed to perform this operation",
        );

    });

    it("Should set StringUtils", async () => {
        await apContract.setStringUtils(accounts[5], { from: accounts[0] })
        assert.equal(
            await apContract.stringUtils(),
            accounts[5],
            "string utils hasn't been set"
        );
    });


    it("Should be able to set WhitelistModule only through Yieldster DAO", async () => {
        await expectRevert(
            apContract.setWhitelistModule(accounts[7], { from: accounts[4] }),
            "Only Yieldster DAO is allowed to perform this operation",
        );
    });

    it("Should set WhitelistModule to accounts[7]", async () => {
        await apContract.setWhitelistModule(accounts[7], { from: accounts[0] })
        assert.equal(
            await apContract.whitelistModule(),
            accounts[7],
            "whitelist module hasn't been set"
        );
    });


    it("Should be able to set ExchangeRegistry only through Yieldster DAO ", async () => {
        await expectRevert(
            apContract.setExchangeRegistry(accounts[7], { from: accounts[4] }),
            "Only Yieldster DAO is allowed to perform this operation",
        );
    });

    it("Should set ExchangeRegistry to accounts[7]", async () => {
        await apContract.setExchangeRegistry(accounts[7], { from: accounts[0] })
        assert.equal(
            await apContract.exchangeRegistry(),
            accounts[7],
            "Exchange Registry hasn't been set"
        );
    });


    it("Should be able to set YieldsterExchange only through Yieldster DAO", async () => {
        await expectRevert(
            apContract.setYieldsterExchange(accounts[7], { from: accounts[4] }),
            "Only Yieldster DAO is allowed to perform this operation",
        );
    });

    it("Should setYieldsterExchange to accounts[7]", async () => {
        await apContract.setYieldsterExchange(accounts[7], { from: accounts[0] })
        assert.equal(
            await apContract.yieldsterExchange(),
            accounts[7],
            "yieldsterExchange hasn't been set"
        );
    });


    it("Should be able to set setVaultSlippage only through vault admin", async () => {
        await expectRevert(
            apContract.setVaultSlippage(5, { from: accounts[5] }),
            "Vault is not present",
        );
    });


    it("Should be able to getVaultSlippage only through vault admin", async () => {
        await expectRevert(
            apContract.getVaultSlippage({ from: accounts[5] }),
            "Vault is not present",
        );
    });


    it("Should be able to change Price Module only through manager", async () => {
        await expectRevert(
            apContract.setPriceModule("0x7dF98189D32aa4e92649dBe5d837126bE4e53d1B", { from: accounts[5] }),
            "Only APS managers allowed to perform this operation!",
        );
    });


    it("Should set Price Module", async () => {
        await apContract.addManager(accounts[9], { from: accounts[0] })
        await apContract.setPriceModule("0x7dF98189D32aa4e92649dBe5d837126bE4e53d1B", { from: manager })
        assert.equal(
            await apContract.priceModule(),
            "0x7dF98189D32aa4e92649dBe5d837126bE4e53d1B",
            "Price module hasn't been set"
        );
    });


    it("Should be able to set ProfitAndPlatformManagementFeeStrategies only through Yieldster DAO", async () => {
        await expectRevert(
            apContract.setProfitAndPlatformManagementFeeStrategies(accounts[2], accounts[3], { from: accounts[5] }),
            "Only Yieldster DAO is allowed to perform this operation",
        );
    });


    it("Should set Profit And Platform ManagementFeeStrategies for vault", async () => {
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


    it("Should setManagementFeeStrategies", async () => {
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


    it("Should removeManagementFeeStrategies", async () => {
        await apContract.removeManagementFeeStrategies(testVault.address, accounts[9])
        let m = await apContract.getVaultManagementFee({ from: testVault.address })
        assert.equal(
            m[2],
            accounts[8],
            "not strategy"
        );
    });

    it("Should check if a token is a vaultAsset", async () => {
        assert.equal(
            await apContract._isVaultAsset(token0.address, { from: testVault.address }),
            true,
            "not Asset"
        );
    });


    it("Should check if a nonVault token is a vaultAsset", async () => {
        assert.equal(
            await apContract._isVaultAsset(token5.address, { from: testVault.address }),
            false,
            "vault Asset"
        );
    });

    it("Should be able to add Asset only by manager", async () => {
        await expectRevert(
            apContract.addAsset(frax, { from: accounts[4] }),
            "Only APS managers allowed to perform this operation!",
        );
    });

    it("Should not add same asset 2 times", async () => {
        await apContract.addAsset(frax)
        await expectRevert(
            apContract.addAsset(frax),
            "Asset already present!",
        );
    });

    it("Should be able to remove Asset only by manager", async () => {
        await expectRevert(
            apContract.removeAsset(frax, { from: accounts[4] }),
            "Only APS managers allowed to perform this operation!",
        );
    });


    it("Should check if a token is depositable asset in the vault", async () => {
        assert.equal(
            await apContract.isDepositAsset(token5.address, { from: testVault.address }),
            false,
            "a depositable Asset"
        );
    });

    it("Should check if a token is withdrawable asset in the vault", async () => {
        assert.equal(
            await apContract.isWithdrawalAsset(token0.address, { from: testVault.address }),
            true,
            "not a withdrawable Asset"
        );
    });

    it("should revert when not called via a vault", async () => {
        await expectRevert(
            apContract.isWithdrawalAsset(token0.address, { from: accounts[0] }),
            "Vault not present",
        );
    });

    it("Should be able to setStockDepositWithdraw only through Yieldster DAO", async () => {
        await expectRevert(
            apContract.setStockDepositWithdraw(accounts[2], accounts[3], { from: accounts[5] }),
            "Only Yieldster DAO is allowed to perform this operation",
        );
    });

    it("Should set StockDeposit and Withdraw", async () => {
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


    it("Should be able to add SmartStrategy only by manager", async () => {
        await expectRevert(
            apContract.addSmartStrategy(accounts[1], accounts[2], accounts[3], { from: accounts[5] }),
            "Only APS managers allowed to perform this operation!",
        );
    });


    it("Should be able to remove SmartStrategy only by manager", async () => {
        await expectRevert(
            apContract.removeSmartStrategy(accounts[2], { from: accounts[5] }),
            "Only APS managers allowed to perform this operation!",
        );
    });


    it("Should not add 2 same stategy", async () => {
        await apContract.addSmartStrategy(accounts[1], accounts[2], accounts[3], { from: accounts[0] });
        await expectRevert(
            apContract.addSmartStrategy(accounts[1], accounts[3], accounts[3], { from: accounts[0] }),
            "Smart Strategy already present!",
        );
    });


    it("Should set VaultSmartStrategy as withdraw or deposit strategy", async () => {
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

})
