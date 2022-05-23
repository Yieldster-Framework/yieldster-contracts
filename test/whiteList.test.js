const utils = require("./utils/general");
const APContract = artifacts.require("./aps/APContract.sol");
const ProxyFactory = artifacts.require("./proxies/YieldsterVaultProxyFactory.sol");
const YieldsterVault = artifacts.require("./YieldsterVault.sol");
const Whitelist = artifacts.require("./whitelist/Whitelist.sol");

const {
    BN,           // Big Number support
    constants,    // Common constants, like the zero address and largest integers
    expectEvent,  // Assertions for emitted events
    expectRevert, // Assertions for transactions that should fail
} = require('@openzeppelin/test-helpers');

contract("should create vault and test functions of whiteTest contract", function (accounts) {
    let ether = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
    let proxyFactory, apContract, yieldsterVaultMasterCopy, testVault;
    let tokens = [];

    beforeEach(async function () {
        apContract = await APContract.deployed();
        yieldsterVaultMasterCopy = await YieldsterVault.deployed()
        proxyFactory = await ProxyFactory.deployed()
        whitelist = await Whitelist.deployed()
    });

    it("Should create 2 new vaults", async () => {
        testVaultData = await yieldsterVaultMasterCopy.contract.methods
            .setup(
                apContract.address,
                accounts[0]
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
        await testVault1.setTokenDetails("Test1 Token", "TT1", { from: accounts[3] });
        await testVault1.registerVaultWithAPS({ from: accounts[3] })
    })

    it("Should Create a whiteList and Add Members to group when group is empty", async () => {
        await whitelist.createGroup(accounts[0], { from: accounts[0] })
        await whitelist.removeMembersFromGroup(1, [accounts[0]])
        await whitelist.addMembersToGroup(1, [accounts[5]])

        assert.equal(
            await whitelist.isMember(1, accounts[5]),
            true,
            "not a member"
        );
    });

    it("Should be a vault admin to create a group", async () => {
        await expectRevert(
            whitelist.createGroup(accounts[0], { from: accounts[1] }),
            "Not a vault admin",
        );
    });

    it("Should remove member from group when 1 member exist", async () => {
        await whitelist.removeMembersFromGroup(1, [accounts[5]])
        assert.equal(
            await whitelist.isMember(1, accounts[5]),
            false,
            "a member"
        );
    });

    it("Should add Members to group when atleast 1 member exist", async () => {
        await whitelist.addMembersToGroup(1, [accounts[5]])
        await whitelist.addMembersToGroup(1, [accounts[6]])
        assert.equal(
            await whitelist.isMember(1, accounts[6]),
            true,
            "not a member"
        );
    });

    it("Should remove member from group when more than 1 member exist", async () => {
        let m = await whitelist.isMember(1, accounts[5])
        let n = await whitelist.isMember(1, accounts[6])
        await whitelist.removeMembersFromGroup(1, [accounts[6]])
        assert.equal(
            await whitelist.isMember(1, accounts[6]),
            false,
            "a member"
        );
    });

    it("Should create second whitelist group with admin as accounts[5]", async () => {
        await whitelist.createGroup(accounts[5], { from: accounts[3] })
        await whitelist.addMembersToGroup(2, [accounts[6]], { from: accounts[5] })
        assert.equal(
            await whitelist.isMember(2, accounts[6]),
            true,
            "not a member"
        );
    });

    it("Should test various cases of adding and removing whitelist admin", async () => {
        await whitelist.addWhitelistAdmin(2, accounts[8], { from: accounts[5] })
        await expectRevert(
            whitelist.removeWhitelistAdmin(1, accounts[8], { from: accounts[8] }),
            "Cannot remove yourself",
        );

        await expectRevert(
            whitelist.addWhitelistAdmin(5, accounts[8], { from: accounts[8] }),
            "Group doesn't exist!",
        );

        await expectRevert(
            whitelist.removeWhitelistAdmin(2, accounts[8], { from: accounts[2] }),
            "Only existing whitelist admin can perform this operation",
        );
    });

    it("Should delete whitelist group", async () => {
        await whitelist.deleteGroup(2, { from: accounts[5] })
        await expectRevert(
            whitelist.addMembersToGroup(2, [accounts[5]], { from: accounts[5] }),
            "Group doesn't exist!",
        );
    });

    it("Should be able to delete only a created whitelist group", async () => {
        await expectRevert(
            whitelist.deleteGroup(3),
            "Group doesn't exist!",
        );
    });

    it("Should not be able to add member from deleted WhiteList group", async () => {
        await expectRevert(
            whitelist.addMembersToGroup(2, [accounts[2], accounts[5]]),
            "Group doesn't exist!",
        );
    });

    it("Should not be able to remove member from deleted WhiteList group", async () => {
        await expectRevert(
            whitelist.removeMembersFromGroup(2, [accounts[2], accounts[3]], { from: accounts[5] }),
            "Group doesn't exist!",
        );
    });

    it("Should be a  yieldsterGOD to change AP contract", async () => {
        await expectRevert(
            whitelist.changeAPContract(accounts[4], { from: accounts[5] }),
            "unauthorized",
        );
    });
});

