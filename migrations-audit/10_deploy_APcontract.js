const { deployProxy } = require("@openzeppelin/truffle-upgrades");

const APContract = artifacts.require("APContract");

module.exports = async function (deployer) {
  const instance = await deployProxy(
    APContract,
    [
      "0x7B6c44da6cc2FD19b4bA56fdDFb9202661f7dAFc",
      "0x2955278aBCE187315D6d72B0d626f1217786DF60",
      "0x5A03c210cCA2bfF3641dAf585339ded8E810A177",
      "0x2955278aBCE187315D6d72B0d626f1217786DF60",
      "0x5A03c210cCA2bfF3641dAf585339ded8E810A177"
    ],
    { deployer }
  );
  console.log("Deployed", instance.address);
};
