const Web3 = require('web3');
const provider = new Web3.providers.WebsocketProvider("ws://localhost:8545");

let web3 = new Web3(provider);
const vaultABI = [
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "owner",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "spender",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "Approval",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "address",
                "name": "masterCopy",
                "type": "address"
            }
        ],
        "name": "ChangedMasterCopy",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "address",
                "name": "account",
                "type": "address"
            }
        ],
        "name": "Paused",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "address",
                "name": "feeAddress",
                "type": "address"
            }
        ],
        "name": "Response",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "from",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "to",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "Transfer",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "address",
                "name": "account",
                "type": "address"
            }
        ],
        "name": "Unpaused",
        "type": "event"
    },
    {
        "inputs": [],
        "name": "APContract",
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
                "name": "owner",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "spender",
                "type": "address"
            }
        ],
        "name": "allowance",
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
                "name": "spender",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "approve",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "account",
                "type": "address"
            }
        ],
        "name": "balanceOf",
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
                "name": "_masterCopy",
                "type": "address"
            }
        ],
        "name": "changeMasterCopy",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "decimals",
        "outputs": [
            {
                "internalType": "uint8",
                "name": "",
                "type": "uint8"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "spender",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "subtractedValue",
                "type": "uint256"
            }
        ],
        "name": "decreaseAllowance",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "emergencyConditions",
        "outputs": [
            {
                "internalType": "uint8",
                "name": "",
                "type": "uint8"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "eth",
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
            }
        ],
        "name": "getTokenBalance",
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
        "name": "getVaultNAV",
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
                "name": "spender",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "addedValue",
                "type": "uint256"
            }
        ],
        "name": "increaseAllowance",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "name",
        "outputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "operator",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "from",
                "type": "address"
            },
            {
                "internalType": "uint256[]",
                "name": "ids",
                "type": "uint256[]"
            },
            {
                "internalType": "uint256[]",
                "name": "values",
                "type": "uint256[]"
            },
            {
                "internalType": "bytes",
                "name": "data",
                "type": "bytes"
            }
        ],
        "name": "onERC1155BatchReceived",
        "outputs": [
            {
                "internalType": "bytes4",
                "name": "",
                "type": "bytes4"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "owner",
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
        "name": "paused",
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
        "name": "strategyBeneficiary",
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
        "name": "strategyPercentage",
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
                "internalType": "bytes4",
                "name": "interfaceId",
                "type": "bytes4"
            }
        ],
        "name": "supportsInterface",
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
        "name": "symbol",
        "outputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "threshold",
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
        "name": "tokenValueInUSD",
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
        "name": "totalSupply",
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
                "name": "to",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "transfer",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "from",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "to",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "transferFrom",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "vaultAdmin",
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
        "stateMutability": "payable",
        "type": "receive"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_mastercopy",
                "type": "address"
            }
        ],
        "name": "upgradeMasterCopy",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_APContract",
                "type": "address"
            }
        ],
        "name": "setAPS",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "toggleEmergencyBreak",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "enableEmergencyExit",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "registerVaultWithAPS",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_APContract",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "_vaultAdmin",
                "type": "address"
            }
        ],
        "name": "setup",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_owner",
                "type": "address"
            }
        ],
        "name": "transferOwnership",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256[]",
                "name": "_whiteListGroups",
                "type": "uint256[]"
            }
        ],
        "name": "addWhiteListGroups",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256[]",
                "name": "_whiteListGroups",
                "type": "uint256[]"
            }
        ],
        "name": "removeWhiteListGroups",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "_tokenName",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "_symbol",
                "type": "string"
            }
        ],
        "name": "setTokenDetails",
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
                "internalType": "uint256",
                "name": "_threshold",
                "type": "uint256"
            }
        ],
        "name": "setThreshold",
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
            },
            {
                "internalType": "uint256",
                "name": "_amount",
                "type": "uint256"
            }
        ],
        "name": "deposit",
        "outputs": [],
        "stateMutability": "payable",
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
                "name": "_shares",
                "type": "uint256"
            }
        ],
        "name": "withdraw",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_beneficiary",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "_percentage",
                "type": "uint256"
            }
        ],
        "name": "setBeneficiaryAndPercentage",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_poolAddress",
                "type": "address"
            },
            {
                "internalType": "bytes",
                "name": "_instruction",
                "type": "bytes"
            },
            {
                "internalType": "uint256[]",
                "name": "_amount",
                "type": "uint256[]"
            },
            {
                "internalType": "address[]",
                "name": "_fromToken",
                "type": "address[]"
            },
            {
                "internalType": "address[]",
                "name": "_returnToken",
                "type": "address[]"
            }
        ],
        "name": "protocolInteraction",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getAssetList",
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
                "name": "_fromToken",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "_toToken",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "_amount",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "_slippageSwap",
                "type": "uint256"
            }
        ],
        "name": "exchangeToken",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
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
        "name": "managementFeeCleanUp",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "id",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            },
            {
                "internalType": "bytes",
                "name": "data",
                "type": "bytes"
            }
        ],
        "name": "onERC1155Received",
        "outputs": [
            {
                "internalType": "bytes4",
                "name": "",
                "type": "bytes4"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "toPause",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "unPause",
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
    }
]
const erc20 = [
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "name_",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "symbol_",
                "type": "string"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "owner",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "spender",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "Approval",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "from",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "to",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "Transfer",
        "type": "event"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "owner",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "spender",
                "type": "address"
            }
        ],
        "name": "allowance",
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
                "name": "spender",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "approve",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "account",
                "type": "address"
            }
        ],
        "name": "balanceOf",
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
        "name": "decimals",
        "outputs": [
            {
                "internalType": "uint8",
                "name": "",
                "type": "uint8"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "spender",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "subtractedValue",
                "type": "uint256"
            }
        ],
        "name": "decreaseAllowance",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "spender",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "addedValue",
                "type": "uint256"
            }
        ],
        "name": "increaseAllowance",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "name",
        "outputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "symbol",
        "outputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "totalSupply",
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
                "name": "to",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "transfer",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "from",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "to",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "transferFrom",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "mintTokens",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "receiver",
                "type": "address"
            }
        ],
        "name": "mintTokensTo",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

