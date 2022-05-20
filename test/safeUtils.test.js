const utils = require("./utils/general");
const APContract = artifacts.require("./aps/APContract.sol");
const ProxyFactory = artifacts.require("./proxies/YieldsterVaultProxyFactory.sol");
const YieldsterVault = artifacts.require("./YieldsterVault.sol");
const SafeUtils = artifacts.require("./safeUtils/safeUtils.sol")
const SafeMinter = artifacts.require("./safeUtils/safeMinter.sol")
const TokenFactory = artifacts.require("./mocks/TokenFactory.sol");
const MockPriceModule = artifacts.require("./mocks/MockPriceModule.sol");
const { deployTokens, mintTokens } = require("./utils/tokenFactoryUtils");
const ERC20 = artifacts.require("ERC20");

function to18(n) {
    return web3.utils.toWei(n, "ether");
}
function from18(n) {
    return web3.utils.fromWei(n, "ether");
}

contract("Should create Vault and test various safeUtils functions", async (accounts) => {

    let ethData, token2Data;
    let ether = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
    let proxyFactory, apContract, yieldsterVaultMasterCopy, testVault, safeMinter;
    let tokens = [];
    let mockPriceModule, tokenFactory, token1, token2;
    beforeEach(async function () {
        apContract = await APContract.deployed();
        yieldsterVaultMasterCopy = await YieldsterVault.deployed()
        proxyFactory = await ProxyFactory.deployed()
        safeUtils = await SafeUtils.deployed()
        safeMinter = await SafeMinter.deployed()
        tokenFactory = await TokenFactory.deployed();
        mockPriceModule = await MockPriceModule.deployed();

        testVaultData = await yieldsterVaultMasterCopy.contract.methods
            .setup(
                apContract.address,
                accounts[0],
            )
            .encodeABI();

        testVault = await utils.getParamFromTxEvent(
            await proxyFactory.createProxy(testVaultData),
            "ProxyCreation",
            "proxy",
            proxyFactory.address,
            YieldsterVault,
            "create Yieldster Vault"
        );
        await testVault.registerVaultWithAPS();

        ethData = web3.eth.abi.encodeFunctionCall({
            name: "approvedAssetCleanUp",
            type: "function",
            inputs: [{
                name: "_assetList",
                type: "address[]",
            }, {
                name: "_amount",
                type: "uint256[]",
            }, {
                name: "reciever",
                type: "address[]",
            },
            ]
        }, [[ether], [web3.utils.toWei('2', "ether")], [accounts[3]]])
    })

    it(`Should create 10 unique tokens and mint them to ${accounts[0]}`, async () => {
        tokens = await deployTokens(10, tokenFactory);
        await mintTokens(tokens, accounts[0])
    })

    it("Should add these tokens to priceModule and aps", async () => {
        await mockPriceModule.addToken(ether, "4")
        await apContract.addAsset(ether)

        let indices = tokens.map((e, i) => i % 3 + 1);
        await mockPriceModule.addTokenInBatches(tokens, indices)
        for (let index = 0; index < tokens.length; index++) {
            let token = tokens[index];
            await apContract.addAsset(token)
        }
        await apContract.setWETH(tokens[0])

    })

    it("Should transfer tokens[1] and tokens[2] to accounts[1] and accounts[3] respectively", async () => {
        token1 = await ERC20.at(tokens[1])
        token2 = await ERC20.at(tokens[2])

        await token2.transfer(accounts[3], to18("2000"))
        await token2.transfer(accounts[1], to18("8000"))
        await token1.transfer(accounts[1], to18("2000"))
    })


    it("should encode token2Data and ethData", async () => {
        token2Data = web3.eth.abi.encodeFunctionCall({
            name: "approvedAssetCleanUp",
            type: "function",
            inputs: [{
                name: "_assetList",
                type: "address[]",
            }, {
                name: "_amount",
                type: "uint256[]",

            }, {
                name: "reciever",
                type: "address[]",
            },
            ]
        }, [[token2.address], [to18("200")], [accounts[3]]])

    })

    it("Should set Safe Minter", async () => {
        await apContract.setSafeMinter(safeMinter.address);
        assert.equal(await apContract.safeMinter(), safeMinter.address, "error: safe minter address mismatch")
    })

    it("Should transfer encoded tokens to beneficiary via paybackExecutor function)", async () => {
        await testVault.setVaultAssets(
            [token1.address, ether, token2.address],
            [token1.address, ether, token2.address],
            [],
            [],
        );
        await token2.approve(testVault.address, to18("200"), { from: accounts[1] })
        await testVault.deposit(token2.address, to18("200"), { from: accounts[1] });
        await testVault.deposit(ether, to18("20"), { value: web3.utils.toWei('20', "ether"), from: accounts[1], gas: 10000000 });

        let token2Pay = web3.eth.abi.encodeFunctionCall({
            name: "paybackExecutor",
            type: "function",
            inputs: [{
                name: "gasCost",
                type: "uint256[]",
            }, {
                name: "beneficiary",
                type: "address[]",

            }, {
                name: "gasToken",
                type: "address[]",
            },
            ]
        }, [[to18("5"), to18("50")], [accounts[9], accounts[2]], [ether, token2.address]])

        await safeMinter.mintStrategy(testVault.address, token2Pay, { from: accounts[0] });

        assert.equal(
            from18(await web3.eth.getBalance(accounts[9])),
            105,
            "incorrect value"
        );
        assert.equal(
            from18((await token2.balanceOf(accounts[2])).toString()),
            50,
            "incorrect value"
        );
    });

    it("Should update balance of token1 via tokenBalanceUpdation function)", async () => {
        await testVault.setVaultAssets(
            [token1.address],
            [token1.address],
            [],
            [],
        );

        await token1.approve(testVault.address, to18("200"), { from: accounts[1] })
        await testVault.deposit(token1.address, to18("200"), { from: accounts[1] });

        assert.equal(
            from18((await testVault.getTokenBalance(token1.address)).toString()),
            200,
            "incorrect value"
        );

        let tokBal = web3.eth.abi.encodeFunctionCall({
            name: "tokenBalanceUpdation",
            type: "function",
            inputs: [{
                name: "_assetList",
                type: "address[]",
            }, {
                name: "_amount",
                type: "uint256[]",
            },
            ]
        }, [[token1.address], [to18("3000")]])

        await safeMinter.mintStrategy(testVault.address, tokBal);
        assert.equal(
            from18((await testVault.getTokenBalance(token1.address)).toString()),
            3000,
            "incorrect value"
        );
    });

    it("Should transfer unsupported tokens to yieldster treasury via safeCleanUp", async () => {
        await testVault.setVaultAssets(
            [token1.address],
            [token1.address],
            [],
            [],
        );
        await apContract.setYieldsterTreasury(accounts[9])
        await token1.approve(testVault.address, to18("200"), { from: accounts[1] })
        await testVault.deposit(token1.address, to18("200"), { from: accounts[1] });
        await token2.transfer(testVault.address, to18("200"), { from: accounts[3] })

        assert.equal(
            from18((await token2.balanceOf(accounts[9])).toString()),
            0,
            "incorrect value"
        );
        let encoded = await web3.eth.abi.encodeFunctionCall({ name: "safeCleanUp", type: "function", inputs: [{ name: "cleanUpList", type: "address[]" }] }, [[token2.address]])
        await safeMinter.mintStrategy(testVault.address, encoded);

        assert.equal(
            from18((await token2.balanceOf(accounts[9])).toString()),
            200,
            "incorrect value"
        );
    });


    it("Should mint vault tokens to account when an approved vault asset is directly transfered by them", async () => {
        await testVault.setVaultAssets(
            [token1.address, token2.address],
            [token1.address, token2.address],
            [],
            [],
        );

        await token2.approve(testVault.address, to18("200"), { from: accounts[1] })
        await testVault.deposit(token2.address, to18("200"), { from: accounts[1] });
        await token2.transfer(testVault.address, to18("200"), { from: accounts[3] })

        assert.equal(
            from18((await testVault.balanceOf(accounts[1])).toString()),
            200,
            "incorrect value"
        );
        assert.equal(
            from18((await testVault.balanceOf(accounts[3])).toString()),
            0,
            "incorrect value"
        );

        await safeMinter.mintStrategy(testVault.address, token2Data);

        assert.equal(
            from18((await testVault.balanceOf(accounts[1])).toString()),
            200,
            "incorrect value"
        );
        assert.equal(
            from18((await testVault.balanceOf(accounts[3])).toString()),
            200,
            "incorrect value"
        );
    });

    it("Should mint vault tokens to account when an approved vault asset(ether) is directly transfered by them", async () => {
        await testVault.setVaultAssets(
            [token1.address, ether],
            [token1.address, ether],
            [],
            [],
        );
        await testVault.deposit(ether, to18("2"), { value: web3.utils.toWei('2', "ether"), from: accounts[1], gas: 10000000 });
        await web3.eth.sendTransaction({ to: testVault.address, from: accounts[7], value: web3.utils.toWei('2', "ether"), gas: 10000000 })

        assert.equal(
            from18((await testVault.balanceOf(accounts[1])).toString()),
            2,
            "incorrect value"
        );
        assert.equal(
            from18((await testVault.balanceOf(accounts[3])).toString()),
            0,
            "incorrect value"
        );

        await safeMinter.mintStrategy(testVault.address, ethData);
        assert.equal(
            from18((await testVault.balanceOf(accounts[1])).toString()),
            2,
            "incorrect value"
        );
        assert.equal(
            from18((await testVault.balanceOf(accounts[3])).toString()),
            2,
            "incorrect value"
        );
    });


    it("Should not mint vault tokens to account when an unapproved vault asset is directly transfered by them", async () => {
        await testVault.setVaultAssets(
            [token1.address],
            [token1.address],
            [],
            [],
        );
        await token1.approve(testVault.address, to18("200"), { from: accounts[1] })
        await testVault.deposit(token1.address, to18("200"), { from: accounts[1] });
        await token2.transfer(testVault.address, to18("200"), { from: accounts[3] })
        assert.equal(
            from18((await testVault.balanceOf(accounts[1])).toString()),
            200,
            "incorrect value"
        );
        assert.equal(
            from18((await testVault.balanceOf(accounts[3])).toString()),
            0,
            "incorrect value"
        );
        await safeMinter.mintStrategy(testVault.address, token2Data);
        assert.equal(
            from18((await testVault.balanceOf(accounts[1])).toString()),
            200,
            "incorrect value"
        );
        assert.equal(
            from18((await testVault.balanceOf(accounts[3])).toString()),
            0,
            "incorrect value"
        );
    });


    it("Should not mint vault tokens to account when an unapproved vault asset(ether) is directly transfered by them", async () => {
        await testVault.setVaultAssets(
            [token1.address],
            [token1.address],
            [],
            [],
        );

        await token1.approve(testVault.address, to18("200"), { from: accounts[1] })
        await testVault.deposit(token1.address, to18("200"), { from: accounts[1] });
        await web3.eth.sendTransaction({ to: testVault.address, from: accounts[3], value: web3.utils.toWei('2', "ether"), gas: 1000000000 })
        assert.equal(
            from18((await testVault.balanceOf(accounts[1])).toString()),
            200,
            "incorrect value"
        );
        assert.equal(
            from18((await testVault.balanceOf(accounts[3])).toString()),
            0,
            "incorrect value"
        );
        await safeMinter.mintStrategy(testVault.address, ethData);
        assert.equal(
            from18((await testVault.balanceOf(accounts[1])).toString()),
            200,
            "incorrect value"
        );
        assert.equal(
            from18((await testVault.balanceOf(accounts[3])).toString()),
            0,
            "incorrect value"
        );
    });
});
