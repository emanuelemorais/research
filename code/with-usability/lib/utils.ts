import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { sepolia } from "viem/chains";
import { formatUnits, createPublicClient, http, parseUnits} from "viem";
import ethImage from "@/images/ethereum-eth-logo.svg";
import btcImage from "@/images/bitcoin-btc-logo.svg";
import usdImage from "@/images/dolar-usd-logo.svg";
import BaseToken from "@/abi/BaseToken.json";
import Vault from "@/abi/Vault.json";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getPublicClient() {
  return createPublicClient({
    transport: http(process.env.NEXT_PUBLIC_ALCHEMY_URL),
    chain: sepolia,
  });
}

export const acceptedTokens = [
  { symbol: "WBTC", name: "Wrapped Bitcoin", image: btcImage },
  { symbol: "USD", name: "Dolar Americano", image: usdImage }
]

export const TOKEN_ADDRESSES = {
  USD: process.env.NEXT_PUBLIC_USD_TOKEN_ADDRESS as `0x${string}` | undefined,
  WBTC: process.env.NEXT_PUBLIC_WBTC_TOKEN_ADDRESS as `0x${string}` | undefined,
};

export const handleDecimals = async (tokenAddress: `0x${string}`) => {

  //if (tokenAddress === TOKEN_ADDRESSES.ETH) return 18;
  
  const publicClient = getPublicClient();

  const decimals = await publicClient.readContract({
    address: tokenAddress,
    abi: BaseToken.abi,
    functionName: "decimals",
  }) as number;
  return decimals;
}

export const handleBalanceOnChain = async (wallet: `0x${string}`, selectedToken: keyof typeof TOKEN_ADDRESSES) => {
  if (!wallet) return;

  const publicClient = getPublicClient();

  // if (selectedToken === "ETH") {
  //   console.log("ETH")
  //   const saldo = await publicClient.getBalance({
  //     address: wallet,
  //   });
  //   return Number(formatUnits(saldo, 18))
  // }

  const tokenAddress = TOKEN_ADDRESSES[selectedToken];
  if (!tokenAddress) return 0;

  const saldo = await publicClient.readContract({
    address: tokenAddress,
    abi: BaseToken.abi,
    functionName: "balanceOf",
    args: [wallet],
  }) as bigint;

  const decimals = await handleDecimals(tokenAddress);

  const saldoFormatted = formatUnits(saldo, decimals);
  return Number(saldoFormatted)
}

export const handleBalanceOnContract = async (accountAddress: `0x${string}`, tokenAddress: `0x${string}`) => {
  if (!accountAddress || !tokenAddress) return 0;

  const publicClient = getPublicClient();

  const decimals = await handleDecimals(tokenAddress);
  const saldo = await publicClient.readContract({
    address: process.env.NEXT_PUBLIC_VAULT_ADDRESS as `0x${string}`,
    abi: Vault.abi,
    functionName: "balanceOfToken", 
    args: [accountAddress, tokenAddress],
  });

  return Number(formatUnits(saldo as bigint, decimals))
}

export const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const value = e.target.value;
  if (value === "" || /^\d*\.?\d*$/.test(value)) {
    return value;
  }
}

export const handleGetExchangeRate = async (fromAmount: string, fromToken: keyof typeof TOKEN_ADDRESSES, toToken: keyof typeof TOKEN_ADDRESSES) => {
  if (!fromAmount || !fromToken || !toToken) return 0;

  const publicClient = getPublicClient();
  
  const fromTokenAddress = TOKEN_ADDRESSES[fromToken];
  const toTokenAddress = TOKEN_ADDRESSES[toToken];
  if (!fromTokenAddress || !toTokenAddress) return 0;

  const fromAmountFormatted = parseUnits(fromAmount, await handleDecimals(fromTokenAddress));

  const exchangeRate = await publicClient.readContract({
    address: process.env.NEXT_PUBLIC_VAULT_ADDRESS as `0x${string}`,
    abi: Vault.abi,
    functionName: "getExchangeRate",
    args: [toTokenAddress, fromTokenAddress, fromAmountFormatted ],
  });

  const decimals = await handleDecimals(TOKEN_ADDRESSES[toToken] as `0x${string}`);
  return Number(formatUnits(exchangeRate as bigint, decimals)).toFixed(6)
}

export const handleGetLiquidity = async (toToken: keyof typeof TOKEN_ADDRESSES) => {
  const toTokenAddress = TOKEN_ADDRESSES[toToken];
  if (!toTokenAddress) return 0;

  const publicClient = getPublicClient();

  const liquidity = await publicClient.readContract({
    address: process.env.NEXT_PUBLIC_VAULT_ADDRESS as `0x${string}`,
    abi: Vault.abi,
    functionName: "poolLiquidity",
    args: [toTokenAddress],
  });

  const decimals = await handleDecimals(toTokenAddress);
  return Number(formatUnits(liquidity as bigint, decimals)).toFixed(6)
}