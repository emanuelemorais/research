"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { ArrowUpRight, Loader2 } from "lucide-react"
import { encodeFunctionData, parseUnits } from "viem"
import { usePrivy } from "@privy-io/react-auth"
import { useSmartWallets } from "@privy-io/react-auth/smart-wallets"
import { toast } from "sonner"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { WithdrawConfirmationDialog } from "./Dialog/WithdrawConfirmationDialog"

import Vault from "../abi/Vault.json"
import { acceptedTokens, TOKEN_ADDRESSES, handleDecimals, handleBalanceOnContract } from "@/lib/utils"
import { useAppContext } from "@/contexts/AppContext"

export function WithdrawCard() {
  const [selectedToken, setSelectedToken] = useState<keyof typeof TOKEN_ADDRESSES>("USD")
  const [amount, setAmount] = useState("")
  const [balance, setBalance] = useState<number>(0)
  const [openWithdrawConfirmationDialog, setOpenWithdrawConfirmationDialog] = useState(false)
  const { user, ready } = usePrivy();
  const { client } = useSmartWallets();
  const [loading, setLoading] = useState(false)
  const { sessionId } = useAppContext();

  const wallet = user?.linkedAccounts?.find((account) => account.type === 'smart_wallet')?.address as `0x${string}` | undefined;

  const getTokenDecimals = (token: keyof typeof TOKEN_ADDRESSES): number => {
    return token === "WBTC" ? 8 : token === "USD" ? 2 : 4;
  };

  const saveButtonClick = async (buttonId: number) => {
    if (!sessionId) return;
    try {
      await fetch("/api/button-click", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ buttonId, sessionId }),
      });
    } catch (error) {
      console.error("Error saving button click:", error);
      // Não bloqueia a funcionalidade se houver erro ao salvar o clique
    }
  };

  const saveTaskCompleted = async (taskId: number) => {
    if (!sessionId) return;
    try {
      await fetch("/api/task-completed", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ taskId, sessionId }),
      });
    } catch (error) {
      console.error("Error saving completed task:", error);
      // Não bloqueia a funcionalidade se houver erro ao salvar a tarefa
    }
  };

  const fetchBalance = async () => {
    if (!wallet) return;
    const balance = await handleBalanceOnContract(wallet, TOKEN_ADDRESSES[selectedToken] as `0x${string}`);
    if (balance !== undefined) {
      setBalance(balance);
    }
  };

  const handleWithdraw = async () => {
    try{
  
      setLoading(true);
      const amountFormatted = parseUnits(amount, await handleDecimals(TOKEN_ADDRESSES[selectedToken] as `0x${string}`));
      const txHash = await client?.sendTransaction(
        {
          calls: [
            {
              to: process.env.NEXT_PUBLIC_VAULT_ADDRESS as `0x${string}`,
              value: BigInt(0),
              data: encodeFunctionData({
                abi: Vault.abi,
                functionName: "withdraw",
                args: [
                  TOKEN_ADDRESSES[selectedToken] as `0x${string}`,
                  amountFormatted,
                  wallet!,
                ],
              }),
            },
          ]
        },
        {
          uiOptions: {
            showWalletUIs: false
          }
        }
      );
  
      await fetchBalance();
      toast.success("Saque realizado com sucesso!");
      
      // Salva a tarefa como concluída após sucesso
      await saveTaskCompleted(3); // Withdraw taskId = 3
      
      setAmount("");
    } catch (error) {
      console.error("Erro ao realizar saque:", error);
      toast.error("Erro ao realizar saque");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!wallet) return;
    fetchBalance();
  }, [selectedToken, wallet])

  return (
    <>
      <WithdrawConfirmationDialog
        open={openWithdrawConfirmationDialog}
        onClose={() => setOpenWithdrawConfirmationDialog(false)}
        token={selectedToken}
        totalDeposited={balance.toFixed(getTokenDecimals(selectedToken))}
        withdrawAmount={amount}
        onConfirm={handleWithdraw}
      />
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
            <ArrowUpRight className="w-5 h-5 text-blue-700" />
          </div>
          <h2 className="text-xl font-semibold">Retirar Tokens</h2>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Token</Label>
            <Select value={selectedToken} onValueChange={(value) => setSelectedToken(value as keyof typeof TOKEN_ADDRESSES)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {acceptedTokens.map((token) => (
                  <SelectItem key={token.symbol} value={token.symbol}>
                  <div className="flex items-center gap-2">
                    <Image src={token.image} alt={token.symbol} width={20} height={20} className="p-0.5" />
                    <span className="font-medium">{token.symbol}</span>
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
                Disponível: {balance.toFixed(getTokenDecimals(selectedToken))} {selectedToken}
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
                className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-700 hover:bg-blue-50 cursor-pointer"
                onClick={() => setAmount(balance.toFixed(getTokenDecimals(selectedToken)))}
              >
                MAX
              </Button>
            </div>
          </div>

          <Button
          
            className="w-full h-12 text-base font-semibold bg-blue-700 hover:bg-blue-600 text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            size="lg"
            onClick={() => {
              saveButtonClick(3); // Withdraw buttonId = 3
              setOpenWithdrawConfirmationDialog(true);
            }}
            disabled={(!amount || Number.parseFloat(amount) <= 0) || Number.parseFloat(amount) > balance || balance === 0 || loading}
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Aguarde a confirmação...</> : 'Sacar'}
          </Button>
        </div>
      </Card>
    </>
  )
}
