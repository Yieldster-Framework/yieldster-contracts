// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;
import "./storage/VaultStorage.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract YieldsterVault is VaultStorage {
    //already present in vault _storage
    using SafeERC20 for IERC20;
    using SafeMath for uint256;


    /// @dev Function to upgrade the vault.
    function upgradeMasterCopy(address _mastercopy) external {
        _isYieldsterGOD();
        (bool result, ) = address(this).call(
            abi.encodeWithSignature("changeMasterCopy(address)", _mastercopy)
        );
        revertDelegate(result);
    }

    /// @dev Function to set APS Address.
    function setAPS(address _APContract) external {
        _isYieldsterGOD();
        APContract = _APContract;
    }

    /// @dev Function to toggle Emergency Break feature of the Vault.
    function toggleEmergencyBreak() external {
        _isYieldsterGOD();
        if (emergencyConditions == 1) emergencyConditions = 0;
        else if (emergencyConditions == 0) emergencyConditions = 1;
    }

    function enableEmergencyExit() external {
        _isYieldsterGOD();
        emergencyConditions = 2;
        for (uint256 i = 0; i < assetList.length; i++) {
            IERC20 token = IERC20(assetList[i]);
            uint256 tokenBalance = token.balanceOf(address(this));
            if (tokenBalance > 0) {
                token.safeTransfer(
                    IAPContract(APContract).emergencyVault(),
                    tokenBalance
                );
            }
        }
    }

    /// @dev Function that checks if the user is whitelisted.
    function _isWhiteListed() private view {
        if (whiteListGroups.length == 0) {
            return;
        } else {
            for (uint256 i = 0; i < whiteListGroups.length; i++) {
                if (isWhiteListGroupPresent[whiteListGroups[i]]) {
                    if (
                        IWhitelist(IAPContract(APContract).whitelistModule())
                            .isMember(whiteListGroups[i], msg.sender)
                    ) {
                        return;
                    }
                }
            }
            revert("Only Whitelisted");
        }
    }

    /// @dev Function that is called once after vault creation to Register the Vault with APS.
    function registerVaultWithAPS() external onlyNormalMode {
        require(msg.sender == owner, "unauthorized");
        require(!vaultRegistrationCompleted, "Vault is already registered");
        vaultRegistrationCompleted = true;
        IAPContract(APContract).addVault(vaultAdmin, whiteListGroups);
    }

    // / @dev Setup function sets initial storage of contract.
    // / @param _vaultAdmin Address of the Vault APS Manager.
    // / @param _owner Address of the Vault owner.
    // / @param _APContract Address of apcontract
    function setup(address _APContract, address _vaultAdmin) external {
        require(!vaultSetupCompleted, "Vault is already setup");
        vaultSetupCompleted = true;
        vaultAdmin = _vaultAdmin;
        // APContract = 0xB24Ff34F5AE7F8Dde93A197FB406c1E78EEC0B25; //hardcode APContract address here before deploy to mainnet
        APContract = _APContract;
        owner = _vaultAdmin;
        wEth=0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
        eth=0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;
        tokenBalances = new TokenBalanceStorage();
    }

    function changeWethAddress(address _wEth) external {
        _isVaultAdmin();
        wEth = _wEth;
    }

    function transferOwnership(address _owner) external{
        require(msg.sender == owner, "unauthorized");
        owner = _owner;
    }


    function addWhiteListGroups(uint256[] memory _whiteListGroups) external {
        _isVaultAdmin();
        for (uint256 i = 0; i < _whiteListGroups.length; i++) {
            if (!isWhiteListGroupPresent[_whiteListGroups[i]]) {
                whiteListGroups.push(_whiteListGroups[i]);
                isWhiteListGroupPresent[_whiteListGroups[i]] = true;
            }
        }
    }

    function removeWhiteListGroups(uint256[] memory _whiteListGroups) external {
        _isVaultAdmin();
        for (uint256 i = 0; i < _whiteListGroups.length; i++) {
            isWhiteListGroupPresent[_whiteListGroups[i]] = false;
        }
    }

    function setTokenDetails(string memory _tokenName, string memory _symbol)
        external
    {
        require(msg.sender == owner, "unauthorized");
        setupToken(_tokenName, _symbol);
    }

    function setVaultSlippage(uint256 _slippage) external onlyNormalMode {
        IAPContract(APContract).setVaultSlippage(_slippage);
    }

    /// @dev Function to manage the assets supported by the vaults.
    /// @param _enabledDepositAsset List of assets to be enabled in Deposit assets.
    /// @param _enabledWithdrawalAsset List of assets to be enabled in Withdrawal assets.
    /// @param _disabledDepositAsset List of assets to be disabled in Deposit assets.
    /// @param _disabledWithdrawalAsset List of assets to be disabled in Withdrawal assets.
    function setVaultAssets(
        address[] calldata _enabledDepositAsset,
        address[] calldata _enabledWithdrawalAsset,
        address[] calldata _disabledDepositAsset,
        address[] calldata _disabledWithdrawalAsset
    ) external onlyNormalMode {
        require(msg.sender == vaultAdmin, "unauthorized");
        IAPContract(APContract).setVaultAssets(
            _enabledDepositAsset,
            _enabledWithdrawalAsset,
            _disabledDepositAsset,
            _disabledWithdrawalAsset
        );
    }

    /// @dev Function to change the APS Manager of the Vault.
    /// @param _vaultAdmin Address of the new APS Manager.
    function changeVaultAdmin(address _vaultAdmin) external onlyNormalMode {
        require(
            IAPContract(APContract).yieldsterDAO() == msg.sender ||
                vaultAdmin == msg.sender,
            "unauthorized"
        );
        vaultAdmin = _vaultAdmin;
        IAPContract(APContract).changeVaultAdmin(_vaultAdmin);
    }

    /// @dev Function to set smart strategies to vault.
    /// @param _smartStrategyAddress Address of smart Strategy.
    /// @param _type Type of smart strategy.
    function setVaultSmartStrategy(address _smartStrategyAddress, uint256 _type)
        public
    {
        _isVaultAdmin();
        IAPContract(APContract).setVaultSmartStrategy(
            _smartStrategyAddress,
            _type
        );
    }

    /// @dev Function to Deposit assets into the Vault.
    /// @param _tokenAddress Address of the deposit token.
    /// @param _amount Amount of deposit token.
    function deposit(address _tokenAddress, uint256 _amount)
        external
        onlyNormalMode
        whenNotPaused
    {
        _isWhiteListed();
        require(
            IAPContract(APContract).isDepositAsset(_tokenAddress),
            "Not an approved deposit asset"
        );

        //TODO management fee
        //calculate feeAmountFirst
       
       uint256 amountForFees;
        // uint256 amountForFees = managementFeeCleanUp(_tokenAddress,1);
        // require(amountForFees == 0,"not 0");
        // revert("after management reached");
        //   managementFeeCleanUp(_tokenAddress);

        (bool result, ) = IAPContract(APContract)
            .getDepositStrategy()
            .delegatecall(
                abi.encodeWithSignature(
                    "deposit(address,uint256,uint256)",
                    _tokenAddress,
                    _amount,
                    amountForFees
                )
            );
        revertDelegate(result);
    }

    /// @dev Function to Withdraw assets from the Vault.
    /// @param _tokenAddress Address of the withdraw token.
    /// @param _shares Amount of Vault token shares.
    function withdraw(address _tokenAddress, uint256 _shares)
        external
        onlyNormalMode
        whenNotPaused
    {
        _isWhiteListed();
        require(
            IAPContract(APContract).isWithdrawalAsset(_tokenAddress),
            "Not an approved Withdrawal asset"
        );
        require(
            balanceOf(msg.sender) >= _shares,
            "You don't have enough shares"
        );

        //TODO management fee cleanup
        // uint256 _amountForFees = managementFeeCleanUp(_tokenAddress,2);
        // tokenBalances.setTokenBalance(
        //     _tokenAddress,
        //     tokenBalances.getTokenBalance(_tokenAddress).sub(_amountForFees)
        // );
        //reduce share value based on the fee calculated

        // managementFeeCleanUp(_tokenAddress);
        //TODO update token balance count
        (bool result, ) = IAPContract(APContract)
            .getWithdrawStrategy()
            .delegatecall(
                abi.encodeWithSignature(
                    "withdraw(address,uint256)",
                    _tokenAddress,
                    _shares
                )
            );
        revertDelegate(result);
    }

    function setBeneficiaryAndPercentage(
        address _beneficiary,
        uint256 _percentage
    ) external onlyNormalMode {
        _isVaultAdmin();
        strategyBeneficiary = _beneficiary;
        strategyPercentage = _percentage;
    }

    // /// @dev Function to Withdraw shares from the Vault.
    // /// @param _shares Amount of Vault token shares.
    // function withdraw(uint256 _shares) external onlyNormalMode {
    //     _isWhiteListed();
    //     require(
    //         balanceOf(msg.sender) >= _shares,
    //         "You don't have enough shares"
    //     );

    //     //TODO management fee cleanup
    //     // managementFeeCleanUp();

    //     (bool result, ) = IAPContract(APContract)
    //     .getWithdrawStrategy()
    //     .delegatecall(abi.encodeWithSignature("withdraw(uint256)", _shares));
    //     revertDelegate(result);
    // }



    /// @dev Function to deposit/withdraw vault assets to protocol
    /// @param _poolAddress Address of the protocol
    /// @param _instruction Encoded instruction to perform protocol deposit of vault tokens
    /// @param _amount Amount to be deposited to the protocol
    /// @param _fromToken Deposit token address
    /// @param _returnToken Address of the token returned by the protocol
    function protocolInteraction(
        address _poolAddress,
        bytes calldata _instruction,
        uint256 _amount,
        address _fromToken,
        address _returnToken
    ) external onlyNormalMode whenNotPaused {
        require(_poolAddress != address(0), " Pool address is zero address");
        require(_amount<=tokenBalances.getTokenBalance(_fromToken),"Not enough token present");
        require( IAPContract(APContract).yieldsterDAO() == msg.sender,"only Yieldster Admin can initiaite this transaction");

        //TODO from token 0address, to token 0 address
    
        _approveToken(_fromToken, _poolAddress, _amount);
        uint256 returnTokenAmountBefore = IERC20(_returnToken).balanceOf(
            address(this)
        );
        addToAssetList(_returnToken);
        (bool result, ) = _poolAddress.call(_instruction);
        uint256 returnTokenAmountAfter = IERC20(_returnToken).balanceOf(
            address(this)
        );
        tokenBalances.setTokenBalance(
            _fromToken,
            tokenBalances.getTokenBalance(_fromToken).sub(_amount)
        );
        uint256 amount = returnTokenAmountAfter.sub(returnTokenAmountBefore);
        tokenBalances.setTokenBalance(
            _returnToken,
            tokenBalances.getTokenBalance(_returnToken).add(amount)
        );
        revertDelegate(result);
    }

    /// @dev Function to get list of all the assets deposited to the vault
    function getAssetList() public view returns (address[] memory) {
        return assetList;
    }

    /// @dev Function to exchange tokens using 0x exchange
    /// @param _toAddress Address of the exchange to token obtained from 0x exchange
    /// @param _fromToken Address of the exchange from token
    /// @param _amount Exchange amount
    /// @param _instruction Encoded exchange instruction from 0x
    function exchangeTokenUsing0x(
        address _toAddress,
        address _fromToken,
        uint256 _amount,
        bytes calldata _instruction
    ) external {
        _approveToken(_fromToken, _toAddress, _amount);
        (bool result, ) = _toAddress.call(_instruction);
        revertDelegate(result);
    }

    /// @dev Function to exchange token using Yieldster exchanges
    /// @param _fromToken Address of the exchange from token
    /// @param _toToken Address of the exchange to token
    /// @param _amount Exchange amount
    /// @param _slippageSwap Acceptable slippage percentage(50 == 0.5%)
    function exchangeToken(
        address _fromToken,
        address _toToken,
        uint256 _amount,
        uint256 _slippageSwap
    ) public whenNotPaused returns (uint256) {

        require(_amount<=tokenBalances.getTokenBalance(_fromToken),"Not enough token present");
        uint256 exchangeReturn;
        IExchangeRegistry exchangeRegistry = IExchangeRegistry(
            IAPContract(APContract).exchangeRegistry()
        );
        address exchange = exchangeRegistry.getPair(_fromToken, _toToken);
        require(exchange != address(0), "Exchange pair not present");
        addToAssetList(_toToken);
        uint256 minReturn = calculateSlippage(
            _fromToken,
            _toToken,
            _amount,
            _slippageSwap
        );

        _approveToken(_fromToken, exchange, _amount);
        exchangeReturn = IExchange(exchange).swap(
            _fromToken,
            _toToken,
            _amount,
            minReturn
        );
        tokenBalances.setTokenBalance(
            _fromToken,
            tokenBalances.getTokenBalance(_fromToken).sub(_amount)
        );
       
        tokenBalances.setTokenBalance(
            _toToken,
            tokenBalances.getTokenBalance(_toToken).add(exchangeReturn)
        );
        return exchangeReturn;
    }

    /// @dev function to get minimum return amount accordin to slippage
    function calculateSlippage(
        address fromToken,
        address toToken,
        uint256 amount,
        uint256 slippagePercent
    ) internal view returns (uint256) {
        uint256 fromTokenUSD = IAPContract(APContract).getUSDPrice(fromToken);
        uint256 toTokenUSD = IAPContract(APContract).getUSDPrice(toToken);
        uint256 fromTokenAmountDecimals = IHexUtils(
            IAPContract(APContract).stringUtils()
        ).toDecimals(fromToken, amount);

        uint256 expectedToTokenDecimal = (
            fromTokenAmountDecimals.mul(fromTokenUSD)
        ).div(toTokenUSD);
        uint256 expectedToToken = IHexUtils(
            IAPContract(APContract).stringUtils()
        ).fromDecimals(toToken, expectedToTokenDecimal);
        uint256 minReturn = expectedToToken - //SLIPPAGE
            expectedToToken.mul(slippagePercent).div(10000);
        return minReturn;
    }



    function managementFeeCleanUp(address _tokenAddress,uint256 _type) public returns(uint256){
        address[] memory managementFeeStrategies = IAPContract(APContract)
        .getVaultManagementFee();
        uint256 sum;
        for (uint256 i = 0; i < managementFeeStrategies.length; i++) {
            (bool result,bytes memory data) = managementFeeStrategies[i].delegatecall(
                abi.encodeWithSignature("executeSafeCleanUp(address,uint256)",_tokenAddress,_type)
            );
            if(result){
                uint256 value = abi.decode(data,(uint256));
                sum = sum.add(value);
            }else{
                revert("call failed");
            }
        }
        return sum;
    }

    




    modifier onlyNormalMode() {
        _onlyNormalMode();
        _;
    }

    function _isVaultAdmin() private view {
        require(msg.sender == vaultAdmin, "not vaultAdmin");
    }

    function _isYieldsterGOD() private view {
        require(
            msg.sender == IAPContract(APContract).yieldsterGOD(),
            "unauthorized"
        );
    }

    /// @dev Function that Disables vault interactions in case of Emergency Break and Emergency Exit.
    function _onlyNormalMode() private view {
        if (emergencyConditions == 1) {
            _isYieldsterGOD();
        } else if (emergencyConditions == 2) {
            revert("safe inactive");
        }
    }


    receive() external payable whenNotPaused {
        uint256 _share;
        addToAssetList(eth);

        


        uint256 Bal = tokenBalances.getTokenBalance(
            eth
        );
        uint256 ethBal = address(this).balance;
        uint256 amountBal = ethBal - Bal;
        updateTokenBalance(
            eth,
            amountBal,
            true
        );
        if (totalSupply() == 0) {
            _share = IHexUtils(IAPContract(APContract).stringUtils())
                .toDecimals(
                    wEth,
                    amountBal
                );
        } else {
            _share = getMintValue(
                getDepositNAV(
                    wEth,
                    amountBal
                )
            );
        }
        _mint(msg.sender, _share);
    }

    /// @dev Function to perform operation on Receivel of ERC1155 token from Yieldster Strategy Minter.
    function onERC1155Received(
        address,
        address,
        uint256 id,
        uint256,
        bytes calldata data
    ) override virtual external onlyNormalMode returns (bytes4) {
        // managementFeeCleanUp();
        if (id == 0) {
            require(
                IAPContract(APContract).safeMinter() == msg.sender,
                "Only Safe Minter"
            );
            (bool success, ) = IAPContract(APContract).safeUtils().delegatecall(
                data
            );
            revertDelegate(success);
        } else if (id == 2) {
            require(
                IAPContract(APContract).getStrategyFromMinter(msg.sender) ==
                    IAPContract(APContract).getDepositStrategy(),
                "Not Deposit strategy"
            );
            (bool success, ) = IAPContract(APContract)
                .getStrategyFromMinter(msg.sender)
                .delegatecall(data);
            revertDelegate(success);
        } else if (id == 3) {
            require(
                IAPContract(APContract).getStrategyFromMinter(msg.sender) ==
                    IAPContract(APContract).getWithdrawStrategy(),
                "Not Withdraw strategy"
            );
            (bool success, ) = IAPContract(APContract)
                .getStrategyFromMinter(msg.sender)
                .delegatecall(data);
            revertDelegate(success);
        }
        return
            bytes4(
                keccak256(
                    "onERC1155Received(address,address,uint256,uint256,bytes)"
                )
            );
    }


    function toPause() external {
        _isVaultAdmin();
        _pause();
    }

    function unPause() external  {
        _isVaultAdmin();
        _unpause();
    }
}
