// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std-1.11.0/src/Test.sol";
import {Vault} from "../src/Vault.sol";
import {TokenFactory} from "../src/TokenFactory.sol";
import {BaseToken} from "../src/BaseToken.sol";

contract TestVaultSimple is Test {
    Vault public vault;
    TokenFactory public tokenFactory;
    BaseToken public usdToken;
    BaseToken public wbtcToken;
    
    address public owner = address(0x1);
    address public user1 = address(0x2);
    address public user2 = address(0x3);
    
    function setUp() public {
        // Deploy contracts
        vm.startPrank(owner);
        
        tokenFactory = new TokenFactory();
        vault = new Vault(owner);
        
        // Create tokens
        address usdAddress = tokenFactory.createToken("USD", "USD", 18, 1000000 * 10**18);
        address wbtcAddress = tokenFactory.createToken("WBTC", "WBTC", 8, 1000 * 10**8);
        
        usdToken = BaseToken(usdAddress);
        wbtcToken = BaseToken(wbtcAddress);
        
        // Configure vault (simplified - no price feeds for now)
        vault.setUSDToken(usdAddress, 18); // USD
        vault.setUSDToken(wbtcAddress, 8); // WBTC (treating as USD for simplicity)
        
        // Add initial liquidity
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
}
