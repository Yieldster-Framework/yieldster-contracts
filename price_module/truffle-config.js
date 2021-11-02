const HDWalletProvider = require("@truffle/hdwallet-provider");
require("dotenv").config();
const package = require("./package");
const Web3 = require("web3")
const webSocketProvider = new Web3.providers.WebsocketProvider(process.env.INFURA_TOKEN_WSS);
const privateKey = process.env.PRIVATE_KEY_3;
const privateKeys = [privateKey];

module.exports = {
	networks: {
		development: {
			host: "localhost",
			port: 8545,
			network_id: "*", // Match any network id
			websockets: true,
			networkCheckTimeout: 999999,
		},
		mainnet: {
			provider: () => {
				return new HDWalletProvider(privateKeys, webSocketProvider);
			},
			network_id: "1",
			gasPrice: 38000000000, // 20 Gwei
			networkCheckTimeout: 1000000000,
			gas: 955067
		},
	},
	plugins: ["truffle-contract-size"],
	compilers: {
		solc: {
			version: '0.6.12',
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
