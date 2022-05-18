const PriceModule = artifacts.require("./mocks/priceModuleMock.sol");
const USDC = artifacts.require('./mocks/dummyUSDC.sol'); 
const DAI = artifacts.require("./mocks/dummyDAI.sol");  
const ETH = artifacts.require("./mocks/dummyETH.sol");  
const USDT = artifacts.require("./mocks/dummyUSDT.sol");
const ether = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"

const {BN, expectRevert } = require('@openzeppelin/test-helpers');
function from18(n) {
    return web3.utils.fromWei(n, "ether");
}

contract("Mock PriceModule", function (accounts) {
    describe("price module functions", async () => {
        let dai, usdc, usdt;
        let priceModule;
        beforeEach(async function () {
            dai = await DAI.deployed()
            usdc = await USDC.deployed()
            weth = await ETH.deployed()
            usdt = await USDT.deployed()
            priceModule = await PriceModule.deployed()
        });

        it("only priceModule manager can add Tokens ", async () => {
            await expectRevert(
                priceModule.addToken("0x6B175474E89094C44Da98b954EedeAC495271d0F", "2", { from: accounts[2] }),
                "Not Authorized",
            );
          

        });

        it("get USD price of DAI ", async () => {
           assert.equal(
                    (await priceModule.getUSDPrice(dai.address)).toString(),
                    new BN("1000000000000000000"),
                    "not same as dai"
                );
        });

        it("get USD price of USDC ", async () => {
           assert.equal(
                    (await priceModule.getUSDPrice(usdc.address)).toString(),
                    new BN("1100000000000000000"),
                    "not same as usdc"
                );
        });

        it("get USD price of ether ", async () => {
           assert.equal(
                    (await priceModule.getUSDPrice(ether)).toString(),
                    new BN("2000000000000000000"),
                    "not same as ether"
                );
        });

        it("Add token that doest exist and setting its price to DAI", async () => {
            await priceModule.addToken("0x0000000000000000000000000000000000000000","1")
            assert.equal(
                (await priceModule.getUSDPrice("0x0000000000000000000000000000000000000000")).toString(),
                (await priceModule.getUSDPrice(dai.address)).toString(),
                "not same as dai"
            );
        });

        it("setting usdt to ether feed address and then changing back to usdt", async () => {
            let etherPrice=(await priceModule.getUSDPrice(ether)).toString()
            await priceModule.addToken(usdt.address, "3")
            assert.equal(
                (await priceModule.getUSDPrice(usdt.address)).toString(),
                etherPrice,
                "not same as ether"
            );

            await priceModule.addToken(usdt.address, "2")
            assert.notEqual(
                (await priceModule.getUSDPrice(usdt.address)).toString(),
                etherPrice,
                "same as ether"
            );
        });
    });
});