let sender = "0x32Af4c512782B989b6c31c1531F6465E57705099"
let tokens = ["0x60ECb3F65D760FEBDc145D1f4b9369F2dd8A71A6","0x77998f53C658FA6D39a4779a7A522cEB4785067B","0x46f6AED3ed544d89892dC6B9aefc4a8D9bA1A4CB","0xbB4cC53c3425ea3662546Ec45e31191dE6f96D57","0xbbE99890C8B2153035eC00BAbb42b32D83C79FFE","0x30202a34014697A10741EbF99c0020f6a91f3b6c","0x6eb8163b40C911B7C6dFB7949FFBFC10bDF5bc21","0x434A0013210c3C961cFd42B083f2d0D7a5d352F8","0x24aD53c69EE8936B4ca291759a17a59EAB22f77D","0xe84b08047e5C6657019E9C2153C680066125eD9B","0x65A3a8C32959A7e165f0D173c1C875F4172Ef6db","0x59044DC50EBAbeB33f52d4282045E7b7077367Af","0x290A4C8DD8d7256DA71924BeA4004E1891149590","0x8bBA88Db2bF505AbBb815b6F48A4fA65f0BeDffc","0x88AFD9E432991BA6D3Bc5538c78BA48D17AFB224","0x9F25454905d4136d1a861952D1177Dd910f0C9de","0x56689B73EBBd65880A77b06AdEe0D2060a697842","0x0D9FDcD53e7a9E091C37A59FDe21326DaF5A4D92","0x60b43b5623f0177edCb8d5f2481cf3F41A199a06","0xDaA091616CE9A9020E4Cc05615a65a372BFD51C5","0xf8b310F6e5c87235b19234eF3af3167c604B4F4D","0x65e439eCFcA66ceF3FBc6E7b404C2ba1a345a0B3","0x9Bad15ef04E02A881C254Ebf8b849d6D48378B55","0xBaE7A301415bB671CAecc38955C9c47E1d67aA8c","0x92762dE95af066A1eD7C3d26F5c860EF9BF5a9bf","0x715eFaFdD034A90778dbA0e9dB51F905743d0209","0xEb1a62e95DF8C26Fb3E85FEFd03e08507bEabFAA","0x5A9B046db1c74667d08171847619797a90a3a4f5","0xd25c30D38DEbAf2ba80B7d7df90df3902F2bD159","0xF25F229FbE8206C2d9243271C885B0685eF47f51","0x0213e60371A58763300aDf8a3a6B1Ceb3D360143","0x198BB0cb53c5e00d56bD4798Ee076696B638c083","0x923CE4Ad50cFf5116AAC6a3f98DE5CBd66373647","0x11F2F468878749828FBe89Df079D86cD345934a5","0x7b1664F7a8B96d92D1aBD00bCAB4d6f2504fA2E6","0x2A7b3D80B98c3DdB1dB0080ce72fb749642178B4","0xeA88E534EcC2d2Ff41580638Cd63AD8aa3a2f11F","0xf6Ff17Ed92F3e5467488362b20e92d1b08665f7c","0x9621fEe836870725Fd52520C6396ab3F6a477412","0x815172F45c2EBB47D88E24580510a80124ab6BAD","0x7E0599728dFB8a587D98925ef04fE29A8f5C0661","0xe4EE784C632DF35eD2031f05C2C7e24DEC015300","0x0221C63D3169520185d6847693EDcF151da85253","0x091dC5A177437B34cbb3173350edCca3B8D503d5","0x5b1e28f5E459d993329be34AA71C301709aC9E7c","0x54DD42A9aF9BD4e428297A3DD65768b55ec266eE","0x8518bC46a3bBf9dBD65b4613ADDC7C0Ce82eB258","0x28f43BbDCF5aA2FAe3F98EC36852736c1C60609c","0x7dB7e52cc87D62B6fe3a3989f2a633CeB8C9b22e","0x16eF99556798a346714F48627DDc1f23C61507cf","0xBAF1C459a07CB7AfDfC828DB9260D0a98FF739B0","0xeAD6E5F56833b198D83B3C508aa1592081AECFAd","0x9BC9319F604e6D24B5EC2cf79c296284c69c4E39","0x9b5F392024394A879b7a1A762F764712674aA4CF","0x18e7E7D609c70713468C0AA1420389C06EE55429","0x254c885e91dB6EE3A741b79D70A3b65b8eBD7985","0x5B8f6579E4d33e116BD5Bf24670BC4F61b248624","0xdC017d80757F6a5cfe8298A3fbC5Ff5906B9dBc1","0x3Ac7aEE54724aB531F9Ea84A208c0cbd0378D243","0xD93A858D091B15F102eb67255F2997E8859CAE62","0x23A048Cab4Fae1CeA675AeA2f4e2752379D3365e","0x6FCb5BD9010e0776B8282a3E950d31f3C676E3cE","0x465f0A0041CdD5ff78FeFa530aFB47cD4920A0eA","0xe1C4d1C8711e244F6c0E263702133eF119a882Ac","0x49a5157aDb3fC0c62A2a24831f79B7daf0945d15","0x8608fEabCfFa99548Dc171c74C948BeC67681dca","0xC06460a0e357214c70937BaCCEeE72BEe1D2b4FF","0x5d5E7F6ff225a3B553998f5E24E22C79F2836D71","0x4F2327498F1d45c31B3645d92a9c85cD928e67E3","0x7b5eda4D90Cf38D3Ca20F423936760e0E85cBF64","0x8102f10838bB5C451a7c7247C2732cB6b0BA4D62","0xca7e6246C714F2b88801e86De671548650b3fdeD","0x91791BF2C5dD25936BCC04D13C9a04EbfA7409d6","0x8055463D61E6e60DfF6CEaB38d8731793f231297","0x64FeCbD508a8bb32a27725e2f0dcD5bb3B8b8875","0x78F3801d5893aFEE3B2902B7159D4F9fcE79a4fb","0x3A3Efb9Bf96D98f7787D8d4580Fc34957D352bD6","0x4afe3bdEfFE6CD0489B0D6C116F7F4D2bc1102Af","0x0C601fd53943131e8cdB35f5C4D7e9621C4701E6","0x97283a5159e1f4b11A02357cd3d20fAd8A338784","0x5B5Db35afc3f067084BC0608b75EE411372dF26C","0x7Ea545FcbEfb6a32e2084115e6Fea5f0cc0ff54f","0xC2FDF44B83Ea9c89b77da2E6cE4FF14F2d36571d","0x4D470aEdDAB46C9f5Db202540450e95C777c4595","0x84D77bf8d15Af00364e248B35cb2Ad8fEeda99c0","0xC9b28d039fef9215a5367D47DdF69b700d3CbB38","0x1a0fefa9252F07F2D5302fbafE7595E9c57d83D7","0xD311f8e35Db0E788Eeeb50D5a721a459b47C855b","0x75dE28c10F89d3445f17d9A2418E22d66D664CAa","0x5637E563cA1916CEacfd4ac1486A3BE1A2bf3B19","0xa3237A4D435948dE0E7bE178DC82e62F8EC49ad5","0x972B8c45ded8f3ee95333588FDb91BA363495A3a","0xAAdb4b213c21AD354A38648096BCa6461576f4c4","0x69c40396394703d712d597C81808ca54231A8bdb","0xFf0b5F206FEf75fd3d2E3F8B2fFE298591c36f18","0x967C1Af076c196feB495615112f656BB24079e00","0xEAf3894909e5FaDd38391Ef5e51afE84d19F347b","0x98739b55554f6EA9c7D513f9aFCB9aE4e98Cc6E5","0xAF46d487D0c4A5EF8CA4a89D62a9Cf867049B51F","0xF51BbD8D05177363B25921128e0D33c6806AC954","0xe38c17943B837AFF2E2361A7C503BAD3Ca6FB0bd","0x43bD1f12C515e987aFe30DF02D4A33E5E4F72204","0xFF7fDBc73Da1880FC655Dc79295BcbF12355AFb5","0x76c4d58Dd1ae7EBF6F6e4F1de1960F0B9CEA4600","0x1253083EE59621959382BD4F251F4C3e7B18E421","0xaE8eD7B4dcFd1a0edA7991C2F5Eb764a8c6924A5","0xe821301762770892a7095411C8a8787d893311E1","0xDf8D2C7621460708A43f2AbD0090FC626E5DC0Ba","0xaC4a7Eb994027a0bAD02d10D49e52Baf35faf2D2","0xBfFEE79E62378bAffA6E06F185209C3B9feC77b7","0x23934bFe145bcFc3C2D38bccB13FB8B88f0550F6","0x3eeDe91cE344b3ae3e39af10802C13feF0eCf8F1","0xDCe221340E829c69811165222B416a068FaeCEC0","0x66335670f54b5962EDeadD955C43463fa5812542","0x38842Fa1D8346d1a742b64e1c2E9DC9Bc61c9413","0x5a185E840aE208608Ce2C1256F49d7DF61F79fA3","0xE46da1682B5C5e565273EE224794270ba16503bf","0xA0d972aC364b6b6Babcf9E4aFB9df65703bD04b1","0x05a99fad91dA8F59B5a6A6843cfED4aB2163E859","0x455E56966Bf9846dd344192FcD5DD13611385eB1","0x6ab6B1f4e528aE6267e2046Ac831FbCAcFB9b152","0x4fE5CFde721Be52EcDe0A0945bc6bC5C6e17C35c","0xdfe02C573B1109B7F11b4D631C138097673732Ba","0x0775eC4e4CefD643c81C48dd682FC19B8e204EE7","0x178ee4f9BD36cE37D1daEf1C3BEc2FddE3c2510a","0xE346382f49EDCdB636960208E21E25380f0F7855","0xcE8EA9854bfacAf107C59CD59979fe4154c2Dd64","0xd587a1C268B1720F25CB695CB56E99E58300AB0c","0x9a5727110bd34f8dE0Ce0cC8A617D909b75B1c01","0x0907e5b7451D32487477eF18825809B054DA0351","0xa67993a5776481c4A277823896E334b756AfFC7B","0x5F94460C8558Bdc4588599B6454308F5655e6Df6","0x84605Cf2e0D710a2bF02a24a3a028Ff1433bfA9E","0x93badF5148609336BeB48354E2A7F70EE0D18Fac","0xe0DF235e49E2DCfb06a437Ed2a31Ec8061FF80E3","0x3984aD759A7556521bAEeF2fC9BAD4818b5517f2","0xE414De559A61d12261A9357c11C22c785Eeabf74","0x721485133085F4222a8010CD0d30C25647aC846d","0x8cA93ebecCFf5d8700461f994F30c7FB6db83511","0x04E869EfD1Cd451489c64666df85194577824546","0x6e20F24216D598C90FfAb5383E77DBC2F0C4ccED","0x412b4e7b75Ee1f965628bFE7f247CeEAf8c69563","0xF317AEDB5C611DC0BE9F6Cc321EaF82927e73de7","0x71BD703293b4aA5E11b124c246dc62971b6056DD","0xdd88437c8140F2cCedFEbA756ac38791c07997DB","0x3D37f364Ad3d106335503Db236f3EAe3ea3402c2","0x2aF68c15E0143762eD05582301188Ba31be012d5","0x7B4923501cD3b5d3A9bC20508E1b0c3A1F781724","0x24F01b2182463789102Ef93505a53B7C51D12332","0x3dFfC3A07ea34dcABC766271fF720609Bd086b3D"]
let vaultAddress = "0xc21791D894b5Fd321DA9Ac3562581294059f53aA"
function take10(a, b) {
    let arr = tokens.slice(a, b)
    return arr;
}

