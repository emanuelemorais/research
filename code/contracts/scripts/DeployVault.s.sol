// SPDX-License-Identifier: MIT

pragma solidity ^0.8.27;

import {Script} from "forge-std-1.11.0/src/Script.sol";
import {console} from "forge-std-1.11.0/src/console.sol";
import {Vault} from "../src/Vault.sol";
import {TokenFactory} from "../src/TokenFactory.sol";
import {BaseToken} from "../src/BaseToken.sol";

contract DeployVault is Script {
    Vault public vault;


    function run() external {
        console.log("Starting Vault deployment on chain id:", block.chainid);

        address tokenFactoryAddress = 0xf850742E5952b4Cd74eB96034a9725745fE2387C; 
        
        vm.startBroadcast();

        vault = new Vault(msg.sender);
        console.log(" Vault deployed at:", address(vault));

        TokenFactory tokenFactory = TokenFactory(tokenFactoryAddress);
        address wbtcAddress = tokenFactory.getToken("WBTC");
        address usdAddress = tokenFactory.getToken("USD");
        address nativeAddress = address(0); // ETH nativo

        console.log("=== TOKEN ADDRESSES ===");
        console.log("TokenFactory:", tokenFactoryAddress);
        console.log("WBTC Token:", wbtcAddress);
        console.log("USD Token:", usdAddress);
        console.log("Native ETH:", nativeAddress);

        console.log("=== CONFIGURING PRICE FEEDS ===");
        
        // ETH nativo - ETH/USD price feed
        address ethToUsdPriceFeed = 0x694AA1769357215DE4FAC081bf1f309aDC325306;
        uint256 priceFeedDecimals = 8; // Price feeds usam 8 decimais
        
        vault.setTokenPriceFeed(nativeAddress, ethToUsdPriceFeed, 18);
        console.log(" ETH price feed configured");

        // WBTC - BTC/USD price feed
        address wbtcPriceFeed = 0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43;
        vault.setTokenPriceFeed(wbtcAddress, wbtcPriceFeed, 8);
        console.log(" WBTC price feed configured");

        // USD - não precisa de price feed (preço fixo 1 USD = 1 USD)
        vault.setUSDToken(usdAddress, 18); // USD token usa 18 decimais
        console.log(" USD token configured");

        console.log("=== CONFIGURATIONS COMPLETE ===");

        console.log("=== ADD LIQUIDITY TO THE VAULT ===");
        
        // vault.addLiquidity{value: 1 ether}(nativeAddress, 1 ether);
        // console.log("✅ Native ETH liquidity added: 1 ETH");
        
        BaseToken wbtcToken = BaseToken(wbtcAddress);
        uint256 wbtcAmount = 5 * 10**8; // 1 WBTC (8 decimais)
        uint256 wbtcBalance = wbtcToken.balanceOf(msg.sender);
        console.log("WBTC balance:", wbtcBalance);

        wbtcToken.approve(address(vault), wbtcAmount);
        vault.addLiquidity(wbtcAddress, wbtcAmount);
        console.log("WBTC liquidity added: 1 WBTC");
        
        BaseToken usdToken = BaseToken(usdAddress);
        uint256 usdAmount = 1000 * 10**18; // 1000 USD (18 decimais)
        usdToken.approve(address(vault), usdAmount);
        vault.addLiquidity(usdAddress, usdAmount);
        console.log("USD liquidity added: 1000 USD");
        
        console.log("=== LIQUIDITY ADDED COMPLETE ===");


        vm.stopBroadcast();

        console.log("=== VAULT DEPLOYMENT COMPLETE ===");
        console.log("Vault Address:", address(vault));
        console.log("TokenFactory Address:", tokenFactoryAddress);
        console.log("WBTC Token:", wbtcAddress);
        console.log("USD Token:", usdAddress);
        console.log("Owner:", msg.sender);
    }
}