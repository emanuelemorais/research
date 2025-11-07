// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std-1.11.0/src/Test.sol";
import {Vault} from "../src/Vault.sol";
import {TokenFactory} from "../src/TokenFactory.sol";
import {BaseToken} from "../src/BaseToken.sol";
import {AggregatorV3Interface} from "@chainlink/contracts/shared/interfaces/AggregatorV3Interface.sol";

// Mock price feed for testing
contract MockPriceFeed is AggregatorV3Interface {
    int256 public price;
    uint8 public decimals;
    
    constructor(int256 _price, uint8 _decimals) {
        price = _price;
        decimals = _decimals;
    }
    
    function latestRoundData() external view returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    ) {
        return (1, price, block.timestamp, block.timestamp, 1);
    }
    
    function getRoundData(uint80) external pure returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    ) {
        revert("Not implemented");
    }
    
    function description() external pure returns (string memory) {
        return "Mock Price Feed";
    }
    
    function version() external pure returns (uint256) {
        return 1;
    }
}

contract TestVault is Test {
    Vault public vault;
    TokenFactory public tokenFactory;
    BaseToken public usdToken;
    BaseToken public wbtcToken;
    
    address public owner = address(0x1);
    address public user1 = address(0x2);
    address public user2 = address(0x3);
    
    MockPriceFeed public ethPriceFeed;
    MockPriceFeed public wbtcPriceFeed;
    
    function setUp() public {
        // Deploy mock price feeds
        ethPriceFeed = new MockPriceFeed(2000 * 10**8, 8); // $2000 ETH
        wbtcPriceFeed = new MockPriceFeed(60000 * 10**8, 8); // $60000 WBTC
        
        // Deploy contracts
        vm.startPrank(owner);
        
        tokenFactory = new TokenFactory();
        vault = new Vault(owner);
        
        // Create tokens
        address usdAddress = tokenFactory.createToken("USD", "USD", 18, 1000000 * 10**18);
        address wbtcAddress = tokenFactory.createToken("WBTC", "WBTC", 8, 1000 * 10**8);
        
        usdToken = BaseToken(usdAddress);
        wbtcToken = BaseToken(wbtcAddress);
        
        // Configure vault
        vault.setTokenPriceFeed(address(0), address(ethPriceFeed), 8); // ETH
        vault.setTokenPriceFeed(wbtcAddress, address(wbtcPriceFeed), 8); // WBTC
        vault.setUSDToken(usdAddress, 18); // USD
        
        // Add initial liquidity
        vault.addLiquidity{value: 10 ether}(address(0), 10 ether); // 10 ETH
        wbtcToken.approve(address(vault), 10 * 10**8);
        vault.addLiquidity(wbtcAddress, 10 * 10**8); // 10 WBTC
        usdToken.approve(address(vault), 10000 * 10**18);
        vault.addLiquidity(usdAddress, 10000 * 10**18); // 10000 USD
        
        vm.stopPrank();
        
        // Transfer tokens to users for testing
        vm.startPrank(owner);
        usdToken.transfer(user1, 1000 * 10**18); // 1000 USD
        wbtcToken.transfer(user1, 1 * 10**8); // 1 WBTC
        usdToken.transfer(user2, 1000 * 10**18); // 1000 USD
        wbtcToken.transfer(user2, 1 * 10**8); // 1 WBTC
        vm.stopPrank();
    }
    
    // ========== DEPOSIT TESTS ==========
    
    function testDepositETH() public {
        uint256 depositAmount = 1 ether;
        uint256 initialBalance = vault.balanceOfToken(user1, address(0));
        
        vm.startPrank(user1);
        vault.deposit{value: depositAmount}(address(0), depositAmount);
        vm.stopPrank();
        
        assertEq(vault.balanceOfToken(user1, address(0)), initialBalance + depositAmount);
    }
    
    function testDepositUSD() public {
        uint256 depositAmount = 100 * 10**18; // 100 USD
        uint256 initialBalance = vault.balanceOfToken(user1, address(usdToken));
        
        vm.startPrank(user1);
        usdToken.approve(address(vault), depositAmount);
        vault.deposit(address(usdToken), depositAmount);
        vm.stopPrank();
        
        assertEq(vault.balanceOfToken(user1, address(usdToken)), initialBalance + depositAmount);
    }
    
    function testDepositWBTC() public {
        uint256 depositAmount = 0.1 * 10**8; // 0.1 WBTC
        uint256 initialBalance = vault.balanceOfToken(user1, address(wbtcToken));
        
        vm.startPrank(user1);
        wbtcToken.approve(address(vault), depositAmount);
        vault.deposit(address(wbtcToken), depositAmount);
        vm.stopPrank();
        
        assertEq(vault.balanceOfToken(user1, address(wbtcToken)), initialBalance + depositAmount);
    }
    
    function testDepositFailsWithUnsupportedToken() public {
        address unsupportedToken = address(0x999);
        
        vm.startPrank(user1);
        vm.expectRevert("TOKEN_NOT_SUPPORTED");
        vault.deposit(unsupportedToken, 100);
        vm.stopPrank();
    }
    
    // ========== WITHDRAW TESTS ==========
    
    function testWithdrawETH() public {
        // First deposit some ETH
        uint256 depositAmount = 1 ether;
        vm.startPrank(user1);
        vault.deposit{value: depositAmount}(address(0), depositAmount);
        
        uint256 initialVaultBalance = address(vault).balance;
        uint256 initialUserBalance = user1.balance;
        
        vault.withdraw(address(0), depositAmount, user1);
        vm.stopPrank();
        
        assertEq(vault.balanceOfToken(user1, address(0)), 0);
        assertEq(user1.balance, initialUserBalance + depositAmount);
    }
    
    function testWithdrawUSD() public {
        // First deposit some USD
        uint256 depositAmount = 100 * 10**18; // 100 USD
        vm.startPrank(user1);
        usdToken.approve(address(vault), depositAmount);
        vault.deposit(address(usdToken), depositAmount);
        
        uint256 initialUserBalance = usdToken.balanceOf(user1);
        
        vault.withdraw(address(usdToken), depositAmount, user1);
        vm.stopPrank();
        
        assertEq(vault.balanceOfToken(user1, address(usdToken)), 0);
        assertEq(usdToken.balanceOf(user1), initialUserBalance + depositAmount);
    }
    
    function testWithdrawFailsInsufficientBalance() public {
        vm.startPrank(user1);
        vm.expectRevert("INSUFFICIENT_BAL");
        vault.withdraw(address(usdToken), 1000 * 10**18, user1); // Try to withdraw more than deposited
        vm.stopPrank();
    }
    
    // ========== TRANSFER TESTS ==========
    
    function testTransferInternal() public {
        // First deposit some USD
        uint256 depositAmount = 100 * 10**18; // 100 USD
        vm.startPrank(user1);
        usdToken.approve(address(vault), depositAmount);
        vault.deposit(address(usdToken), depositAmount);
        
        uint256 transferAmount = 50 * 10**18; // 50 USD
        uint256 initialUser1Balance = vault.balanceOfToken(user1, address(usdToken));
        uint256 initialUser2Balance = vault.balanceOfToken(user2, address(usdToken));
        
        vault.transferInternal(address(usdToken), user2, transferAmount);
        vm.stopPrank();
        
        assertEq(vault.balanceOfToken(user1, address(usdToken)), initialUser1Balance - transferAmount);
        assertEq(vault.balanceOfToken(user2, address(usdToken)), initialUser2Balance + transferAmount);
    }
    
    function testTransferInternalFailsInsufficientBalance() public {
        vm.startPrank(user1);
        vm.expectRevert("INSUFFICIENT_BAL");
        vault.transferInternal(address(usdToken), user2, 1000 * 10**18); // Try to transfer more than deposited
        vm.stopPrank();
    }
    
    // ========== SWAP TESTS ==========
    
    function testSwapUSDToWBTC() public {
        // First deposit some USD
        uint256 depositAmount = 1000 * 10**18; // 1000 USD
        vm.startPrank(user1);
        usdToken.approve(address(vault), depositAmount);
        vault.deposit(address(usdToken), depositAmount);
        
        uint256 swapAmount = 100 * 10**18; // 100 USD
        uint256 initialUSD = vault.balanceOfToken(user1, address(usdToken));
        uint256 initialWBTC = vault.balanceOfToken(user1, address(wbtcToken));
        
        // Get expected output
        uint256 expectedOutput = vault.getExchangeRate(address(usdToken), address(wbtcToken), swapAmount);
        
        vault.swap(address(wbtcToken), address(usdToken), swapAmount);
        vm.stopPrank();
        
        assertEq(vault.balanceOfToken(user1, address(usdToken)), initialUSD - swapAmount);
        assertEq(vault.balanceOfToken(user1, address(wbtcToken)), initialWBTC + expectedOutput);
    }
    
    function testSwapWBTCToUSD() public {
        // First deposit some WBTC
        uint256 depositAmount = 0.1 * 10**8; // 0.1 WBTC
        vm.startPrank(user1);
        wbtcToken.approve(address(vault), depositAmount);
        vault.deposit(address(wbtcToken), depositAmount);
        
        uint256 swapAmount = 0.01 * 10**8; // 0.01 WBTC
        uint256 initialUSD = vault.balanceOfToken(user1, address(usdToken));
        uint256 initialWBTC = vault.balanceOfToken(user1, address(wbtcToken));
        
        // Get expected output
        uint256 expectedOutput = vault.getExchangeRate(address(wbtcToken), address(usdToken), swapAmount);
        
        vault.swap(address(usdToken), address(wbtcToken), swapAmount);
        vm.stopPrank();
        
        assertEq(vault.balanceOfToken(user1, address(wbtcToken)), initialWBTC - swapAmount);
        assertEq(vault.balanceOfToken(user1, address(usdToken)), initialUSD + expectedOutput);
    }
    
    function testSwapFailsSameToken() public {
        vm.startPrank(user1);
        vm.expectRevert("SAME_TOKEN");
        vault.swap(address(usdToken), address(usdToken), 100);
        vm.stopPrank();
    }
    
    function testSwapFailsInsufficientBalance() public {
        vm.startPrank(user1);
        vm.expectRevert("INSUFFICIENT_BALANCE");
        vault.swap(address(wbtcToken), address(usdToken), 1000 * 10**18); // Try to swap more than deposited
        vm.stopPrank();
    }
    
    function testSwapFailsNoLiquidity() public {
        // Create a token with no liquidity
        vm.startPrank(owner);
        address newTokenAddress = tokenFactory.createToken("NEW", "NEW", 18, 1000 * 10**18);
        BaseToken newToken = BaseToken(newTokenAddress);
        vault.setUSDToken(newTokenAddress, 18);
        vm.stopPrank();
        
        // Transfer some tokens to user1
        vm.startPrank(owner);
        newToken.transfer(user1, 100 * 10**18);
        vm.stopPrank();
        
        // Try to swap to a token with no liquidity
        vm.startPrank(user1);
        newToken.approve(address(vault), 100 * 10**18);
        vault.deposit(newTokenAddress, 100 * 10**18);
        
        vm.expectRevert("NO_LIQUIDITY");
        vault.swap(address(usdToken), newTokenAddress, 10 * 10**18);
        vm.stopPrank();
    }
    
    // ========== PRICE FEED TESTS ==========
    
    function testGetTokenPrice() public {
        uint256 ethPrice = vault.getTokenPrice(address(0));
        uint256 wbtcPrice = vault.getTokenPrice(address(wbtcToken));
        uint256 usdPrice = vault.getTokenPrice(address(usdToken));
        
        assertTrue(ethPrice > 0, "ETH price should be > 0");
        assertTrue(wbtcPrice > 0, "WBTC price should be > 0");
        assertEq(usdPrice, 1 * 10**8, "USD price should be 1 USD");
    }
    
    function testGetExchangeRate() public {
        uint256 rate = vault.getExchangeRate(address(usdToken), address(wbtcToken), 1000 * 10**18);
        assertTrue(rate > 0, "Exchange rate should be > 0");
    }
    
    // ========== LIQUIDITY TESTS ==========
    
    function testAddLiquidity() public {
        uint256 initialLiquidity = vault.poolLiquidity(address(usdToken));
        
        vm.startPrank(owner);
        usdToken.approve(address(vault), 1000 * 10**18);
        vault.addLiquidity(address(usdToken), 1000 * 10**18);
        vm.stopPrank();
        
        assertEq(vault.poolLiquidity(address(usdToken)), initialLiquidity + 1000 * 10**18);
    }
    
    function testRemoveLiquidity() public {
        uint256 initialLiquidity = vault.poolLiquidity(address(usdToken));
        
        vm.startPrank(owner);
        vault.removeLiquidity(address(usdToken), 1000 * 10**18);
        vm.stopPrank();
        
        assertEq(vault.poolLiquidity(address(usdToken)), initialLiquidity - 1000 * 10**18);
    }
    
    // ========== EDGE CASES ==========
    
    function testDepositZeroAmount() public {
        vm.startPrank(user1);
        vm.expectRevert("NO_NATIVE_SENT");
        vault.deposit{value: 0}(address(0), 0);
        vm.stopPrank();
    }
    
    function testWithdrawToZeroAddress() public {
        // First deposit some USD
        uint256 depositAmount = 100 * 10**18;
        vm.startPrank(user1);
        usdToken.approve(address(vault), depositAmount);
        vault.deposit(address(usdToken), depositAmount);
        
        // Withdraw to zero address should still work (but not recommended)
        vault.withdraw(address(usdToken), depositAmount, address(0));
        vm.stopPrank();
        
        assertEq(vault.balanceOfToken(user1, address(usdToken)), 0);
    }
    
    function testMultipleUsers() public {
        // User1 deposits USD
        uint256 depositAmount1 = 100 * 10**18;
        vm.startPrank(user1);
        usdToken.approve(address(vault), depositAmount1);
        vault.deposit(address(usdToken), depositAmount1);
        vm.stopPrank();
        
        // User2 deposits WBTC
        uint256 depositAmount2 = 0.1 * 10**8;
        vm.startPrank(user2);
        wbtcToken.approve(address(vault), depositAmount2);
        vault.deposit(address(wbtcToken), depositAmount2);
        vm.stopPrank();
        
        // Check balances
        assertEq(vault.balanceOfToken(user1, address(usdToken)), depositAmount1);
        assertEq(vault.balanceOfToken(user2, address(wbtcToken)), depositAmount2);
        assertEq(vault.balanceOfToken(user1, address(wbtcToken)), 0);
        assertEq(vault.balanceOfToken(user2, address(usdToken)), 0);
    }
}
