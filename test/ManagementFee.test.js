const utils = require("./utils/general");
const convertUtils = require("./utils/conversion");
const APContract = artifacts.require("./aps/APContract.sol");
const ProxyFactory = artifacts.require("./proxies/YieldsterVaultProxyFactory.sol");
const YieldsterVault = artifacts.require("./YieldsterVault.sol");
const Whitelist = artifacts.require("./whitelist/Whitelist.sol");
const TokenFactory = artifacts.require("./mocks/TokenFactory.sol");
const ManagementFeeStorage = artifacts.require("./managementFeeStrategies/storage/ManagementFeeStorage.sol")
const ManagementFeeContract= artifacts.require("./managementFeeStrategies/ManagementFee.sol")

const ERC20 = artifacts.require("ERC20")
const MockPriceModule = artifacts.require("./mocks/MockPriceModule.sol");
const { deployTokens, mintTokens } = require("./utils/tokenFactoryUtils");
const { calculateFee, calculateVaultNAVWithoutManagementFee, getManagementFeesAccruedInYieldsterDAO } = require("./utils/managementFeeUtils")
const Web3 = require("web3");
let web3 = new Web3("ws://localhost:8545");

const BN = web3.utils.BN;

const {
    constants,    // Common constants, like the zero address and largest integers
    expectEvent,  // Assertions for emitted events
    expectRevert, // Assertions for transactions that should fail
} = require('@openzeppelin/test-helpers');
const { assertion } = require("@openzeppelin/test-helpers/src/expectRevert");

