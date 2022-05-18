const utils = require("./utils/general");
const APContract = artifacts.require("./aps/APContract.sol");
const ProxyFactory = artifacts.require("./proxies/YieldsterVaultProxyFactory.sol");
const YieldsterVault = artifacts.require("./YieldsterVault.sol");
const SafeUtils = artifacts.require("./safeUtils/safeUtils.sol")
const SafeMinter = artifacts.require("./safeUtils/safeMinter.sol")
const USDC = artifacts.require("./dummytokens/dummyUSDC")
const DAI = artifacts.require("./dummytokens/dummyDAI")
const ETH = artifacts.require("./dummytokens/dummyETH")
const USDT = artifacts.require("./dummytokens/dummyUSDT")

function to18(n) {
    return web3.utils.toWei(n, "ether");
}
function from18(n) {
    return web3.utils.fromWei(n, "ether");
}
function to6(n) {
    return web3.utils.toWei(n, "Mwei");
}
function from6(n) {
    return web3.utils.fromWei(n, "Mwei");
}

contract("safeUtils functions", function (accounts) {
    let dai, usdt, ether,weth;
    let proxyFactory, apContract, safeUtils, safeMinter;
    let yieldsterVaultMasterCopy;
    let ethData, usdtData;
    describe("functions", async () => {
        beforeEach(async function () {
            ether = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
            dai = await DAI.deployed()
            usdc = await USDC.deployed()
            usdt = await USDT.deployed()
            weth = await ETH.deployed()

            await dai.mintTokens("30000000000000000000000000000000000000000000000000000");
        await usdc.mintTokens("30000000000000000000000000000000000000000000000000000");
        await usdt.mintTokens("30000000000000000000000000000000000000000000000000000");
        await weth.mintTokens("30000000000000000000000000000000000000000000000000000");


        
            await usdt.transfer(accounts[3], to6("200"))
            await dai.transfer(accounts[1], to18("200"))
            await usdt.transfer(accounts[1], to6("800"))

            apContract = await APContract.deployed();
            yieldsterVaultMasterCopy = await YieldsterVault.deployed()
            proxyFactory = await ProxyFactory.deployed()
            safeUtils = await SafeUtils.deployed()
            safeMinter = await SafeMinter.deployed()

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

            usdtData = web3.eth.abi.encodeFunctionCall({
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
            }, [[usdt.address], [to6("200")], [accounts[3]]])
         })


        // it("Function to test ManagementFeeCleanUp", async () => {
        //     await testVault.setVaultAssets(
        //         [dai.address, ether, weth.address, usdt.address],
        //         [dai.address, ether, weth.address, usdt.address],
        //         [],
        //         [],
        //     );
        //     await testVault.setBeneficiaryAndPercentage(accounts[3],"2000000000000000000")
        //     console.log("benefcry usdt",(await usdt.balanceOf(accounts[3])).toString())
        //     await usdt.approve(testVault.address, to6("400"), { from: accounts[1] })
        //     await testVault.deposit(usdt.address, to6("200"), { from: accounts[1] });
        //     await testVault.deposit(usdt.address, to6("200"), { from: accounts[1] });
        //     console.log("benefcry usdt",(await usdt.balanceOf(accounts[3])).toString())

        //     await testVault.deposit(ether, to18("20"), { value: web3.utils.toWei('20', "ether"), from: accounts[1], gas: 10000000 });

        //     let data = web3.eth.abi.encodeFunctionCall({
        //         name: "managementFeeCleanUp",
        //         type: "function",
        //         inputs: [{
        //             name: "_tokenAddress",
        //             type: "address",
        //         }, {
        //             name: "_type",
        //             type: "uint256",

        //         }
        //         ]
        //     }, [usdt.address,to18("200")])
        //     console.log("data",data)
        //     await safeMinter.mintStrategy(testVault.address, data);
        //     console.log("benefcry usdt",(await usdt.balanceOf(accounts[3])).toString())

        //     assert.equal(
        //         from18(await web3.eth.getBalance(accounts[9])),
        //         105,
        //         "incorrect value"
        //     );
        //     assert.equal(
        //         from6((await usdt.balanceOf(accounts[2])).toString()),
        //         50,
        //         "incorrect value"
        //     );
        // });


        it("Function to test payBackExecutor", async () => {
            await testVault.setVaultAssets(
                [dai.address, ether, weth.address, usdt.address],
                [dai.address, ether, weth.address, usdt.address],
                [],
                [],
            );
            await usdt.approve(testVault.address, to6("200"), { from: accounts[1] })
            await testVault.deposit(usdt.address, to6("200"), { from: accounts[1] });
            await testVault.deposit(ether, to18("20"), { value: web3.utils.toWei('20', "ether"), from: accounts[1], gas: 10000000 });

            let usdtPay = web3.eth.abi.encodeFunctionCall({
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
            }, [[to18("5"), to6("50")], [accounts[9], accounts[2]], [ether, usdt.address]])

            await safeMinter.mintStrategy(testVault.address, usdtPay);
            assert.equal(
                from18(await web3.eth.getBalance(accounts[9])),
                105,
                "incorrect value"
            );
            assert.equal(
                from6((await usdt.balanceOf(accounts[2])).toString()),
                50,
                "incorrect value"
            );
        });



         it("dai token balance updation", async () => {
            await testVault.setVaultAssets(
                [dai.address],
                [dai.address],
                [],
                [],
            );

            await dai.approve(testVault.address, to18("200"), { from: accounts[1] })
            await testVault.deposit(dai.address, to18("200"), { from: accounts[1] });

            assert.equal(
                from18((await testVault.getTokenBalance(dai.address)).toString()),
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
            }, [[dai.address], [to18("3000")]])

            await safeMinter.mintStrategy(testVault.address, tokBal);
            assert.equal(
                from18((await testVault.getTokenBalance(dai.address)).toString()),
                3000,
                "incorrect value"
            );
        });

        it("usdt is unapproved and safe cleanup asset", async () => {
            await testVault.setVaultAssets(
                [dai.address],
                [dai.address],
                [],
                [],
            );
            await apContract.setYieldsterTreasury(accounts[9])

            await dai.approve(testVault.address, to18("200"), { from: accounts[1] })
            await testVault.deposit(dai.address, to18("200"), { from: accounts[1] });
            await usdt.transfer(testVault.address, to6("200"), { from: accounts[3] })

            assert.equal(
                from6((await usdt.balanceOf(accounts[9])).toString()),
                0,
                "incorrect value"
            );
            let encoded = await web3.eth.abi.encodeFunctionCall({ name: "safeCleanUp", type: "function", inputs: [{ name: "cleanUpList", type: "address[]" }] }, [[usdt.address]])
            await safeMinter.mintStrategy(testVault.address, encoded);

            assert.equal(
                from6((await usdt.balanceOf(accounts[9])).toString()),
                200,
                "incorrect value"
            );
        });


        it("case1:usdt is approved", async () => {
            await testVault.setVaultAssets(
                [dai.address, usdt.address],
                [dai.address, usdt.address],
                [],
                [],
            );

            await usdt.approve(testVault.address, to6("200"), { from: accounts[1] })
            await testVault.deposit(usdt.address, to6("200"), { from: accounts[1] });
            await usdt.transfer(testVault.address, to6("200"), { from: accounts[3] })

            assert.equal(
                from6((await testVault.balanceOf(accounts[1])).toString()),
                200,
                "incorrect value"
            );
            assert.equal(
                from6((await testVault.balanceOf(accounts[3])).toString()),
                0,
                "incorrect value"
            );

            await safeMinter.mintStrategy(testVault.address, usdtData);

            assert.equal(
                from6((await testVault.balanceOf(accounts[1])).toString()),
                200,
                "incorrect value"
            );
            assert.equal(
                from6((await testVault.balanceOf(accounts[3])).toString()),
                200,
                "incorrect value"
            );
        });

        it("case2:ether is approved", async () => {
            await testVault.setVaultAssets(
                [dai.address, ether, weth.address],
                [dai.address, ether,weth.address],
                [],
                [],
            );

            await testVault.deposit(ether, to18("2"), { value: web3.utils.toWei('2', "ether"), from: accounts[1], gas: 10000000 });
            await web3.eth.sendTransaction({ to: testVault.address, from: accounts[3], value: web3.utils.toWei('2', "ether"), gas: 1000000000 })

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


        it("case3:Direct transfer token usdt is not approved", async () => {
            await testVault.setVaultAssets(
                [dai.address],
                [dai.address],
                [],
                [],
            );

            await dai.approve(testVault.address, to18("200"), { from: accounts[1] })
            await testVault.deposit(dai.address, to18("200"), { from: accounts[1] });
            await usdt.transfer(testVault.address, to6("200"), { from: accounts[3] })

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

            await safeMinter.mintStrategy(testVault.address, usdtData);

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


        it("case4:Direct transfer token ether is not approved", async () => {

            await testVault.setVaultAssets(
                [dai.address],
                [dai.address],
                [],
                [],
            );

            await dai.approve(testVault.address, to18("200"), { from: accounts[1] })
            await testVault.deposit(dai.address, to18("200"), { from: accounts[1] });
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


    }); //describe
});
