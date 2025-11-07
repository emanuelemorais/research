"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowDownLeft, Loader2 } from "lucide-react"
import { getTokenAddress, acceptedTokens } from "@/lib/utils"
import { useBalance, useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from "wagmi"
import Vault from "../abi/Vault.json"
import { parseEther } from "viem"
import BaseToken from "../abi/BaseToken.json"
import { useAppContext } from "@/contexts/AppContext"
import { trackButtonClick } from "@/lib/track-click"
import { BUTTON_IDS } from "@/lib/button-ids"
import { trackTaskCompleted } from "@/lib/track-task-completed"


export function DepositCard() {
  const [selectedToken, setSelectedToken] = useState("ETH")
  const [amount, setAmount] = useState("")
  const { address, isConnected } = useAccount()
  const { writeContract: writeApprove, data: approveHash } = useWriteContract();
  const { writeContract: writeDeposit, data: depositHash } = useWriteContract();
  const { sessionId } = useAppContext();

  const tokenAddress = getTokenAddress(selectedToken);
  
  const { data, isLoading, error } = useBalance({
    address: address as `0x${string}`,
    token: tokenAddress as `0x${string}`,
  });

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: BaseToken.abi,
    functionName: 'allowance',
    args: address && tokenAddress ? [address, process.env.NEXT_PUBLIC_VAULT_ADDRESS] : undefined,
    query: {
      enabled: !!address && !!tokenAddress && selectedToken !== 'ETH',
    },
  });

  const { isSuccess: isApproveConfirmed, status, isLoading: isLoadingApprove } = useWaitForTransactionReceipt({
    hash: approveHash,
  });

  const { isSuccess: isDepositConfirmed } = useWaitForTransactionReceipt({
    hash: depositHash,
  });

  useEffect(() => {
    if (isApproveConfirmed) {
      refetchAllowance();
    }
    console.log("status after", status)
    console.log("isLoadingApprove after", isLoadingApprove)
  }, [isApproveConfirmed, refetchAllowance]);

  // Rastreia quando o depósito é confirmado com sucesso
  useEffect(() => {
    if (isDepositConfirmed) {
      trackTaskCompleted(BUTTON_IDS.DEPOSIT, sessionId);
    }
  }, [isDepositConfirmed, sessionId]);

  
  const handleApprove = async () => {
    if (!isConnected || !tokenAddress) return;


    try {
      const amountWei = selectedToken === 'WBTC'
      ? BigInt(amount) * BigInt(10 ** 8)
      : parseEther(amount);

      await writeApprove({
        address: tokenAddress as `0x${string}`,
        abi: BaseToken.abi,
        functionName: 'approve',
        args: [process.env.NEXT_PUBLIC_VAULT_ADDRESS as `0x${string}`, amountWei],
      });


    } catch (err) {
      console.error("❌ Erro no aprove:", err);
    }
  };

  const handleDeposit = async () => {
    trackButtonClick(BUTTON_IDS.DEPOSIT, sessionId);
    
    const amountWei = selectedToken === 'WBTC'
      ? BigInt(amount) * BigInt(10 ** 8)
      : parseEther(amount);
      
    try {
      if (selectedToken === 'ETH') {
        await writeDeposit({
          address: process.env.NEXT_PUBLIC_VAULT_ADDRESS as `0x${string}`,
          abi: Vault.abi,
          functionName: 'deposit',
          args: [tokenAddress, amountWei],
          value: amountWei, 
        });
      } else {
        await writeDeposit({
          address: process.env.NEXT_PUBLIC_VAULT_ADDRESS as `0x${string}`,
          abi: Vault.abi,
          functionName: 'deposit',
          args: [tokenAddress, amountWei],
        });
      }
      
    } catch (err) {
      console.error("❌ Erro no depósito:", err);
    }
  };


  const needsApproval = selectedToken !== 'ETH' && allowance === BigInt(0);
  const canDeposit = selectedToken === 'ETH' || !needsApproval;


  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
          <ArrowDownLeft className="w-5 h-5 text-primary" />
        </div>
        <h2 className="text-xl font-semibold">Depositar Tokens</h2>
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

        <div className="space-y-2 mb-8">
          <div className="flex justify-between">
            <Label>Quantidade</Label>
            <span className="text-sm text-muted-foreground">
              Saldo na carteira: {data?.formatted ? Number(data?.formatted).toFixed(4) : "0.0000"} {selectedToken}
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
              onClick={() => setAmount(data?.formatted || "0")}
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
            onClick={handleApprove}
            disabled={!isConnected || !needsApproval || !amount || Number.parseFloat(amount) <= 0}
          >
          Aprovar Token
        </Button>


        <Button
          className="w-full"
          size="lg"
          onClick={handleDeposit}
          disabled={!isConnected || !amount || !canDeposit || Number.parseFloat(amount) <= 0}
        >
          Depositar {selectedToken}
        </Button>

      </div>
    </Card>
  )
}
