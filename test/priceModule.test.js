
const MockPriceModule = artifacts.require("./mocks/MockPriceModule.sol");
const TokenFactory = artifacts.require("./mocks/TokenFactory.sol");
const ERC20 = artifacts.require("ERC20");
const APContract = artifacts.require("./aps/APContract.sol");
const { deployTokens, mintTokens } = require("./utils/tokenFactoryUtils");

const { BN, expectRevert } = require('@openzeppelin/test-helpers');
function from18(n) {
    return web3.utils.fromWei(n, "ether");
}

contract("Mock PriceModule", function (accounts) {
    let ether = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
    let apContract, tokenFactory, mockPriceModule;
    let token0, token1;
    let tokens = [];
    beforeEach(async function () {
        tokenFactory = await TokenFactory.deployed();
        mockPriceModule = await MockPriceModule.deployed();
        apContract = await APContract.deployed();
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

    it("Should revert when account other than price Module Manager tries to addToken ", async () => {
        await expectRevert(
            mockPriceModule.addToken("0x6B175474E89094C44Da98b954EedeAC495271d0F", "2", { from: accounts[2] }),
            "Not Authorized",
        );
    });

    it("Should assert USD price of tokens[0] ", async () => {
        token0 = await ERC20.at(tokens[0])
        assert.equal(
            (await mockPriceModule.getUSDPrice(token0.address)).toString(),
            new BN("1000000000000000000"),
            "not same as token0"
        );
    });

    it("Should assert USD Price of tokens[1]", async () => {
        token1 = await ERC20.at(tokens[1])
        assert.equal(
            (await mockPriceModule.getUSDPrice(token1.address)).toString(),
            new BN("1100000000000000000"),
            "not same as token1"
        );
    });

    it("Should assert USD price of ether ", async () => {
        assert.equal(
            (await mockPriceModule.getUSDPrice(ether)).toString(),
            new BN("4000000000000000000"),
            "not same as ether"
        );
    });

    it("Should Add token that doest exist and setting its price to tokens[0]", async () => {
        await mockPriceModule.addToken("0x0000000000000000000000000000000000000000", "1")
        assert.equal(
            (await mockPriceModule.getUSDPrice("0x0000000000000000000000000000000000000000")).toString(),
            (await mockPriceModule.getUSDPrice(token0.address)).toString(),
            "not same as token0"
        );
    });

    it("Should add tokens[1] to ether price and then changing back to tokens[1]", async () => {
        let etherPrice = (await mockPriceModule.getUSDPrice(ether)).toString()
        await mockPriceModule.addToken(token1.address, "4")
        assert.equal(
            (await mockPriceModule.getUSDPrice(token1.address)).toString(),
            etherPrice,
            "not same as ether"
        );

        await mockPriceModule.addToken(token1.address, "2")
        assert.notEqual(
            (await mockPriceModule.getUSDPrice(token1.address)).toString(),
            etherPrice,
            "same as ether"
        );
    });
});
