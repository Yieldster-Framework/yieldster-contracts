const { deployProxy } = require("@openzeppelin/truffle-upgrades");
const APContract = artifacts.require("./aps/APContract.sol");
const StockDeposit = artifacts.require("./smartStrategies/deposit/StockDeposit.sol");
const StockWithdraw = artifacts.require("./smartStrategies/deposit/StockWithdraw.sol");
const SafeMinter = artifacts.require("./safeUtils/SafeMinter.sol")
const YieldsterVault = artifacts.require("./YieldsterVault.sol");
const ProxyFactory = artifacts.require("./proxies/YieldsterVaultProxyFactory.sol");
const PriceModule = artifacts.require("./mocks/priceModuleMock.sol");
const Whitelist = artifacts.require("./whitelist/Whitelist.sol");
const SafeUtils = artifacts.require("./safeUtils/safeUtils.sol");
const HexUtils = artifacts.require("./utils/HexUtils.sol");
const ProfitManagementFee = artifacts.require('./delegateContract/ProfitManagementFee.sol')
const ManagementFee = artifacts.require('./delegateContract/ManagementFee.sol');
const SDKFunction = artifacts.require('./SDKFunction.sol')
const ExchangeRegistry = artifacts.require("./exchange/ExchangeRegistry.sol");
const dummyUSDC = artifacts.require('./mocks/dummyUSDC.sol'); 
const dummyDAI = artifacts.require("./mocks/dummyDAI.sol");  
const dummyETH = artifacts.require("./mocks/dummyETH.sol");  
const dummyUSDT = artifacts.require("./mocks/dummyUSDT.sol");  
const dummyFRAX = artifacts.require("./mocks/dummyFRAX.sol");  



const Exchange = artifacts.require("./exchange/Exchange.sol");//
const ManagementFeeStorage = artifacts.require("./delegateContract/storage/ManagementFeeStorage.sol"); //
const ether = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"

