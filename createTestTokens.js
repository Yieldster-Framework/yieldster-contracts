require("dotenv").config();
const Web3 = require("web3");
// const utils = require("./test/utils/general");

const MockPriceModule = [
    {
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "inputs": [],
        "name": "priceModuleManager",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_tokenAddress",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "_tokenType",
                "type": "uint256"
            }
        ],
        "name": "addToken",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address[]",
                "name": "_tokenAddress",
                "type": "address[]"
            },
            {
                "internalType": "uint256[]",
                "name": "_tokenType",
                "type": "uint256[]"
            }
        ],
        "name": "addTokenInBatches",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_tokenAddress",
                "type": "address"
            }
        ],
        "name": "getUSDPrice",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
];
const TokenFactory = [
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "address",
                "name": "tokenAddress",
                "type": "address"
            }
        ],
        "name": "ERC20TokenCreated",
        "type": "event"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "name",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "symbol",
                "type": "string"
            }
        ],
        "name": "deployNewERC20Token",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    }
]
const APContract = [
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "uint8",
                "name": "version",
                "type": "uint8"
            }
        ],
        "name": "Initialized",
        "type": "event"
    },
    {
        "inputs": [],
        "name": "emergencyVault",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "exchangeRegistry",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "mStorage",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "platFormManagementFee",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "priceModule",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "profitManagementFee",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "proxyFactory",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "safeMinter",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "safeUtils",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "sdkContract",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "stockDeposit",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "stockWithdraw",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "stringUtils",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "wEth",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "whitelistModule",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "yieldsterDAO",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "yieldsterExchange",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "yieldsterGOD",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "yieldsterTreasury",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_yieldsterDAO",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "_yieldsterTreasury",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "_yieldsterGOD",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "_emergencyVault",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "_apsAdmin",
                "type": "address"
            }
        ],
        "name": "initialize",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_whitelistModule",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "_platformManagementFee",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "_profitManagementFee",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "_stringUtils",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "_yieldsterExchange",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "_exchangeRegistry",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "_priceModule",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "_safeUtils",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "_mStorage",
                "type": "address"
            }
        ],
        "name": "setInitialValues",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_proxyFactory",
                "type": "address"
            }
        ],
        "name": "addProxyFactory",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_manager",
                "type": "address"
            }
        ],
        "name": "addManager",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_manager",
                "type": "address"
            }
        ],
        "name": "removeManager",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_yieldsterGOD",
                "type": "address"
            }
        ],
        "name": "setYieldsterGOD",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_yieldsterDAO",
                "type": "address"
            }
        ],
        "name": "setYieldsterDAO",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_yieldsterTreasury",
                "type": "address"
            }
        ],
        "name": "setYieldsterTreasury",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "disableYieldsterGOD",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_emergencyVault",
                "type": "address"
            }
        ],
        "name": "setEmergencyVault",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_safeMinter",
                "type": "address"
            }
        ],
        "name": "setSafeMinter",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_safeUtils",
                "type": "address"
            }
        ],
        "name": "setSafeUtils",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_stringUtils",
                "type": "address"
            }
        ],
        "name": "setStringUtils",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_whitelistModule",
                "type": "address"
            }
        ],
        "name": "setWhitelistModule",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_exchangeRegistry",
                "type": "address"
            }
        ],
        "name": "setExchangeRegistry",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_yieldsterExchange",
                "type": "address"
            }
        ],
        "name": "setYieldsterExchange",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_vaultAdmin",
                "type": "address"
            }
        ],
        "name": "changeVaultAdmin",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_slippage",
                "type": "uint256"
            }
        ],
        "name": "setVaultSlippage",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getVaultSlippage",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_priceModule",
                "type": "address"
            }
        ],
        "name": "setPriceModule",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_tokenAddress",
                "type": "address"
            }
        ],
        "name": "getUSDPrice",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_platformManagement",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "_profitManagement",
                "type": "address"
            }
        ],
        "name": "setProfitAndPlatformManagementFeeStrategies",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getVaultManagementFee",
        "outputs": [
            {
                "internalType": "address[]",
                "name": "",
                "type": "address[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_vaultAddress",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "_managementFeeAddress",
                "type": "address"
            }
        ],
        "name": "addManagementFeeStrategies",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_vaultAddress",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "_managementFeeAddress",
                "type": "address"
            }
        ],
        "name": "removeManagementFeeStrategies",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_vaultAddress",
                "type": "address"
            }
        ],
        "name": "setVaultStatus",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_vaultAdmin",
                "type": "address"
            },
            {
                "internalType": "uint256[]",
                "name": "_whitelistGroup",
                "type": "uint256[]"
            }
        ],
        "name": "addVault",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address[]",
                "name": "_enabledDepositAsset",
                "type": "address[]"
            },
            {
                "internalType": "address[]",
                "name": "_enabledWithdrawalAsset",
                "type": "address[]"
            },
            {
                "internalType": "address[]",
                "name": "_disabledDepositAsset",
                "type": "address[]"
            },
            {
                "internalType": "address[]",
                "name": "_disabledWithdrawalAsset",
                "type": "address[]"
            }
        ],
        "name": "setVaultAssets",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "cleanUpAsset",
                "type": "address"
            }
        ],
        "name": "_isVaultAsset",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_tokenAddress",
                "type": "address"
            }
        ],
        "name": "addAsset",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_tokenAddress",
                "type": "address"
            }
        ],
        "name": "removeAsset",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_assetAddress",
                "type": "address"
            }
        ],
        "name": "isDepositAsset",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_assetAddress",
                "type": "address"
            }
        ],
        "name": "isWithdrawalAsset",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_stockDeposit",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "_stockWithdraw",
                "type": "address"
            }
        ],
        "name": "setStockDepositWithdraw",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_smartStrategyAddress",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "_type",
                "type": "uint256"
            }
        ],
        "name": "setVaultSmartStrategy",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_smartStrategyAddress",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "_minter",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "_executor",
                "type": "address"
            }
        ],
        "name": "addSmartStrategy",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_smartStrategyAddress",
                "type": "address"
            }
        ],
        "name": "removeSmartStrategy",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_smartStrategy",
                "type": "address"
            }
        ],
        "name": "smartStrategyExecutor",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_smartStrategy",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "_executor",
                "type": "address"
            }
        ],
        "name": "changeSmartStrategyExecutor",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getDepositStrategy",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getWithdrawStrategy",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_minter",
                "type": "address"
            }
        ],
        "name": "getStrategyFromMinter",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_address",
                "type": "address"
            }
        ],
        "name": "isVault",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getWETH",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_wEth",
                "type": "address"
            }
        ],
        "name": "setWETH",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "fromToken",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "toToken",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "slippagePercent",
                "type": "uint256"
            }
        ],
        "name": "calculateSlippage",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_vaultAdmin",
                "type": "address"
            }
        ],
        "name": "vaultsCount",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getPlatformFeeStorage",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_mStorage",
                "type": "address"
            }
        ],
        "name": "setManagementFeeStorage",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_sdkContract",
                "type": "address"
            }
        ],
        "name": "setSDKContract",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address[]",
                "name": "_walletAddresses",
                "type": "address[]"
            },
            {
                "internalType": "bool[]",
                "name": "_permission",
                "type": "bool[]"
            }
        ],
        "name": "setWalletAddress",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_walletAddress",
                "type": "address"
            }
        ],
        "name": "checkWalletAddress",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
]

