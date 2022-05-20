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


const ExchangeRegistry = artifacts.require("./exchange/ExchangeRegistry.sol");

contract("testing functions of exchangeRegistry contract", function (accounts) {

    let token0, token1, token4, token5;
    let exchangeRegistry, token0token1SwapAddress;
    let tokenFactory, mockPriceModule;
    let tokens = [];
    beforeEach(async function () {

        token0token1SwapAddress = "0xAE461cA67B15dc8dc81CE7615e0320dA1A9aB8D5";
        exchangeRegistry = await ExchangeRegistry.deployed()
        tokenFactory = await TokenFactory.deployed();
        mockPriceModule = await MockPriceModule.deployed();
    });
    it(`Should create 10 unique tokens and mint them to ${accounts[0]}`, async () => {
        tokens = await deployTokens(10, tokenFactory);
        await mintTokens(tokens, accounts[0])
    })


    it("Should add a swap contract from token0 to token1 ", async () => {
        token0 = await ERC20.at(tokens[0])
        token1 = await ERC20.at(tokens[1])
        token4 = await ERC20.at(tokens[4])
        token5 = await ERC20.at(tokens[5])

        await exchangeRegistry.addOrChangeSwapContract(token0.address, token1.address, token0token1SwapAddress)
        assert.equal(
            await exchangeRegistry.getSwapContract(token0.address, token1.address),
            token0token1SwapAddress,
            "not actual contract address"
        );
    });

    it("Should not return a swapcontract for a from token that do not exist ", async () => {
        await expectRevert(
            exchangeRegistry.getSwapContract("0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", token1.address),
            "No swap contract available!",
        );
    });

    it("Should not return a swapcontract for a to token that do not exist ", async () => {
        await expectRevert(
            exchangeRegistry.getSwapContract(token1.address, "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"),
            "No swap contract available!",
        );
    });

    it("Should not return a swapcontract for From and To token that do not exist ", async () => {
        await expectRevert(
            exchangeRegistry.getSwapContract(token4.address, token5.address),
            "No swap contract available!",
        );
    });

});