contract("Should create a vault, test vault functions and deposit 10 different tokens to it", async (accounts) => {

    let ether =   "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
    let zeroAddr= "0x0000000000000000000000000000000000000000";
    let proxyFactory, apContract, tokenFactory, mockPriceModule, yieldsterVaultMasterCopy, testVault, mStorage, feePercentage, managementFee;
    let tokens = [];
    let tokensDepositedSoFar = [];
    let tokenSet = new Set();
    beforeEach(async function () {
        apContract = await APContract.deployed();
        yieldsterVaultMasterCopy = await YieldsterVault.deployed()
        proxyFactory = await ProxyFactory.deployed()
        whitelist = await Whitelist.deployed()
        tokenFactory = await TokenFactory.deployed();
        mockPriceModule = await MockPriceModule.deployed();
        mStorage = await ManagementFeeStorage.deployed();
        feePercentage = await mStorage.getPlatformFee();
        managementFee = await ManagementFeeContract.deployed();
    });

    it(`Should create 10 unique tokens and mint them to ${accounts[0]}`, async () => {
        tokens = await deployTokens(3, tokenFactory);
        await mintTokens(tokens, accounts[0])
    })

    it("Should add these tokens to priceModule and aps and set yieldsterDAO to accounts 2", async () => {
        await apContract.addAsset(ether)
        await mockPriceModule.addToken(ether, "4")
        let indices = tokens.map((e, i) => i % 3 + 1);
        await mockPriceModule.addTokenInBatches(tokens, indices)
        for (let index = 0; index < tokens.length; index++) {
            let token = tokens[index];
            await apContract.addAsset(token)
        }
        await apContract.setYieldsterDAO(accounts[2])

        await apContract.setProfitAndPlatformManagementFeeStrategies(managementFee.address,zeroAddr,{from:accounts[2]})
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
        await testVault.registerVaultWithAPS()
        await testVault.setVaultAssets(
            [...tokens, ether],
            [...tokens, ether],
            [],
            [],
        );
        // await testVault.setBeneficiaryAndPercentage(accounts[1], "2000000000000000000")
        // await testVault.setThreshold("2000000000000000000")
    })

    
    it(`Should deposit 100 of tokens[0] to the vault and see if fee collected`, async () => {
        let token = await ERC20.at(tokens[0])
        tokenSet.add(token.address);

        await token.approve(testVault.address, convertUtils.to18("100"));
        let tokenPrice = await mockPriceModule.getUSDPrice(token.address)

        let vaultNAV = await testVault.getVaultNAV();
        let blockDifference = 0; //Block difference only saved after first deposit
        let tokenDepositObj = { amount: convertUtils.to18("100"), tokenPrice: tokenPrice.toString() };
        tokensDepositedSoFar.push(tokenDepositObj);
        lastDepositTXNBlock = await web3.eth.getBlockNumber();
        await testVault.deposit(token.address, convertUtils.to18("100"));

        let managementFeesInDAO = await getManagementFeesAccruedInYieldsterDAO(mockPriceModule, testVault, tokenSet, apContract, ERC20)
        assert.isTrue((calculateFee(vaultNAV, blockDifference, feePercentage)).eq(managementFeesInDAO),
            "Expected management fee to be 0 in first case");
        
    })

    it(`Should deposit 100 of tokens[0] to the vault and see if fee collected`, async () => {
        let token = await ERC20.at(tokens[0])
        tokenSet.add(token.address);

        await token.approve(testVault.address, convertUtils.to18("100"));
        let tokenPrice = await mockPriceModule.getUSDPrice(token.address);
        let tokenDepositObj = { amount: convertUtils.to18("100"), tokenPrice: tokenPrice.toString() };
        tokensDepositedSoFar.push(tokenDepositObj);
        let navIfThereWasNoManagementFee = calculateVaultNAVWithoutManagementFee(tokensDepositedSoFar)

        await testVault.deposit(token.address, convertUtils.to18("100"));
        let vaultNAV = new BN((await testVault.getVaultNAV()).toString());
        let managementFeesInDAO = await getManagementFeesAccruedInYieldsterDAO(mockPriceModule, testVault, tokenSet, apContract, ERC20)

        let delta = managementFeesInDAO.sub((navIfThereWasNoManagementFee).sub(vaultNAV))
        let allowedDelta = new BN("100000000000000000")
        assert.isTrue(delta < allowedDelta, "Expected management fee to be collected");
    })

    it(`Should deposit 100 of tokens[0] to the vault and see if fee collected`, async () => {
        let token = await ERC20.at(tokens[0])
        tokenSet.add(token.address);

        await token.approve(testVault.address, convertUtils.to18("100"));
        let tokenPrice = await mockPriceModule.getUSDPrice(token.address)
        let tokenDepositObj = { amount: convertUtils.to18("100"), tokenPrice: tokenPrice.toString() };
        tokensDepositedSoFar.push(tokenDepositObj);
        let navIfThereWasNoManagementFee = calculateVaultNAVWithoutManagementFee(tokensDepositedSoFar)

        await testVault.deposit(token.address, convertUtils.to18("100"));
        let vaultNAV = new BN((await testVault.getVaultNAV()).toString());
        let managementFeesInDAO = await getManagementFeesAccruedInYieldsterDAO(mockPriceModule, testVault, tokenSet, apContract, ERC20)

        let delta = managementFeesInDAO.sub((navIfThereWasNoManagementFee).sub(vaultNAV))
        let allowedDelta = new BN("1000000000000000000")
        assert.isTrue(delta < allowedDelta, "Expected management fee to be collected");
    })

    it(`Should deposit 100 of tokens[0] to the vault and see if fee collected`, async () => {
        let token = await ERC20.at(tokens[0])
        tokenSet.add(token.address);

        await token.approve(testVault.address, convertUtils.to18("100"));
        let tokenPrice = await mockPriceModule.getUSDPrice(token.address)
        let tokenDepositObj = { amount: convertUtils.to18("100"), tokenPrice: tokenPrice.toString() };
        tokensDepositedSoFar.push(tokenDepositObj);
        let navIfThereWasNoManagementFee = calculateVaultNAVWithoutManagementFee(tokensDepositedSoFar)

        await testVault.deposit(token.address, convertUtils.to18("100"));
        let vaultNAV = new BN((await testVault.getVaultNAV()).toString());
        let managementFeesInDAO = await getManagementFeesAccruedInYieldsterDAO(mockPriceModule, testVault, tokenSet, apContract, ERC20)

        let delta = managementFeesInDAO.sub((navIfThereWasNoManagementFee).sub(vaultNAV))
        let allowedDelta = new BN("1000000000000000000")
        assert.isTrue(delta < allowedDelta, "Expected management fee to be collected");
    })

    it(`Should deposit 100 of tokens[0] to the vault and see if fee collected`, async () => {
        let token = await ERC20.at(tokens[0])
        tokenSet.add(token.address);

        await token.approve(testVault.address, convertUtils.to18("100"));
        let tokenPrice = await mockPriceModule.getUSDPrice(token.address)
        let tokenDepositObj = { amount: convertUtils.to18("100"), tokenPrice: tokenPrice.toString() };
        tokensDepositedSoFar.push(tokenDepositObj);
        let navIfThereWasNoManagementFee = calculateVaultNAVWithoutManagementFee(tokensDepositedSoFar)

        await testVault.deposit(token.address, convertUtils.to18("100"));
        let vaultNAV = new BN((await testVault.getVaultNAV()).toString());
        let managementFeesInDAO = await getManagementFeesAccruedInYieldsterDAO(mockPriceModule, testVault, tokenSet, apContract, ERC20)

        let delta = managementFeesInDAO.sub((navIfThereWasNoManagementFee).sub(vaultNAV))
        let allowedDelta = new BN("1000000000000000000")
        assert.isTrue(delta < allowedDelta, "Expected management fee to be collected");
    })

    it(`Should deposit 100 of tokens[1] to the vault and see if fee collected`, async () => {
        let token = await ERC20.at(tokens[1])
        tokenSet.add(token.address);

        await token.approve(testVault.address, convertUtils.to18("100"));
        let tokenPrice = await mockPriceModule.getUSDPrice(token.address)
        let tokenDepositObj = { amount: convertUtils.to18("100"), tokenPrice: tokenPrice.toString() };
        tokensDepositedSoFar.push(tokenDepositObj);
        let navIfThereWasNoManagementFee = calculateVaultNAVWithoutManagementFee(tokensDepositedSoFar)

        await testVault.deposit(token.address, convertUtils.to18("100"));
        let vaultNAV = new BN((await testVault.getVaultNAV()).toString());
        let managementFeesInDAO = await getManagementFeesAccruedInYieldsterDAO(mockPriceModule, testVault, tokenSet, apContract, ERC20)

        let delta = managementFeesInDAO.sub((navIfThereWasNoManagementFee).sub(vaultNAV))
        let allowedDelta = new BN("1000000000000000000")
        assert.isTrue(delta < allowedDelta, "Expected management fee to be collected");
    })

    it(`Should deposit 100 of tokens[1] to the vault and see if fee collected`, async () => {
        let token = await ERC20.at(tokens[1])
        tokenSet.add(token.address);

        await token.approve(testVault.address, convertUtils.to18("100"));
        let tokenPrice = await mockPriceModule.getUSDPrice(token.address)
        let tokenDepositObj = { amount: convertUtils.to18("100"), tokenPrice: tokenPrice.toString() };
        tokensDepositedSoFar.push(tokenDepositObj);
        let navIfThereWasNoManagementFee = calculateVaultNAVWithoutManagementFee(tokensDepositedSoFar)

        await testVault.deposit(token.address, convertUtils.to18("100"));
        let vaultNAV = new BN((await testVault.getVaultNAV()).toString());
        let managementFeesInDAO = await getManagementFeesAccruedInYieldsterDAO(mockPriceModule, testVault, tokenSet, apContract, ERC20)

        let delta = managementFeesInDAO.sub((navIfThereWasNoManagementFee).sub(vaultNAV))
        let allowedDelta = new BN("1000000000000000000")
        assert.isTrue(delta < allowedDelta, "Expected management fee to be collected");
    })


    it(`Should deposit 100 of tokens[1] to the vault and see if fee collected`, async () => {
        let token = await ERC20.at(tokens[1])
        tokenSet.add(token.address);

        await token.approve(testVault.address, convertUtils.to18("100"));
        let tokenPrice = await mockPriceModule.getUSDPrice(token.address)
        let tokenDepositObj = { amount: convertUtils.to18("100"), tokenPrice: tokenPrice.toString() };
        tokensDepositedSoFar.push(tokenDepositObj);
        let navIfThereWasNoManagementFee = calculateVaultNAVWithoutManagementFee(tokensDepositedSoFar)

        await testVault.deposit(token.address, convertUtils.to18("100"));
        let vaultNAV = new BN((await testVault.getVaultNAV()).toString());

        let managementFeesInDAO = await getManagementFeesAccruedInYieldsterDAO(mockPriceModule, testVault, tokenSet, apContract, ERC20)

        let delta = managementFeesInDAO.sub((navIfThereWasNoManagementFee).sub(vaultNAV))
        let allowedDelta = new BN("1000000000000000000")
        assert.isTrue(delta < allowedDelta, "Expected management fee to be collected");
    })

}); 
