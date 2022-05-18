const utils = require("./utils/general");
const APContract = artifacts.require("./aps/APContract.sol");
const ProxyFactory = artifacts.require("./proxies/YieldsterVaultProxyFactory.sol");
const YieldsterVault = artifacts.require("./YieldsterVault.sol");
const Whitelist = artifacts.require("./whitelist/Whitelist.sol");

const { expectRevert } = require('@openzeppelin/test-helpers');
const USDC = artifacts.require("./dummytokens/dummyUSDC")
const DAI = artifacts.require("./dummytokens/dummyDAI")
const ETH = artifacts.require("./dummytokens/dummyETH")
const FRAX = artifacts.require("./dummytokens/dummyFRAX")


contract("whiteTest", function (accounts) {
    let dai, usdc, frax, weth;
    let proxyFactory, apContract,profitManagementFee,managementFee;
    let yieldsterVaultMasterCopy,whitelist;
    let manager;

    describe("AP Module Functions", async () => {
        it("should create a new vault", async () => {
            //---------------------------------CREATING-TOKENS-OBJECT-------------------------------------------//
            ether = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
            dai = await DAI.deployed()
            usdc = await USDC.deployed()
            weth = await ETH.deployed()
            frax = await FRAX.deployed()
            //-------------------------------------------------------------------------------------------------//
    
                apContract = await APContract.deployed();
                yieldsterVaultMasterCopy = await YieldsterVault.deployed()
                proxyFactory = await ProxyFactory.deployed()
                whitelist = await Whitelist.deployed()
                
                manager = accounts[9];
                const testVaultData = await yieldsterVaultMasterCopy.contract.methods
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
    
            console.log(`vault owner:- ${await testVault.owner()}, vault address:- ${testVault.address}`);
    
    
                await testVault.setTokenDetails("Test Token", "TT");
    
                await testVault.registerVaultWithAPS()
    
                await testVault.setVaultAssets(
                    [dai.address, usdc.address],
                    [dai.address, usdc.address],
                    [weth.address],
                    [],
                );

               console.log("creating secong group with ")

               const testVaultData1 = await yieldsterVaultMasterCopy.contract.methods
               .setup(
                   apContract.address,
                   accounts[3],
               )
               .encodeABI();
   
           testVault1 = await utils.getParamFromTxEvent(
               await proxyFactory.createProxy(testVaultData1),
               "ProxyCreation",
               "proxy",
               proxyFactory.address,
               YieldsterVault,
               "create Yieldster Vault"
           );
   
           console.log(`vault owner:- ${await testVault1.owner()}, vault address:- ${testVault1.address}`);
   
   
               await testVault1.setTokenDetails("Test1 Token", "TT1",{from:accounts[3]});
   
               await testVault1.registerVaultWithAPS({from:accounts[3]})
   
               await testVault1.setVaultAssets(
                   [dai.address, usdc.address],
                   [dai.address, usdc.address],
                   [weth.address],
                   [],{from:accounts[3]}
               );


            });
                
                it("Create a whiteList and Add Members to group when group is empty", async () => {
                    await whitelist.createGroup(accounts[0],{from:accounts[0]})
                    await whitelist.removeMembersFromGroup(1, [accounts[0]])
                    await whitelist.addMembersToGroup(1, [accounts[5]])
        
                    assert.equal(
                        await whitelist.isMember(1, accounts[5]),
                        true,
                        "not a member"
                    );
                });

                it("only a vault admin can create a group", async () => {
                    await expectRevert(
                    whitelist.createGroup(accounts[0],{from:accounts[1]}),
                        "Not a vault admin",
                    );
                });

                it("Remove member from group when 1 member exist", async () => {
                    await whitelist.removeMembersFromGroup(1, [accounts[5]])
                    assert.equal(
                        await whitelist.isMember(1, accounts[5]),
                        false,
                        "a member"
                    );
                });

                it("Add Members to group when atleast 1 member exist", async () => {
                    await whitelist.addMembersToGroup(1, [accounts[5]])
                    await whitelist.addMembersToGroup(1, [accounts[6]])
                    assert.equal(
                        await whitelist.isMember(1, accounts[6]),
                        true,
                        "not a member"
                    );
                });

                it("Remove member from group when more than 1 member exist", async () => {
                    let m = await whitelist.isMember(1, accounts[5])
                    let n = await whitelist.isMember(1, accounts[6])
                    await whitelist.removeMembersFromGroup(1, [accounts[6]])
                    assert.equal(
                        await whitelist.isMember(1, accounts[6]),
                        false,
                        "a member"
                    );
                });

                it("Creating second whitelist group", async () => {               //TODO: _isGroup is private
                    await whitelist.createGroup(accounts[5],{from:accounts[3]})     //acnts[5] is whitelistgrpAdmin //[3] vault owner
                    await whitelist.addMembersToGroup(2, [accounts[6]],{from:accounts[5]})
                    assert.equal(
                        await whitelist.isMember(2, accounts[6]),
                        true,
                        "not a member"
                    );
                });
        

//write test for addwhitelist admin
it("test for adding whitelist admin", async () => {  
    await whitelist.addWhitelistAdmin(2,accounts[8],{from:accounts[5]})
await expectRevert(
    whitelist.removeWhitelistAdmin(1, accounts[8],{from:accounts[8]}),
    "Cannot remove yourself",
);    

await expectRevert(
    whitelist.addWhitelistAdmin(5, accounts[8],{from:accounts[8]}),
    "Group doesn't exist!",
);     

await expectRevert(
    whitelist.removeWhitelistAdmin(2, accounts[8],{from:accounts[2]}),
    "Only existing whitelist admin can perform this operation",
);   
   
});



                it("Deleting whitelist group", async () => {
                    await whitelist.deleteGroup(2, { from: accounts[5] })
                    await expectRevert(
                        whitelist.addMembersToGroup(2, [accounts[5]], { from: accounts[5] }),
                        "Group doesn't exist!",
                    );
                });

                it("Can delete only a created whitelist group", async () => {
                    await expectRevert(
                        whitelist.deleteGroup(3),
                        "Group doesn't exist!",
                    );
                });
        
        
        
                it("Adding member from deleted WhiteList group", async () => {
                    await expectRevert(
                        whitelist.addMembersToGroup(2, [accounts[2], accounts[5]]),
                        "Group doesn't exist!",
                    );
                });
        
        
                it("Removing member from deleted WhiteList group", async () => {
                    await expectRevert(
                        whitelist.removeMembersFromGroup(2, [accounts[2], accounts[3]],{from:accounts[5]}),
                        "Group doesn't exist!",
                    );
                });

                it("0nly yieldsterGOD can Change AP contract", async () => {
                    await expectRevert(
                        whitelist.changeAPContract(accounts[4],{from:accounts[5]}),
                        "unauthorized",
                    );
                });

        
        
        
                // it("Removing whitelist manager from deleted group(Admin)", async () => {
                //     await whitelist.createGroup(accounts[5])
                //     await whitelist.deleteGroup(4, { from: accounts[5] })
                //     await expectRevert(
                //         whitelist.removeMembersFromGroup(4, [accounts[5]], { from: accounts[5] }),
                //         "Group doesn't exist!",
                //     );
                // });

                // await expectRevert(
                //     whitelist.addWhitelistAdmin(5, accounts[8],{from:accounts[8]}),
                //     "Group doesn't exist!",
                // );    
        
        
//                 // it("Adding whiteList manager from group", async () => {
//                 //     await whitelist.createGroup(accounts[6])
//                 //     await whitelist.addMembersToGroup(5, [accounts[3], accounts[5], accounts[7]], { from: accounts[6] })
//                 //     assert.equal(
//                 //         await whitelist.getWhitelistAdmin(5),
//                 //         accounts[6],
//                 //         "Not Admin"
//                 //     );
//                 //     await whitelist.changeWhitelistAdmin(5, accounts[7], { from: accounts[6] })
//                 //     assert.equal(
//                 //         await whitelist.getWhitelistAdmin(5),
//                 //         accounts[7],
//                 //         "Not Admin"
//                 //     );
        
//                 // });
        


    
            });
        });


