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
        uint80,
        int256 answer,
        uint256,
        uint256,
        uint80
    ) {
        return (1, price, block.timestamp, block.timestamp, 1);
    }
    
    function getRoundData(uint80) external pure returns (
        uint80,
        int256,
        uint256,
        uint256,
        uint80
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

contract TestVaultSwap is Test {
    Vault public vault;
    TokenFactory public tokenFactory;
    BaseToken public usdToken;
    BaseToken public wbtcToken;
    
    MockPriceFeed public ethPriceFeed;
    MockPriceFeed public wbtcPriceFeed;
    
    address public owner = address(0x1);
    address public user1 = address(0x2);
    address public user2 = address(0x3);
    
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
        
        // Configure vault with price feeds
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
    
    // ========== COMPLETE FLOW TESTS ==========
    
    function testCompleteFlow() public {
        // User1 deposits USD and WBTC
        vm.startPrank(user1);
        usdToken.approve(address(vault), 500 * 10**18);
        vault.deposit(address(usdToken), 500 * 10**18);
        
        wbtcToken.approve(address(vault), 0.5 * 10**8);
        vault.deposit(address(wbtcToken), 0.5 * 10**8);
        vm.stopPrank();
        
        // User1 swaps USD to WBTC
        vm.startPrank(user1);
        uint256 swapAmount = 100 * 10**18; // 100 USD
        uint256 initialWBTC = vault.balanceOfToken(user1, address(wbtcToken));
        vault.swap(address(wbtcToken), address(usdToken), swapAmount);
        vm.stopPrank();
        
        // Check that user1 has more WBTC
        assertTrue(vault.balanceOfToken(user1, address(wbtcToken)) > initialWBTC, "User1 should have more WBTC");
        
        // User1 transfers some WBTC to User2
        uint256 transferAmount = 0.1 * 10**8; // 0.1 WBTC
        vm.startPrank(user1);
        vault.transferInternal(address(wbtcToken), user2, transferAmount);
        vm.stopPrank();
        
        // Check transfer worked
        assertTrue(vault.balanceOfToken(user2, address(wbtcToken)) >= transferAmount, "User2 should have received WBTC");
        
        // User2 withdraws the WBTC
        uint256 user2WBTCBalance = vault.balanceOfToken(user2, address(wbtcToken));
        vm.startPrank(user2);
        vault.withdraw(address(wbtcToken), user2WBTCBalance, user2);
        vm.stopPrank();
        
        // Check withdrawal worked
        assertEq(vault.balanceOfToken(user2, address(wbtcToken)), 0, "User2 should have no WBTC in vault");
        assertTrue(wbtcToken.balanceOf(user2) > 0, "User2 should have WBTC in wallet");
    }
}
