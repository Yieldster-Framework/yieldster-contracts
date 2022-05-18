const ExchangeRegistry = artifacts.require("./exchange/ExchangeRegistry.sol");
const { expectRevert } = require('@openzeppelin/test-helpers');
const USDC = artifacts.require('./mocks/dummyUSDC.sol'); 
const DAI = artifacts.require("./mocks/dummyDAI.sol");  
const ETH = artifacts.require("./mocks/dummyETH.sol");  
const USDT = artifacts.require("./mocks/dummyUSDT.sol");  

contract("exchangeRegistry", function (accounts) {
    describe("exchange Regisrty swap functions", async () => {
        let dai, usdc, usdt, weth;
        let exchangeRegistry, DaiUsdcSwapAddress;
        beforeEach(async function () {
            dai = await DAI.deployed()
            usdc = await USDC.deployed()
            weth = await ETH.deployed()
            usdt = await USDT.deployed()
            DaiUsdcSwapAddress = "0xAE461cA67B15dc8dc81CE7615e0320dA1A9aB8D5";
            exchangeRegistry = await ExchangeRegistry.deployed()
        });

        it("Add a swap contract from dai to usdc ", async () => {
            await exchangeRegistry.addOrChangeSwapContract(dai.address, usdc.address, DaiUsdcSwapAddress)
            assert.equal(
                await exchangeRegistry.getSwapContract(dai.address, usdc.address),
                DaiUsdcSwapAddress,
                "not actual contract address"
            );
        });

        it("from token that do not exist ", async () => {
            await expectRevert(
                exchangeRegistry.getSwapContract("0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", usdc.address),
                "No swap contract available!",
            );
        });

        it("To token that do not exist ", async () => {
            await expectRevert(
                exchangeRegistry.getSwapContract(usdc.address, "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"),
                "No swap contract available!",
            );
        });

        it("From and To token that do not exist ", async () => {
            await expectRevert(
                exchangeRegistry.getSwapContract(usdt.address, weth.address),
                "No swap contract available!",
            );
        });

    });
});
