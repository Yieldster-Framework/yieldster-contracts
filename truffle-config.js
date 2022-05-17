const HDWalletProvider = require("@truffle/hdwallet-provider");
require("dotenv").config();
const Web3 = require("web3");

module.exports = {
  networks: {
    development: {
      host: "localhost",
      provider: () => new Web3.providers.HttpProvider("http://127.0.0.1:8545"),
      port: 8545,
      network_id: "*",
    },
  },
  plugins: ["truffle-contract-size"],
  compilers: {
    solc: {
      version: "0.8.13",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200,
        },
        evmVersion: "petersburg",
      },
    },
  },
};