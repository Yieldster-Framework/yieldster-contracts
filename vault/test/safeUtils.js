const utils = require("./utils/general");
const ERC20 = artifacts.require("IERC20")
const APContract = artifacts.require("./aps/APContract.sol");
const ProxyFactory = artifacts.require("./proxies/YieldsterVaultProxyFactory.sol");
const YieldsterVault = artifacts.require("./YieldsterVault.sol");
const SafeUtils = artifacts.require("./safeUtils/safeUtils.sol")
const SafeMinter=artifacts.require("./safeUtils/safeMinter.sol")
const { expectRevert } = require('@openzeppelin/test-helpers');
const { web3 } = require("@openzeppelin/test-helpers/src/setup");

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

contract("yieldster 2.0 safeUtils", function (accounts) {
let dai, usdt,ethers;
    let proxyFactory, apContract, safeUtils,safeMinter;
    let yieldsterVaultMasterCopy;

    describe("safeUtils Functions", async () => {
        beforeEach(async function () {
            dai = await ERC20.at("0x6B175474E89094C44Da98b954EedeAC495271d0F")
            usdt = await ERC20.at("0xdac17f958d2ee523a2206206994597c13d831ec7")
            weth = await ERC20.at("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2")
            ethers = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

            await usdt.transfer(accounts[3], to6("2000"))
            await dai.transfer(accounts[1], to18("2000"))
            await usdt.transfer(accounts[1], to6("2000"))


            apContract = await APContract.deployed();
            yieldsterVaultMasterCopy = await YieldsterVault.deployed()
            proxyFactory = await ProxyFactory.deployed()
            safeUtils = await SafeUtils.deployed()
            safeMinter = await SafeMinter.deployed()
            console.log("safeMinteAddress",safeMinter.address)


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
        });

//  it("dai token balance updation", async () => {
//             await testVault.setVaultAssets(
//                 [dai.address],
//                 [dai.address],
//                 [],
//                 [],
//             );

//             await dai.approve(testVault.address, to18("2000"), { from: accounts[1] })

//             await testVault.deposit(dai.address, to18("2000"), { from: accounts[1] });

//             assert.equal(
//                 from18((await testVault.getTokenBalance(dai.address)).toString()),
//                 2000,
//                 "incorrect value"
//             );

//             await testVault.tokenBalanceUpdation([dai.address],[to18('3000')]) 

//             assert.equal(
//                 from18((await testVault.getTokenBalance(dai.address)).toString()),
//                 3000,
//                 "incorrect value"
//             );
//         });








        // it("case1:usdt is unapproved and safe cleanup asset", async () => {
        //     await testVault.setVaultAssets(
        //         [dai.address],
        //         [dai.address],
        //         [],
        //         [],
        //     );

        //     await dai.approve(testVault.address, to18("2000"), { from: accounts[1] })

        //     await apContract.setYieldsterTreasury(accounts[9])
        //     await testVault.deposit(dai.address, to18("2000"), { from: accounts[1] });
        //     await usdt.transfer(testVault.address, to6("2000"), { from: accounts[3] })

        //     assert.equal(
        //         from6((await usdt.balanceOf(accounts[9])).toString()),
        //         0,
        //         "incorrect value"
        //     );

        //     await testVault.safeCleanUp([usdt.address])

        //     assert.equal(
        //         from6((await usdt.balanceOf(accounts[9])).toString()),
        //         2000,
        //         "incorrect value"
        //     );
        // });








        it("case1:usdt is approved", async () => {
            await testVault.setVaultAssets(
                [ dai.address, usdt.address],
                [ dai.address, usdt.address],
                [],
                [],
            );

          // await dai.approve(testVault.address, to18("2000"), { from: accounts[1] })
          await usdt.approve(testVault.address, to6("2000"), { from: accounts[1] })
            
          //await testVault.deposit(dai.address, to18("2000"), { from: accounts[1] });
          await testVault.deposit(usdt.address, to6("2000"), { from: accounts[1] });
            
          await usdt.transfer(testVault.address, to6("2000"),{from:accounts[3]})

            assert.equal(
                from18((await testVault.balanceOf(accounts[1])).toString()),
                2000,
                "incorrect value"
            );

            assert.equal(
                from18((await testVault.balanceOf(accounts[3])).toString()),
                0,
                "incorrect value"
            );
            console.log("197")
            const data = web3.eth.abi.encodeFunctionCall({
                type:"function",
                name:"approvedAssetCleanUp",
                inputs:[{
                    type:"address[]",
                    name:"_assetList",
                },{
                    type:"uint256[]",
                    name:"_amount", 
                },{
                    type:"address[]",
                    name:"reciever",
                },
                ]
            },[[usdt.address],[to6("2000")],[accounts[3]]])

            console.log("data",data)

            //await safeMinter.mintStrategy(testVault.address,data)
//console.log("229")
            await testVault.approvedAssetCleanUp([usdt.address],[to6("2000")],[accounts[3]])


            assert.equal(
                from18((await testVault.balanceOf(accounts[1])).toString()),
                2000,
                "incorrect value"
            );

            assert.equal(                                                                        //TODO change to mint value
                from18((await testVault.balanceOf(accounts[3])).toString()),
                2000,
                "incorrect value"
            );  
        });



        it("case2:ether is approved", async () => {
            await testVault.setVaultAssets(
                [ dai.address,"0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE","0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"],
                [ dai.address,"0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE","0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"],
                [],
                [],
            );

          //  await dai.approve(testVault.address, to18("2000"), { from: accounts[1] })

            //await testVault.deposit(dai.address, to18("2000"), { from: accounts[1] });
            await testVault.deposit(ethers, to18("2"), { value: web3.utils.toWei('2', "ether"),from: accounts[1],gas: 10000000});
            await web3.eth.sendTransaction({ to: testVault.address, from: accounts[3], value:web3.utils.toWei('2', "ether"), gas:1000000000 })

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

            await testVault.approvedAssetCleanUp(["0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"],[web3.utils.toWei('2', "ether")],[accounts[3]],{gas:1000000000})
            assert.equal(
                from18((await testVault.balanceOf(accounts[1])).toString()),
                2,
                "incorrect value"
            );

            assert.equal(                                                       //TODO change to mint value
                from18((await testVault.balanceOf(accounts[3])).toString()),
                2,
                "incorrect value"
            );
        });




        // it("case3:usdt is not approved", async () => {
        //     await testVault.setVaultAssets(
        //         [dai.address],
        //         [dai.address],
        //         [],
        //         [],
        //     );

        //     await dai.approve(testVault.address, to18("2000"), { from: accounts[1] })
        //     await testVault.deposit(dai.address, to18("2000"), { from: accounts[1] });
        //     await usdt.transfer(testVault.address, to6("2000"), { from: accounts[3] })

        //     assert.equal(
        //         from18((await testVault.balanceOf(accounts[1])).toString()),
        //         2000,
        //         "incorrect value"
        //     );

        //     assert.equal(
        //         from18((await testVault.balanceOf(accounts[3])).toString()),
        //         0,
        //         "incorrect value"
        //     );

        //     await testVault.approvedAssetCleanUp([usdt.address], [to6("2000")], [accounts[3]])

        //     assert.equal(
        //         from18((await testVault.balanceOf(accounts[1])).toString()),
        //         2000,
        //         "incorrect value"
        //     );

        //     assert.equal(
        //         from18((await testVault.balanceOf(accounts[3])).toString()),
        //         0,
        //         "incorrect value"
        //     );

        // });




        // it("case4:ether is not approved", async () => {

        //     await testVault.setVaultAssets(
        //         [dai.address],
        //         [dai.address],
        //         [],
        //         [],
        //     );

        //     await dai.approve(testVault.address, to18("2000"), { from: accounts[1] })
        //     await testVault.deposit(dai.address, to18("2000"), { from: accounts[1] });
        //     await web3.eth.sendTransaction({ to: testVault.address, from: accounts[3], value: web3.utils.toWei('2', "ether"), gas: 1000000000 })

        //     assert.equal(
        //         from18((await testVault.balanceOf(accounts[1])).toString()),
        //         2000,
        //         "incorrect value"
        //     );

        //     assert.equal(
        //         from18((await testVault.balanceOf(accounts[3])).toString()),
        //         0,
        //         "incorrect value"
        //     );

        //     await testVault.approvedAssetCleanUp(["0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"], [web3.utils.toWei('2', "ether")], [accounts[3]], { gas: 1000000000 })
        //     assert.equal(
        //         from18((await testVault.balanceOf(accounts[1])).toString()),
        //         2000,
        //         "incorrect value"
        //     );

        //     assert.equal(
        //         from18((await testVault.balanceOf(accounts[3])).toString()),
        //         0,
        //         "incorrect value"
        //     );

        // });


    });
});