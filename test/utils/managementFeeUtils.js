const { BN } = require("@openzeppelin/test-helpers");
const { ERC1820 } = require("@openzeppelin/test-helpers/src/makeInterfaceId");
const oneE18 = new BN("1000000000000000000"); //1e18

exports.calculateFee = (_vaultNAV, _blockDifference, _feePercentage) => {
    let vaultNAV = new BN(_vaultNAV.toString());
    let blockDifference = new BN(_blockDifference.toString());
    let feePercentage = new BN(_feePercentage.toString());
    const blocksInAYear = new BN("262800000"); //Assuming blocks time to be 12 seconds.
    let platformFee = vaultNAV.mul(oneE18).mul(blockDifference).mul(feePercentage).div(blocksInAYear.mul(oneE18.pow(new BN("2"))));
    return platformFee;
}

exports.calculateVaultNAVWithoutManagementFee = (tokensDepositedSoFar) => {
    let nav = new BN("0")
    for (let index = 0; index < tokensDepositedSoFar.length; index++) {
        const element = tokensDepositedSoFar[index];
        nav = nav.add((new BN(element.amount)).mul(new BN(element.tokenPrice)).div(oneE18));
    }
    return nav;
}

exports.getManagementFeesAccruedInYieldsterDAO = async (priceModule, yieldsterVault, tokenSet, apContract, ERC20) => {
    let tokenArr = Array.from(tokenSet);
    let yieldsterDAO = await apContract.yieldsterDAO();
    let managementFeeInDAO = new BN("0");
    await Promise.all(
        tokenArr.map(async (element) => {
            let obj;
            let tokenInstance = await ERC20.at(element);
            let tokenBalance = await tokenInstance.balanceOf(yieldsterDAO);
            let tokenPrice = await priceModule.getUSDPrice(element);
            let totalTokenPrice = (new BN(tokenBalance.toString())).mul(new BN(tokenPrice.toString())).div(oneE18);
            managementFeeInDAO = managementFeeInDAO.add(totalTokenPrice)
        })
    )
    // console.log("tokenInDAO", managementFeeInDAO.toString())
    return managementFeeInDAO;
}

exports.getManagementFeesAccruedInVaultStrategyBeneficiary = async (priceModule, yieldsterVault, tokenSet, apContract, ERC20) => {
    let tokenArr = Array.from(tokenSet);
    let strategyBeneficiary = await yieldsterVault.strategyBeneficiary();
    let managementFeeInDAO = new BN("0");
    await Promise.all(
        tokenArr.map(async (element) => {
            let obj;
            let tokenInstance = await ERC20.at(element);
            let tokenBalance = await tokenInstance.balanceOf(strategyBeneficiary);
            let tokenPrice = await priceModule.getUSDPrice(element);
            let totalTokenPrice = (new BN(tokenBalance.toString())).mul(new BN(tokenPrice.toString())).div(oneE18);
            managementFeeInDAO = managementFeeInDAO.add(totalTokenPrice)
        })
    )
    // console.log("tokenInDAO", managementFeeInDAO.toString())
    return managementFeeInDAO;
}
