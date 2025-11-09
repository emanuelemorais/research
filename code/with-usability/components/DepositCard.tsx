"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { ArrowDownLeft, Loader2 } from "lucide-react"
import { encodeFunctionData, parseUnits, formatUnits } from "viem"
import { usePrivy } from "@privy-io/react-auth"
import { useSmartWallets } from "@privy-io/react-auth/smart-wallets"
import { toast } from "sonner"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DepositConfirmationDialog } from "./Dialog/DepositConfirmationDialog"

import Vault from "../abi/Vault.json"
import BaseToken from "../abi/BaseToken.json"
import { acceptedTokens, getPublicClient, TOKEN_ADDRESSES, handleBalanceOnChain, handleAmountChange } from "@/lib/utils"
import { useAppContext } from "@/contexts/AppContext"

export function DepositCard() {
  const [selectedToken, setSelectedToken] = useState<keyof typeof TOKEN_ADDRESSES>("USD")
  const [amount, setAmount] = useState("")
  const [balance, setBalance] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  
  const { user, ready } = usePrivy();
  const { client } = useSmartWallets();
  const { sessionId } = useAppContext();

  const wallet = user?.linkedAccounts?.find((account) => account.type === 'smart_wallet')?.address as `0x${string}` | undefined;

  if (!wallet) {
    return <div>Carregando smart account…</div>;
  }

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

  const handleDeposit = async (): Promise<void> => {
    if (!ready || !user || !amount || Number(amount) <= 0) return;

    const tokenAddress = TOKEN_ADDRESSES[selectedToken];
    if (!tokenAddress) return;

    const publicClient = getPublicClient();
    let decimals = 18;

    // if (selectedToken !== "ETH") {
    //   try {
    //     decimals = await publicClient.readContract({
    //       address: tokenAddress,
    //       abi: BaseToken.abi,
    //       functionName: "decimals",
    //     }) as number;
    //   } catch (error) {
    //     console.error("Erro ao buscar decimais do token:", error);
    //     throw error;
    //   }
    // }

    const amountFormatted = parseUnits(amount, decimals);

    setLoading(true);

    try {
      const txHash = await client?.sendTransaction(
        {
          calls: [
            {
              to: tokenAddress,
              value: BigInt(0),
              data: encodeFunctionData({
                abi: BaseToken.abi,
                functionName: "approve",
                args: [
                  process.env.NEXT_PUBLIC_VAULT_ADDRESS as `0x${string}`,
                  amountFormatted
                ],
              }),
            },
            {
              to: process.env.NEXT_PUBLIC_VAULT_ADDRESS as `0x${string}`,
              value: BigInt(0),
              data: encodeFunctionData({
                abi: Vault.abi,
                functionName: "deposit",
                args: [
                  tokenAddress,
                  amountFormatted
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
      
        toast.success("Depósito realizado com sucesso!");
        
        // Salva a tarefa como concluída após sucesso
        await saveTaskCompleted(2); // Deposit taskId = 2
        
        const balance = await handleBalanceOnChain(wallet, selectedToken);
        if (balance !== undefined) {
          setBalance(balance);
        }
        
        // Limpar o campo de valor após sucesso
        setAmount("");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!wallet) return;
    const fetchBalance = async () => {
      const balance = await handleBalanceOnChain(wallet, selectedToken);
      if (balance !== undefined) {
        setBalance(balance);
      }
    };
    fetchBalance();
  }, [selectedToken, wallet])

  // Validação de saldo insuficiente
  useEffect(() => {
    if (amount && Number(amount) > balance) {
      toast.error(`Saldo insuficiente. Você possui ${balance.toFixed(4)} ${selectedToken} na carteira.`);
    }
  }, [amount, balance, selectedToken])

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  }

  return (
    <>

    <DepositConfirmationDialog
        open={showDialog}
        onClose={() => setShowDialog(false)}
        token={selectedToken}
        amount={amount}
        onConfirm={handleDeposit}
      />
      
    
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
            <ArrowDownLeft className="w-5 h-5 text-blue-700" />
          </div>
          <h2 className="text-xl font-semibold">Depositar Tokens</h2>
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
                Saldo na carteira: {balance.toFixed(4)} {selectedToken}
              </span>
            </div>
            <div className="relative">
              <Input
                type="text"
                inputMode="decimal"
                placeholder="0.0"
                value={amount}
                onChange={handleAmountChange}
                className={`pr-20 ${
                  amount && Number.parseFloat(amount) > balance ? 'border-red-500 bg-red-50' : ''
                }`}
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2"
                onClick={() => setAmount(balance.toFixed(4))}
              >
                MAX
              </Button>
            </div>
          </div>

          {/* {isLoadingApprove === true && (
            <div>
              <div className="w-full p-3 bg-yellow-100 border border-yellow-300 rounded text-yellow-700 text-sm text-center flex items-center justify-center">
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Aguarde a confirmação...
              </div>
            </div>
          )} */}


          <Button
            className="w-full bg-blue-700 cursor-pointer hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            size="lg"
            onClick={() => {
              saveButtonClick(2); // Deposit buttonId = 2
              setShowDialog(true);
            }}
            disabled={
              !amount || 
              Number(amount) <= 0 || 
              Number.parseFloat(amount) > balance || 
              loading
            }
          >
            {loading ?
              <>
                <Loader2 className="w-4 h-4 animate-spin ml-2" /> Aguarde a confirmação...
              </> :
              <>
                Depositar {selectedToken}
              </>
            }
          </Button>

        </div>
      </Card>

    </>
  )
}
