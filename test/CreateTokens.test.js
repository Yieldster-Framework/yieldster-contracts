const utils = require("./utils/general");
const convertUtils = require("./utils/conversion");
const {deployTokens,mintTokens} = require("./utils/tokenFactoryUtils");
const TokenFactory = artifacts.require("./mocks/TokenFactory.sol");
const ERC20 = artifacts.require("ERC20")
const APContract = artifacts.require("./aps/APContract.sol");
const MockPriceModule = artifacts.require("./mocks/MockPriceModule.sol");

contract("Token Factory", function (accounts) {

    describe("Should deploy 10 tokens", async () => {
        let proxyFactory, apContract,tokenFactory,mockPriceModule;
        let tokens = [];
        beforeEach(async function () {
            tokenFactory = await TokenFactory.deployed();
            apContract = await APContract.deployed();
            mockPriceModule = await MockPriceModule.deployed();
        });
        it("Should create 100 tokens", async () => {
            tokens = await deployTokens(100, tokenFactory);
            await mintTokens(tokens,accounts[0])
        })
        it("Should add these tokens to priceModule", async () =>{
            let indices = tokens.map((e,i)=>i%3+1);
            await mockPriceModule.addTokenInBatches(tokens,indices)

            for (let index = 0; index < tokens.length; index++) {
                let token =  tokens[index];
                let price = await mockPriceModule.getUSDPrice(token);
                console.log(token,"===>",price.toString());                
            }
        })
        it("Deploying APContract",async() =>{
            console.log("aps0=>>>",apContract.address)

        })
    })
});