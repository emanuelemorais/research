"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowUpRight, Loader2 } from "lucide-react"
import { getTokenAddress, acceptedTokens, getTokenDecimals } from "@/lib/utils"
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import Vault from "../abi/Vault.json"
import { formatUnits, parseUnits } from "viem"
import { useAppContext } from "@/contexts/AppContext"
import { trackButtonClick } from "@/lib/track-click"
import { BUTTON_IDS } from "@/lib/button-ids"
import { trackTaskCompleted } from "@/lib/track-task-completed"


export function WithdrawCard() {
  const [selectedToken, setSelectedToken] = useState("ETH")
  const [amount, setAmount] = useState("")
  const { address } = useAccount()
  const { writeContract, data: approveHash } = useWriteContract();
  const { sessionId } = useAppContext();

  const { data: depositBalance, refetch: refetchDepositBalance } = useReadContract({
    address: process.env.NEXT_PUBLIC_VAULT_ADDRESS as `0x${string}`,
    abi: Vault.abi,
    functionName: 'balanceOfToken',
    args: [address!, getTokenAddress(selectedToken)],
    query: {
      enabled: !!address && !!getTokenAddress(selectedToken),
    },
  });

  const { isLoading: isLoadingApprove, isSuccess: isApproveConfirmed } = useWaitForTransactionReceipt({
    hash: approveHash,
  });

  const handleWithdraw = () => {
    trackButtonClick(BUTTON_IDS.WITHDRAW, sessionId);
    
    const decimals = getTokenDecimals(selectedToken);
    const amountWei = amount ? parseUnits(amount, decimals) : BigInt(0);
    
    writeContract({
      address: process.env.NEXT_PUBLIC_VAULT_ADDRESS as `0x${string}`,
      abi: Vault.abi,
      functionName: 'withdraw',
      args: [getTokenAddress(selectedToken), amountWei, address as `0x${string}`],
    })
  }

  useEffect(() => {
    if (isApproveConfirmed) {
      refetchDepositBalance();
      trackTaskCompleted(BUTTON_IDS.WITHDRAW, sessionId);
    }
  }, [isApproveConfirmed, refetchDepositBalance, sessionId]);

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
          <ArrowUpRight className="w-5 h-5 text-primary" />
        </div>
        <h2 className="text-xl font-semibold">Retirar Tokens</h2>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Token</Label>
          <Select value={selectedToken} onValueChange={setSelectedToken}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {acceptedTokens.map((token) => (
                <SelectItem key={token.symbol} value={token.symbol}>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{token.symbol}</span>
                    <span className="text-muted-foreground text-sm">- {token.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <Label>Quantidade</Label>
            <span className="text-sm text-muted-foreground">
              Disponível: {depositBalance ? (selectedToken !== 'WBTC' ? Number(formatUnits(depositBalance as bigint, 18)).toFixed(4) : Number(formatUnits(depositBalance as bigint, 8)).toFixed(4)) : "0.0000"} {selectedToken}
            </span>
          </div>
          <div className="relative">
            <Input
              type="number"
              placeholder="0.0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="pr-20 px-4 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
            />
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 -translate-y-1/2"
              onClick={() => setAmount(depositBalance ? (selectedToken !== 'WBTC' ? Number(formatUnits(depositBalance as bigint, 18)).toFixed(4) : Number(formatUnits(depositBalance as bigint, 8)).toFixed(4)) : "0.0000")}
            >
              MAX
            </Button>
          </div>
        </div>

        {isLoadingApprove === true && (
          <div>
            <div className="w-full p-3 bg-yellow-100 border border-yellow-300 rounded text-yellow-700 text-sm text-center flex items-center justify-center">
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Aguarde a confirmação...
            </div>
          </div>
        )}
        <Button
        
          className="w-full"
          size="lg"
          onClick={handleWithdraw}
          disabled={!amount || Number.parseFloat(amount) <= 0}
        >
          Retirar {selectedToken}
        </Button>
      </div>
    </Card>
  )
}
