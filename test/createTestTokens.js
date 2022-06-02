const utils = require("./utils/general");
const convertUtils = require("./utils/conversion");
const APContract = artifacts.require("./aps/APContract.sol");
const ProxyFactory = artifacts.require("./proxies/YieldsterVaultProxyFactory.sol");
const YieldsterVault = artifacts.require("./YieldsterVault.sol");
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

contract("Should create a vault, test vault functions and deposit 10 different tokens to it", async (accounts) => {

    let ether = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
    let apContract, tokenFactory, mockPriceModule;
    let tokens = [];

    beforeEach(async function () {
        apContract = await APContract.at("0xc557fe59E348e1A837FBd7d14225e749CEB33Fa3");
        tokenFactory = await TokenFactory.at("0x269C25eb40614C700421F7C94b768b50191afBF8");
        mockPriceModule = await MockPriceModule.at("0x9ea852a78EE2184B172aAB93579273eFC89AcFe2");
    });

    it(`Should create 10 unique tokens and mint them to ${accounts[0]}`, async () => {
        tokens = await deployTokens(3, tokenFactory);
        await mintTokens(tokens, accounts[0])
    })

    it("Should add these tokens to priceModule and aps", async () => {
        console.log(tokens)
        let indices = tokens.map((e, i) => i % 3 + 1);

        await mockPriceModule.addTokenInBatches(tokens, indices)
        for (let index = 0; index < tokens.length; index++) {
            let token = tokens[index];
            await apContract.addAsset(token)
        }
        await apContract.setWETH(tokens[0])

    })

});
