"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Send } from "lucide-react"
import { getTokenAddress, acceptedTokens, getTokenDecimals } from "@/lib/utils"
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt  } from "wagmi"
import Vault from "../abi/Vault.json"
import { formatUnits, parseUnits } from "viem"
import { useAppContext } from "@/contexts/AppContext"
import { trackButtonClick } from "@/lib/track-click"
import { BUTTON_IDS } from "@/lib/button-ids"
import { trackTaskCompleted } from "@/lib/track-task-completed"


export function TransferCard() {
  const [selectedToken, setSelectedToken] = useState("ETH")
  const [amount, setAmount] = useState("")
  const [recipient, setRecipient] = useState("")
  const { address, isConnected } = useAccount()
  const { writeContract, data: approveHash } = useWriteContract();
  const { sessionId } = useAppContext();

  const handleTransfer = () => {
    trackButtonClick(BUTTON_IDS.TRANSFER, sessionId);
    
    const selectedTokenAddress = getTokenAddress(selectedToken);
    const decimals = getTokenDecimals(selectedToken);
    const amountWei = amount ? parseUnits(amount, decimals) : BigInt(0)
   
    writeContract({
      address: process.env.NEXT_PUBLIC_VAULT_ADDRESS as `0x${string}`,
      abi: Vault.abi,
      functionName: 'transferInternal',
      args: [selectedTokenAddress, recipient as `0x${string}`, amountWei],
    })
  }

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

  useEffect(() => {
    if (isApproveConfirmed) {
      refetchDepositBalance();
      trackTaskCompleted(BUTTON_IDS.TRANSFER, sessionId);
    }
  }, [isApproveConfirmed, refetchDepositBalance, sessionId]);


  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
          <Send className="w-5 h-5 text-primary" />
        </div>
        <h2 className="text-xl font-semibold">Transferir Tokens</h2>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Endereço do destinatário</Label>
          <Input
            placeholder="0x..."
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            className="font-mono text-sm"
          />
        </div>

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
              Saldo:  {depositBalance ? (selectedToken !== 'WBTC' ? Number(formatUnits(depositBalance as bigint, 18)).toFixed(4) : Number(formatUnits(depositBalance as bigint, 8)).toFixed(4)) : "0.0000"} {selectedToken}
            </span>
          </div>
          <div className="relative">
            <Input
              type="number"
              placeholder="0.0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="pr-20"
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
          onClick={handleTransfer}
          disabled={!amount || Number.parseFloat(amount) <= 0 || !recipient}
        >
          Transferir {selectedToken}
        </Button>
      </div>
    </Card>
  )
}