const fromOBJ = {
    from: "0x92506Ee00ad88354fa25E6CbFa7d42116d6823C0",
    gas:"1000000"
}

const getLogs = (transaction) => {
    let logs = transaction.logs;
    console.log(transaction)
    logs = logs.filter((l) => l.event === "ERC20TokenCreated")
    let param = logs[0].args["tokenAddress"];
    return param;
}

const createTestTokens = async () => {

    let acc = web3.eth.accounts.privateKeyToAccount("84bf18c3f7b5d1a0b8afbd3fb7f50477bf2f95803b770c9916f504e55b45fc0e");
    let wallet = web3.eth.accounts.wallet.add(acc);

    let tokenFactory = new web3.eth.Contract(TokenFactory, "0x9ea852a78EE2184B172aAB93579273eFC89AcFe2");
    let priceModule = new web3.eth.Contract(MockPriceModule, "0x269C25eb40614C700421F7C94b768b50191afBF8");
    let apContract = new web3.eth.Contract(APContract, "0xc557fe59E348e1A837FBd7d14225e749CEB33Fa3")

    let tokens = [];
    for (let index = 0; index < 4; index++) {
        let transaction = await tokenFactory.methods.deployNewERC20Token(`TEST-TOKEN-${index}`, `TTK-${index}`).send(fromOBJ);
        let txn = await web3.eth.getTransactionReceipt(transaction.transactionHash)
        let token = getLogs(txn);
        tokens.push(token)
    }

    for (let index = 0; index < tokens.length; index++) {
        let token = new web3.eth.Contract(erc20, tokens[index], { from: account });
        if (index % 2 === 0)
            token.methods.mintTokens("100000000000000000000000").send(fromOBJ);
        else
            token.methods.mintTokens("200000000000000000000000").send(fromOBJ);
    }

    await priceModule.addTokenInBatches(tokens, indices)
    for (let index = 0; index < tokens.length; index++) {
        let token = tokens[index];
        await apContract.methods.addAsset(token).send(fromOBJ)
    }
    await apContract.methods.setWETH(tokens[0]).send(fromOBJ)

    console.log(tokens)
}

createTestTokens()