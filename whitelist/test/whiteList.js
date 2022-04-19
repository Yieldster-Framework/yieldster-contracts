const Whitelist = artifacts.require("./whitelist/Whitelist.sol");
const { expectRevert } = require('@openzeppelin/test-helpers');

contract("yieldster 2.0 whiteList Module", function (accounts) {
    let whitelist;
    describe("whiteList Module Functions", async () => {
        it("Create a whiteList and Add Members to group when group is empty", async () => {
            whitelist = await Whitelist.deployed()
            await whitelist.createGroup(accounts[0])
            await whitelist.removeMembersFromGroup(1, [accounts[0]])
            await whitelist.addMembersToGroup(1, [accounts[5]])

            assert.equal(
                await whitelist.isMember(1, accounts[5]),
                true,
                "not a member"
            );
        });


        it("Remove member from group when 1 member exist", async () => {
            await whitelist.removeMembersFromGroup(1, [accounts[5]])
            assert.equal(
                await whitelist.isMember(1, accounts[5]),
                false,
                "a member"
            );
            //TODO(need a revert condition)
            // console.log("can remove only an added member")
            // await expectRevert(
            //     await whitelist.removeMembersFromGroup(1,[accounts[6]]),
            //             "only member can be removed",
            //         );

        });


        it("Remove Member from group when group is empty", async () => {
            await whitelist.removeMembersFromGroup(1, [accounts[5]])            //TODO: should revert
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


        it("Creating whitelist group", async () => {               //TODO: _isGroup is private
            await whitelist.createGroup(accounts[3])
            await whitelist.addMembersToGroup(2, [accounts[6]],{from:accounts[3]})
            assert.equal(
                await whitelist.isMember(2, accounts[6]),
                true,
                "not a member"
            );
        });

        it("Deleting whitelist group", async () => {
            await whitelist.deleteGroup(2, { from: accounts[3] })
            await expectRevert(
                whitelist.addMembersToGroup(2, [accounts[5]], { from: accounts[3] }),
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
                whitelist.addMembersToGroup(2, [accounts[2], accounts[3]]),
                "Group doesn't exist!",
            );
        });


        it("Removing member from deleted WhiteList group", async () => {
            await expectRevert(
                whitelist.removeMembersFromGroup(2, [accounts[2], accounts[3]]),
                "Group doesn't exist!",
            );
        });


        it("Create a group and remove whiteList manager from group(Admin)", async () => {
            await whitelist.createGroup(accounts[4])
            await whitelist.removeMembersFromGroup(3, [accounts[4]], { from: accounts[4] })
            assert.equal(
                await whitelist.isMember(3, accounts[4]),
                false,
                "A member"
            );
        });



        it("Removing whitelist manager from deleted group(Admin)", async () => {
            await whitelist.createGroup(accounts[5])
            await whitelist.deleteGroup(4, { from: accounts[5] })
            await expectRevert(
                whitelist.removeMembersFromGroup(4, [accounts[5]], { from: accounts[5] }),
                "Group doesn't exist!",
            );
        });


        it("Adding whiteList manager from group", async () => {
            await whitelist.createGroup(accounts[6])
            await whitelist.addMembersToGroup(5, [accounts[3], accounts[5], accounts[7]], { from: accounts[6] })
            assert.equal(
                await whitelist.getWhitelistAdmin(5),
                accounts[6],
                "Not Admin"
            );
            await whitelist.changeWhitelistAdmin(5, accounts[7], { from: accounts[6] })
            assert.equal(
                await whitelist.getWhitelistAdmin(5),
                accounts[7],
                "Not Admin"
            );

        });


    });
});
