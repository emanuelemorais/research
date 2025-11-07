// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AggregatorV3Interface} from "@chainlink/contracts/shared/interfaces/AggregatorV3Interface.sol";
import {ReentrancyGuard} from "@openzeppelin-contracts-5.4.0/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin-contracts-5.4.0/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin-contracts-5.4.0/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin-contracts-5.4.0/access/Ownable.sol";

// Interface customizada para tokens com symbol
interface IERC20WithSymbol is IERC20 {
    function symbol() external view returns (string memory);
}

contract Vault is ReentrancyGuard, Ownable {    
    using SafeERC20 for IERC20;

    address public constant NATIVE = address(0);
    mapping(address => mapping(address => uint256)) public balanceOfToken; 
    mapping(address => uint256) public poolLiquidity; 
    
    // Mapeamento de tokens para price feeds
    mapping(address => AggregatorV3Interface) public tokenPriceFeeds;
    mapping(address => uint256) public tokenDecimals;
    mapping(address => bool) public isTokenSupported;
    
    // Eventos para configuração de tokens
    event TokenPriceFeedSet(address indexed token, address indexed priceFeed, uint256 decimals);
    event TokenSupportToggled(address indexed token, bool supported);

    event Deposit(address indexed user, address indexed token, uint256 amount);
    event Withdraw(address indexed user, address indexed token, address indexed to, uint256 amount);
    event TransferInternal(address indexed from, address indexed to, address indexed token, uint256 amount);
    event Swap(address indexed user, address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOut);
    event LiquidityAdded(address indexed token, uint256 amount);
    event LiquidityRemoved(address indexed token, uint256 amount);
    event NativeReceived(address indexed user, uint256 amount);
    event USDTokenSet(address indexed token, uint256 decimals);

    constructor(address initialOwner) Ownable(initialOwner) { }

    receive() external payable {
        emit NativeReceived(msg.sender, msg.value);
    }
    
    /**
     * @dev Configura um price feed para um token
     * @param token Endereço do token
     * @param priceFeed Endereço do price feed do Chainlink
     * @param decimals Número de decimais do price feed
     */
    function setTokenPriceFeed(address token, address priceFeed, uint256 decimals) external onlyOwner {
        require(priceFeed != address(0), "INVALID_PRICE_FEED");
        require(decimals > 0, "INVALID_DECIMALS");
        
        tokenPriceFeeds[token] = AggregatorV3Interface(priceFeed);
        tokenDecimals[token] = decimals;
        isTokenSupported[token] = true;
        
        emit TokenPriceFeedSet(token, priceFeed, decimals);
    }

    function setUSDToken(address token, uint256 decimals) external onlyOwner {
        require(token != address(0), "INVALID_TOKEN");
        require(decimals > 0, "INVALID_DECIMALS");
        
        tokenDecimals[token] = decimals;
        isTokenSupported[token] = true;
        
        emit USDTokenSet(token, decimals);
    }
    
    /**
     * @dev Verifica se um token é suportado
     * @param token Endereço do token
     * @return true se o token é suportado
     */
    function checkTokenSupported(address token) external view returns (bool) {
        return isTokenSupported[token];
    }
    
    /**
     * @dev Obtém informações do price feed de um token
     * @param token Endereço do token
     * @return priceFeed Endereço do price feed
     * @return decimals Número de decimais do price feed
     * @return supported Se o token é suportado
     */
    function getTokenPriceFeedInfo(address token) external view returns (
        address priceFeed,
        uint256 decimals,
        bool supported
    ) {
        return (
            address(tokenPriceFeeds[token]),
            tokenDecimals[token],
            isTokenSupported[token]
        );
    }

    function addLiquidity(address token, uint256 amount) external payable onlyOwner nonReentrant {
        require(isTokenSupported[token], "TOKEN_NOT_SUPPORTED");
        
        if (token == NATIVE) {
            require(msg.value > 0, "NO_NATIVE_SENT");
            poolLiquidity[NATIVE] += msg.value;
            emit LiquidityAdded(NATIVE, msg.value);
        } else {
            IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
            poolLiquidity[token] += amount;
            emit LiquidityAdded(token, amount);
        }
    }

    function removeLiquidity(address token, uint256 amount) external onlyOwner nonReentrant {
        require(poolLiquidity[token] >= amount, "POOL_LIQ_LOW");
        poolLiquidity[token] -= amount;

        if (token == NATIVE) {
            payable(msg.sender).transfer(amount);
        } else {
            IERC20(token).safeTransfer(msg.sender, amount);
        }

        emit LiquidityRemoved(token, amount);
    }


    function deposit(address token, uint256 amount) external payable nonReentrant {
        require(isTokenSupported[token], "TOKEN_NOT_SUPPORTED");
        
        if (token == NATIVE) {
            require(msg.value > 0, "NO_NATIVE_SENT");
            balanceOfToken[msg.sender][NATIVE] += msg.value;
            emit Deposit(msg.sender, NATIVE, msg.value);
        } else {
            IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
            balanceOfToken[msg.sender][token] += amount;
            emit Deposit(msg.sender, token, amount);
        }
    }

    function withdraw(address token, uint256 amount, address to) external nonReentrant {
        require(isTokenSupported[token], "TOKEN_NOT_SUPPORTED");
        require(balanceOfToken[msg.sender][token] >= amount, "INSUFFICIENT_BAL");
        balanceOfToken[msg.sender][token] -= amount;

        if (token == NATIVE) {
            payable(to).transfer(amount);
        } else {
            IERC20(token).safeTransfer(to, amount);
        }

        emit Withdraw(msg.sender, token, to, amount);
    }

    function transferInternal(address token, address to, uint256 amount) external {
        require(isTokenSupported[token], "TOKEN_NOT_SUPPORTED");
        require(balanceOfToken[msg.sender][token] >= amount, "INSUFFICIENT_BAL");
        balanceOfToken[msg.sender][token] -= amount;
        balanceOfToken[to][token] += amount;
        emit TransferInternal(msg.sender, to, token, amount);
    }

    function swap(address buyToken, address sellToken, uint256 quantity)
        external
        nonReentrant
        returns (uint256 amountOut)
    {
        require(sellToken != buyToken, "SAME_TOKEN");
        require(quantity > 0, "INVALID_QUANTITY");        
        require(balanceOfToken[msg.sender][sellToken] >= quantity, "INSUFFICIENT_BALANCE");
        require(poolLiquidity[buyToken] > 0, "NO_LIQUIDITY");
        
        uint256 sellTokenPrice = getTokenPrice(sellToken);
        uint256 buyTokenPrice = getTokenPrice(buyToken);
        
        require(sellTokenPrice > 0 && buyTokenPrice > 0, "PRICE_NOT_AVAILABLE");
        

        amountOut = (quantity * sellTokenPrice * (10 ** tokenDecimals[buyToken])) / (buyTokenPrice * (10 ** tokenDecimals[sellToken]));
        
        require(poolLiquidity[buyToken] >= amountOut, "INSUFFICIENT_LIQUIDITY");
        
        balanceOfToken[msg.sender][sellToken] -= quantity;
        balanceOfToken[msg.sender][buyToken] += amountOut;
        
        poolLiquidity[sellToken] += quantity;
        poolLiquidity[buyToken] -= amountOut;
        
        emit Swap(msg.sender, sellToken, buyToken, quantity, amountOut);
    }
    
    /**
     * @dev Obtém o preço de um token usando os price feeds configurados
     * @param token Endereço do token (NATIVE para ETH, endereço do contrato para tokens ERC20)
     * @return Preço do token em USD (8 decimais)
     */
    function getTokenPrice(address token) public view returns (uint256) {
        require(isTokenSupported[token], "TOKEN_NOT_SUPPORTED");
        
        if (token == NATIVE) {
            AggregatorV3Interface priceFeed = tokenPriceFeeds[token];
            (, int256 price, , , ) = priceFeed.latestRoundData();
            return uint256(price);
        } else {
            if (isUSDToken(token)) {
                return 1 * 10**8; // 1 USD = 1 USD (8 decimais)
            }
            
            // Token ERC20 - usa price feed configurado
            AggregatorV3Interface priceFeed = tokenPriceFeeds[token];
            require(address(priceFeed) != address(0), "PRICE_FEED_NOT_SET");
            
            (, int256 price, , , ) = priceFeed.latestRoundData();
            return uint256(price);
        }
    }
    
    /**
     * @dev Verifica se um token é USD (por symbol)
     * @param token Endereço do token
     * @return true se o token é USD
     */
    function isUSDToken(address token) internal view returns (bool) {
        // Tentar chamar symbol() diretamente no contrato
        try this.getTokenSymbol(token) returns (string memory symbol) {
            return keccak256(abi.encodePacked(symbol)) == keccak256(abi.encodePacked("USD"));
        } catch {
            return false;
        }
    }
    
    /**
     * @dev Função externa para obter symbol do token
     * @param token Endereço do token
     * @return symbol do token
     */
    function getTokenSymbol(address token) external view returns (string memory) {
        return IERC20WithSymbol(token).symbol();
    }
    
    /**
     * @dev Calcula a taxa de câmbio entre dois tokens
     * @param buyToken Token de compra
     * @param sellToken Token de venda
     * @param quantity Quantidade do token de compra
     * @return amountOut Quantidade esperada da venda
     */
    function getExchangeRate(address buyToken, address sellToken, uint256 quantity) 
        external 
        view 
        returns (uint256 amountOut) 
    {
        uint256 buyTokenPrice = getTokenPrice(buyToken);
        uint256 sellTokenPrice = getTokenPrice(sellToken);
        
        if (buyTokenPrice == 0 || sellTokenPrice == 0) {
            return 0;
        }

        amountOut = (quantity * sellTokenPrice * (10 ** tokenDecimals[buyToken])) / (buyTokenPrice * (10 ** tokenDecimals[sellToken]));
        
        return amountOut;
    }
}