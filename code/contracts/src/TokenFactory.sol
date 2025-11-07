// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./BaseToken.sol";

/**
 * @title TokenFactory
 * @dev Factory para criar tokens dinamicamente sem duplicação de código
 */
contract TokenFactory {
    address public owner;
    
    // Mapeia nome do token para endereço do contrato
    mapping(string => address) public tokens;
    string[] public tokenNames;
    
    event TokenCreated(string indexed name, address indexed tokenAddress, string symbol, uint8 decimals);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    constructor() {
        owner = msg.sender;
    }
    
    /**
     * @dev Cria um novo token
     * @param _name Nome único do token
     * @param _symbol Símbolo do token (ex: "USD", "BRL", "WBTC")
     * @param _decimals Número de decimais (padrão: 18, WBTC: 8)
     * @param _initialSupply Fornecimento inicial
     * @return Endereço do token criado
     */
    function createToken(
        string memory _name,
        string memory _symbol,
        uint8 _decimals,
        uint256 _initialSupply
    ) external onlyOwner returns (address) {
        require(tokens[_name] == address(0), "Token already exists");
        
        BaseToken newToken = new BaseToken(_symbol, _decimals, _initialSupply, msg.sender);
        address tokenAddress = address(newToken);
        
        tokens[_name] = tokenAddress;
        tokenNames.push(_name);
        
        emit TokenCreated(_name, tokenAddress, _symbol, _decimals);
        
        return tokenAddress;
    }
    
    /**
     * @dev Retorna o endereço de um token pelo nome
     */
    function getToken(string memory _name) external view returns (address) {
        return tokens[_name];
    }
    
    /**
     * @dev Retorna todos os nomes de tokens criados
     */
    function getAllTokenNames() external view returns (string[] memory) {
        return tokenNames;
    }
    
    /**
     * @dev Retorna o número total de tokens criados
     */
    function getTokenCount() external view returns (uint256) {
        return tokenNames.length;
    }
}