const massApprove = async (tokenArr) => {
    for (let index = 0; index < tokenArr.length; index++) {
        let token = new web3.eth.Contract(erc20, tokenArr[index]);
        token.methods.approve(vaultAddress, "100000000000000000000").send({ from: sender });
    }
}
let arr = take10(0, 10)
massApprove(arr)
arr = take10(10,20)
massApprove(arr)
arr = take10(20,30)
massApprove(arr)
arr = take10(30,40)
massApprove(arr)
arr = take10(40,50)
massApprove(arr)
arr = take10(50,60)
massApprove(arr)
arr = take10(60,70)
massApprove(arr)
arr = take10(70,80)
massApprove(arr)
arr = take10(80,90)
massApprove(arr)
arr = take10(90,100)


const deposit = async (tokenArr) => {
    let vault = new web3.eth.Contract(vaultABI, vaultAddress);
    for (let index = 0; index < tokenArr.length; index++) {
        vault.methods.deposit(tokenArr[index], "1000000000000000000").send({ from: sender ,gas:3000000});
    }
}
arr = take10(0, 10)
deposit(arr)
arr = take10(10,20)
deposit(arr)
arr = take10(20,30)
deposit(arr)
arr = take10(30,40)
massApprove(arr)
arr = take10(40,50)
massApprove(arr)
arr = take10(50,60)
massApprove(arr)
arr = take10(60,70)
massApprove(arr)
arr = take10(70,80)
massApprove(arr)
arr = take10(80,90)
massApprove(arr)
arr = take10(90,100)



