const { deployProxy } = require("@openzeppelin/truffle-upgrades");

const APContract = artifacts.require("APContract");
const ProxyFactory = artifacts.require("./proxies/YieldsterVaultProxyFactory.sol");
const YieldsterVault = artifacts.require("./YieldsterVault.sol");
const Whitelist = artifacts.require("./whitelist/Whitelist.sol")
const SafeUtils = artifacts.require("./safeUtils/SafeUtils.sol");
const SafeMinter = artifacts.require("./safeUtils/safeMinter.sol")
const MockPriceModule = artifacts.require("./mocks/MockPriceModule.sol");
const Factory = artifacts.require("./mocks/TokenFactory.sol");
const ManagementFee = artifacts.require("./delegateContract/ManagementFee.sol");
const ManagementFeeStorage = artifacts.require("./delegateContract/storage/ManagementFeeStorage.sol");
const ProfitManagementFee = artifacts.require("./delegateContract/ProfitManagementFee.sol");
const HexUtils = artifacts.require("./utils/HexUtils.sol");
const Exchange = artifacts.require("./exchange/Exchange.sol");
const ExchangeRegistry = artifacts.require("./exchange/ExchangeRegistry.sol");
const StockDeposit = artifacts.require("./smartStrategies/deposit/StockDeposit.sol");
const StockWithdraw = artifacts.require("./smartStrategies/withdraw/StockWithdraw.sol");
const ether = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"

module.exports = async function (deployer, network, accounts) {
  await deployer.deploy(Factory)
  const apContract = await deployProxy(
    APContract,
    [
      accounts[0],
      accounts[0],
      accounts[0],
      accounts[0],
      accounts[0],
    ],
    { deployer }
  );
  await deployer.deploy(YieldsterVault);
  await deployer.deploy(ManagementFee);
  await deployer.deploy(ProfitManagementFee);
  await deployer.deploy(MockPriceModule)
  await deployer.deploy(Whitelist, apContract.address)
  await deployer.deploy(SafeUtils);
  await deployer.deploy(SafeMinter, accounts[0]);
  await deployer.deploy(HexUtils);
  await deployer.deploy(Exchange);
  await deployer.deploy(ExchangeRegistry);
  await deployer.deploy(ManagementFeeStorage, "500000000000000000");
  await deployer.deploy(StockDeposit);
  await deployer.deploy(StockWithdraw);
  
  const stockWithdraw = await StockWithdraw.deployed();
  const stockDeposit = await StockDeposit.deployed();



  const yieldsterVaultMasterCopy = await YieldsterVault.deployed()
  await deployer.deploy(ProxyFactory, yieldsterVaultMasterCopy.address, apContract.address)

  const whitelist = await Whitelist.deployed();
  const managementFee = await ManagementFee.deployed();
  const profitManagementFee = await ProfitManagementFee.deployed();
  const stringUtils = await HexUtils.deployed();
  const exchange = await Exchange.deployed();
  const exchangeRegistry = await ExchangeRegistry.deployed();
  const priceModule = await MockPriceModule.deployed();
  const safeUtils = await SafeUtils.deployed();
  const safeMinter = await SafeMinter.deployed();

  const managementFeeStorage = await ManagementFeeStorage.deployed();
  const proxyFactory = await ProxyFactory.deployed();
 
  const apsInstance = await APContract.at(apContract.address)
  await apsInstance.setInitialValues(whitelist.address, managementFee.address, profitManagementFee.address, stringUtils.address, exchange.address, exchangeRegistry.address, priceModule.address, safeUtils.address, managementFeeStorage.address)
  await apsInstance.addProxyFactory(proxyFactory.address);
  await apsInstance.setStockDepositWithdraw(stockDeposit.address, stockWithdraw.address)

  // console.log(`APS :- ${apContract.address}`)
  // console.log(`yieldsterVaultMasterCopy :- ${yieldsterVaultMasterCopy.address}`)
  // console.log(`proxyFactory :- ${proxyFactory.address}`)

};