module.exports = async (deployer, network, accounts) => {

    

    await deployer.deploy(dummyDAI);
    const dummyDAIInstance = await dummyDAI.deployed();
    console.log("Dummy DAI token deployed at ", dummyDAIInstance.address);

    await deployer.deploy(dummyFRAX);
    const dummyFRAXInstance = await dummyFRAX.deployed();
    console.log("Dummy FRAX token deployed at ", dummyFRAXInstance.address);

    await deployer.deploy(dummyUSDC);
    const dummyUSDCInstance = await dummyUSDC.deployed();
    console.log("Dummy USDC token deployed at ", dummyUSDCInstance.address);

    await deployer.deploy(dummyETH);
    const dummyWETHInstance = await dummyETH.deployed();
    console.log("Dummy ETH token deployed at ", dummyWETHInstance.address);

    await deployer.deploy(dummyUSDT);
    const dummyUSDTInstance = await dummyUSDT.deployed();
    console.log("Dummy USDT token deployed at ", dummyUSDTInstance.address);

    await deployer.deploy(PriceModule);
    const priceModule = await PriceModule.deployed();
    console.log("PriceModule deployed at ", priceModule.address);

    await deployer.deploy(SDKFunction,priceModule.address);
    const sdkFunction = await SDKFunction.deployed();
    console.log("SDK function deployed at ", sdkFunction.address);

    await deployer.deploy(SafeUtils);
    const safeUtils = await SafeUtils.deployed();
    console.log(`safeUtils deployed at ${safeUtils.address}`)

    await deployer.deploy(HexUtils);
    const hexUtils = await HexUtils.deployed();
    console.log(`hexUtils deployed at ${hexUtils.address}`)

    await deployer.deploy(ManagementFeeStorage, "500000000000000000");
    const managementFeeStorage = await ManagementFeeStorage.deployed();

   console.log("management fee storage address ", managementFeeStorage.address);

    await deployer.deploy(ProfitManagementFee);
    const profitManagementFee = await ProfitManagementFee.deployed();
    console.log(`profitManagementFee deployed at ${profitManagementFee.address}`)

    await deployer.deploy(ManagementFee, managementFeeStorage.address);
    const managementFee = await ManagementFee.deployed();
    console.log(`managementFee deployed at ${ManagementFee.address}`)

    await deployer.deploy(Exchange);
    const exchange = await Exchange.deployed();
    console.log(`exchange deployed at ${exchange.address}`)

    await deployer.deploy(ExchangeRegistry);
    const exchangeRegistry = await ExchangeRegistry.deployed();
    console.log(`exchange registry deployed at ${exchangeRegistry.address}`)

    const apContract = await deployProxy(
        APContract,
        [
            accounts[0],
            accounts[0],
            accounts[0],
            accounts[0],
            accounts[0]
        ],
        { deployer }
      );
      console.log("Deployed ap", apContract.address);

      await deployer.deploy(Whitelist,apContract.address);
      const whitelist = await Whitelist.deployed();
      console.log(`whitelist Module deployed at ${whitelist.address}`)

    await deployer.deploy(StockDeposit);
    await deployer.deploy(StockWithdraw);

    const stockDeposit = await StockDeposit.deployed()
    const stockWithdraw = await StockWithdraw.deployed()

    // Adding Stock withdraw and deposit to APContract
    await apContract.setStockDepositWithdraw(
        stockDeposit.address,
        stockWithdraw.address
    );

    await apContract.setInitialValues(
        whitelist.address,//whitelist
        managementFee.address,//platform
        profitManagementFee.address,//profit
        hexUtils.address,//stringutils
        "0x507F9C130d6405Cd001A9073Adef371dD9fA3F72",//yieldsterexchange
        "0x0dAA47FAC1440931A968FA606373Af69EEcd9b83",//exchange registry
        priceModule.address,
        safeUtils.address,//safeUtils
        managementFeeStorage.address
    )
    await apContract.addManager(accounts[0])
    await apContract.addAsset(dummyDAIInstance.address)//DAI
    await apContract.addAsset(dummyUSDCInstance.address)//USDC
    await apContract.addAsset(dummyWETHInstance.address)//weth 
    await apContract.addAsset(dummyUSDTInstance.address)//usdt


    await apContract.addAsset(ether)//eth 
    await apContract.setWETH(dummyWETHInstance.address)
   // await apContract.setYieldsterDAO(accounts[2])
   // console.log("\nSetting Yieldster Treasury")
   // await apContract.setYieldsterTreasury(accounts[2],{from:accounts[2]})

    console.log(`dai = await DAI.at(\"${dummyDAIInstance.address}\")`)
    console.log(`usdc = await USDC.at(\"${dummyUSDCInstance.address}\")`)
    console.log(`weth = await ETH.at(\"${dummyWETHInstance.address}\")`)
    console.log(`usdt = await USDT.at(\"${dummyUSDTInstance.address}\")`)



    await deployer.deploy(SafeMinter, accounts[0])
    const safeMinter = await SafeMinter.deployed()
    await apContract.setSafeMinter(safeMinter.address);

    await deployer.deploy(YieldsterVault)
    const yieldsterVaultMasterCopy = await YieldsterVault.deployed()

    await deployer.deploy(ProxyFactory, yieldsterVaultMasterCopy.address, apContract.address)
    const proxyFactory = await ProxyFactory.deployed();
    await apContract.addProxyFactory(proxyFactory.address);


    console.log("Adding tokens in batches")
    await priceModule.addTokenInBatches(
        [
            dummyDAIInstance.address,//dummy dai
            dummyUSDCInstance.address,//dummy usdc
            dummyWETHInstance.address,//dummy ETH,
            dummyUSDTInstance.address,//dummy usdt
            dummyFRAXInstance.address,//dummy frax
            "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
        ],
        [
            "1",
            "2",
            "3",
            "2",
            "1",
            "3"
        ]
    );

    console.log("\nSetting Yieldster Treasury")
    await apContract.setYieldsterTreasury(accounts[2])

    console.log(`dai = await DAI.at(\"${dummyDAIInstance.address}\")`)
    console.log(`usdc = await USDC.at(\"${dummyUSDCInstance.address}\")`)
    console.log(`weth = await ETH.at(\"${dummyWETHInstance.address}\")`)
    console.log(`usdt = await USDT.at(\"${dummyUSDTInstance.address}\")`)


            
    console.log(`\napContract = await APContract.at(\"${apContract.address}\")`)
    console.log(`yieldsterVaultMasterCopy = await YieldsterVault.at(\"${yieldsterVaultMasterCopy.address}\")`)
    console.log(`proxyFactory = await ProxyFactory.at(\"${proxyFactory.address}\")`)
    console.log(`profitManagementFee = await ProfitManagementFee.at(\"${profitManagementFee.address}\")`)
    console.log(`managementFee = await ManagementFee.at(\"${managementFee.address}\")`)
    console.log(`priceModule = await PriceModule.at(\"${priceModule.address}\")`)
    console.log(`safeMinter = await SafeMinter.at(\"${safeMinter.address}\")`)
    console.log(`safeUtils = await SafeUtils.at(\"${safeUtils.address}\")`)
    console.log(`whitelist =await Whitelist.at(\"${whitelist.address}\")`)




};