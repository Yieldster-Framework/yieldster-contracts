const HDWalletProvider = require("@truffle/hdwallet-provider");
require("dotenv").config();
const package = require("./package");
const mnemonic = process.env.MNEMONIC;
const token = process.env.INFURA_TOKEN;
const privateKey = process.env.PRIVATE_KEY;
const privateKeys = [privateKey];

module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*", // Match any network id
      websockets: true,
    },
    // rinkeby: {
    // 	network_id: "4",
    // 	provider: () => {
    // 		return new HDWalletProvider(mnemonic, token);
    // 	},
    // 	gasPrice: 25000000000, // 25 Gwei
    // 	networkCheckTimeout: 10000000,
    // 	skipDryRun: true,
    // },
    rinkeby: {
      network_id: "4",
      provider: () => {
        return new HDWalletProvider(privateKeys, token);
      },
      gasPrice: 83000000000, // 25 Gwei
      networkCheckTimeout: 1000000000,
      skipDryRun: true,
      gas: 800000,
    },
    mainnet: {
      provider: () => {
        return new HDWalletProvider(privateKeys, token);
      },
      network_id: "1",
      gasPrice: 14000000000, // 80 Gwei
      networkCheckTimeout: 1000000000,
      gas: 715254,
    },
  },
  plugins: ["truffle-contract-size"],
  compilers: {
    solc: {
      version: package.dependencies.solc,
      settings: {
        optimizer: {
          enabled: true,
          runs: 200,
        },
        evmVersion: "petersburg",
      },
    },
  },
  plugins: ["truffle-contract-size"],
};
