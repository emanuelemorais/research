import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export const getTokenAddress = (token: string) => {
  switch (token) {
    case 'WBTC': return process.env.NEXT_PUBLIC_WBTC_TOKEN_ADDRESS!;
    case 'USD': return process.env.NEXT_PUBLIC_USD_TOKEN_ADDRESS!;
    default: return undefined;
  }
};

export const acceptedTokens = [
  { symbol: "WBTC", name: "Wrapped Bitcoin" },
  { symbol: "USD", name: "Dolar Americano" },
]

export const getTokenDecimals = (token: string) => {
  switch (token) {
    case 'WBTC': return 8;
    case 'USD': return 18;
    default: return 18;
  }
}
