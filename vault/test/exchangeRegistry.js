const ExchangeRegistry = artifacts.require("./exchange/ExchangeRegistry.sol");
const ERC20 = artifacts.require("IERC20")
const { expectRevert } = require('@openzeppelin/test-helpers');

contract("exchangeRegistry", function (accounts) {
    describe("exchange Regisrty swap functions", async () => {
        let dai, usdc, usdt, crv3;
        let exchangeRegistry, DaiUsdcSwapAddress;
        beforeEach(async function () {
            dai = await ERC20.at("0x6B175474E89094C44Da98b954EedeAC495271d0F")
            usdc = await ERC20.at("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48")
            usdt = await ERC20.at("0xdac17f958d2ee523a2206206994597c13d831ec7")
            crv3 = await ERC20.at("0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490")
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
                exchangeRegistry.getSwapContract(usdt.address, crv3.address),
                "No swap contract available!",
            );
        });

    });
});
