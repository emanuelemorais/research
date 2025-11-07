"use client"
import { Card } from "@/components/ui/card"
import { useAccount, useReadContract } from 'wagmi';
import Vault from "../../abi/Vault.json"
import { formatEther, formatUnits } from "viem";
import { memo } from "react";


const DashboardPage = memo(function DashboardPage() {
  const { address } = useAccount();

  const { data: ethBalance } = useReadContract({
    address: process.env.NEXT_PUBLIC_VAULT_ADDRESS as `0x${string}`,
    abi: Vault.abi,
    functionName: 'balanceOfToken',
    args: [address!, process.env.NEXT_PUBLIC_NATIVE_ADDRESS as `0x${string}`],
    query: {
      enabled: !!address,
      refetchInterval: 30000, 
      staleTime: 10000, 
    },
  });

  const { data: usdBalance } = useReadContract({
    address: process.env.NEXT_PUBLIC_VAULT_ADDRESS as `0x${string}`,
    abi: Vault.abi,
    functionName: 'balanceOfToken',
    args: [address!, process.env.NEXT_PUBLIC_USD_TOKEN_ADDRESS as `0x${string}`],
    query: {
      enabled: !!address,
      refetchInterval: 30000,
      staleTime: 10000,
    },
  });

  const { data: wbtcBalance } = useReadContract({
    address: process.env.NEXT_PUBLIC_VAULT_ADDRESS as `0x${string}`,
    abi: Vault.abi,
    functionName: 'balanceOfToken',
    args: [address!, process.env.NEXT_PUBLIC_WBTC_TOKEN_ADDRESS as `0x${string}`],
    query: {
      enabled: !!address,
      refetchInterval: 30000,
      staleTime: 10000,
    },
  });


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Gerencie seus ativos de forma descentralizada</p>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Saldo depositado</h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">ETH</span>
            <span className="font-semibold">{ethBalance && typeof ethBalance === 'bigint' ? Number(formatEther(ethBalance)) : "0.0000"} ETH</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">USD</span>
            <span className="font-semibold">{usdBalance && typeof usdBalance === 'bigint' ? Number(formatUnits(usdBalance, 18)) : "0.0000"} USD</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">WBTC</span>
            <span className="font-semibold">{wbtcBalance && typeof wbtcBalance === 'bigint' ? Number(formatUnits(wbtcBalance, 8)) : "0.00"} WBTC</span>
          </div>
        </div>
      </Card>
    </div>
  )
});

export default DashboardPage;
