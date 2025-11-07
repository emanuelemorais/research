// SPDX-License-Identifier: MIT

pragma solidity ^0.8.27;

import {Script} from "forge-std-1.11.0/src/Script.sol";
import {console} from "forge-std-1.11.0/src/console.sol";
import {BaseToken} from "../src/BaseToken.sol";

contract QuickTokenCheck is Script {
    
    function run() external view {
        // CONFIGURE AQUI OS ENDEREÇOS
        address wallet = 0x2C6A5efD6Ad34F4DAFD05b14ba73805b66862797; // Endereço da carteira
        address token = 0x334952fa2Cb3Ba993d37ba23433dedb0c1B5a937;  // Endereço do token
        
        console.log("VERIFICACAO RAPIDA DE SALDO");
        console.log("Carteira:", wallet);
        console.log("Token:", token);
        
        if (wallet == address(0) || token == address(0)) {
            console.log("Configure os enderecos no script!");
            return;
        }
        
        BaseToken tokenContract = BaseToken(token);
        
        uint256 balance = tokenContract.balanceOf(wallet);
        uint8 decimals = tokenContract.decimals();
        
        console.log("Saldo:", balance);
        console.log("Decimais:", decimals);
        console.log("Saldo formatado:", balance / (10 ** decimals));
    }
}
