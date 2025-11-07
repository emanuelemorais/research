// SPDX-License-Identifier: MIT

pragma solidity ^0.8.27;

import {Script} from "forge-std-1.11.0/src/Script.sol";
import {console} from "forge-std-1.11.0/src/console.sol";
import {TokenFactory} from "../src/TokenFactory.sol";
import {BaseToken} from "../src/BaseToken.sol";

contract DeployTokens is Script {
    TokenFactory public factory;
    BaseToken public usdToken;
    BaseToken public wbtcToken;

    function run() external {
        console.log("Starting token deployment on chain id:", block.chainid);

        vm.startBroadcast();

        // 1. Deploy TokenFactory
        factory = new TokenFactory();
        console.log("TokenFactory deployed at:", address(factory));

        // 2. Create USD Token (18 decimals, 1M initial supply)
        address usdAddress = factory.createToken(
            "USD",
            "USD", 
            18,
            1000000 * 10**18  // 1M USD tokens
        );
        usdToken = BaseToken(usdAddress);
        console.log("USD Token deployed at:", address(usdToken));
        console.log("USD Token symbol:", usdToken.symbol());
        console.log("USD Token decimals:", usdToken.decimals());
        console.log("USD Token total supply:", usdToken.totalSupply());

        // 3. Create WBTC Token (8 decimals, 1000 initial supply)
        address wbtcAddress = factory.createToken(
            "WBTC",
            "WBTC",
            8,
            1000 * 10**8  // 1000 WBTC tokens
        );
        wbtcToken = BaseToken(wbtcAddress);
        console.log("WBTC Token deployed at:", address(wbtcToken));
        console.log("WBTC Token symbol:", wbtcToken.symbol());
        console.log("WBTC Token decimals:", wbtcToken.decimals());
        console.log("WBTC Token total supply:", wbtcToken.totalSupply());

        // 4. Check initial balances (script should already have tokens)
        console.log("=== CHECKING INITIAL BALANCES ===");
        console.log("Script USD balance:", usdToken.balanceOf(msg.sender));
        console.log("Script WBTC balance:", wbtcToken.balanceOf(msg.sender));
        
        // 5. Verify script has sufficient tokens
        console.log("=== VERIFYING TOKEN BALANCES ===");
        
        uint256 usdRequired = 1000 * 10**18; // 1000 USD
        uint256 wbtcRequired = 1 * 10**8; // 1 WBTC (8 decimals)
        
        require(usdToken.balanceOf(msg.sender) >= usdRequired, "Insufficient USD balance");
        require(wbtcToken.balanceOf(msg.sender) >= wbtcRequired, "Insufficient WBTC balance");
        
        console.log("Script has sufficient tokens:");
        console.log("- USD:", usdToken.balanceOf(msg.sender) / 10**18, "tokens");
        console.log("- WBTC:", wbtcToken.balanceOf(msg.sender) / 10**8, "tokens");
        
        // Check deployer balances
        console.log("Deployer USD balance:", usdToken.balanceOf(msg.sender));
        console.log("Deployer WBTC balance:", wbtcToken.balanceOf(msg.sender));

        // 5. Display factory information
        console.log("Total tokens created:", factory.getTokenCount());
        console.log("All token names:");
        string[] memory tokenNames = factory.getAllTokenNames();
        for (uint i = 0; i < tokenNames.length; i++) {
            console.log("-", tokenNames[i]);
        }

        vm.stopBroadcast();

        console.log("=== DEPLOYMENT COMPLETE ===");
        console.log("Factory:", address(factory));
        console.log("USD Token:", address(usdToken));
        console.log("WBTC Token:", address(wbtcToken));
        console.log("Deployer:", msg.sender);
        console.log("");
        console.log("Tokens available to deployer:");
        console.log("- 1000+ USD");
        console.log("- 1+ WBTC");
    }
}
