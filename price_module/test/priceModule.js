const PriceModule = artifacts.require("./price/PriceModule.sol");
const ERC20 = artifacts.require("IERC20")
const { expectRevert } = require('@openzeppelin/test-helpers');
function from18(n) {
    return web3.utils.fromWei(n, "ether");
}

contract("PriceModule", function (accounts) {
    describe("price module functions", async () => {
        let dai, usdc, usdt, crv3;
        let daiFeed,usdtFeed,etherFeed;
        let priceModule;
        let price;
        beforeEach(async function () {
            dai = await ERC20.at("0x6B175474E89094C44Da98b954EedeAC495271d0F")
            usdc = await ERC20.at("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48")
            usdt = await ERC20.at("0xdac17f958d2ee523a2206206994597c13d831ec7")
            crv3 = await ERC20.at("0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490")
            daiFeed="0xAed0c38402a5d19df6E4c03F4E2DceD6e29c1ee9";
            usdtFeed= "0x3E7d1eAB13ad0104d2750B8863b489D65364e32D";
            etherFeed="0x5f4ec3df9cbd43714fe2740f5e3616155c5b8419";
            priceModule = await PriceModule.deployed()
        });

        it("only priceModule manager can add Tokens ", async () => {
            // await priceModule.addtoken("0x6B175474E89094C44Da98b954EedeAC495271d0F","0xAed0c38402a5d19df6E4c03F4E2DceD6e29c1ee9","1",{from:accounts[2]})
            await expectRevert(
                priceModule.addToken("0x6B175474E89094C44Da98b954EedeAC495271d0F", "0xAed0c38402a5d19df6E4c03F4E2DceD6e29c1ee9", "1", { from: accounts[2] }),
                "Not Authorized",
            );

        });

        it("Add dai and get its USD price ", async () => {
            await priceModule.addToken(dai.address, daiFeed, "1")
            price = (await priceModule.getUSDPrice(dai.address)).toString()
        });

        it("Add token that doest exist and setting its price to DAI", async () => {
            await priceModule.addToken("0x0000000000000000000000000000000000000000", daiFeed, "1")
            assert.equal(
                (await priceModule.getUSDPrice("0x0000000000000000000000000000000000000000")).toString(),
                price,
                "not same as dai"
            );
        });

        it("Eth price to be retrieved", async () => {
            await priceModule.addToken("0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", "0x5f4ec3df9cbd43714fe2740f5e3616155c5b8419", "1")
            let etherprice=(await priceModule.getUSDPrice("0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE")).toString()
            console.log("etherPrice=",from18(etherprice))
           
        });

        it("setting usdt to ether feed address and then changing back to usdt", async () => {
            let etherPrice=(await priceModule.getUSDPrice("0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE")).toString()
            await priceModule.addToken(usdt.address, etherFeed, "1")
            assert.equal(
                (await priceModule.getUSDPrice(usdt.address)).toString(),
                etherPrice,
                "not same as ether"
            );


            await priceModule.addToken(usdt.address, usdtFeed, "1")
            assert.notEqual(
                (await priceModule.getUSDPrice(usdt.address)).toString(),
                etherPrice,
                "not same as usdt"
            );
        });

    });
});
