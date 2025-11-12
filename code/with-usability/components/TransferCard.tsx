"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Loader2, Send } from "lucide-react"
import { encodeFunctionData, parseUnits } from "viem"
import { usePrivy } from "@privy-io/react-auth"
import { useSmartWallets } from "@privy-io/react-auth/smart-wallets"
import { toast } from "sonner"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TransferConfirmationDialog } from "./Dialog/TransferConfirmationDialog"

import Vault from "../abi/Vault.json"
import { acceptedTokens, TOKEN_ADDRESSES, handleBalanceOnContract, handleDecimals } from "@/lib/utils"
import { useAppContext } from "@/contexts/AppContext"

export function TransferCard() {
  const [email, setEmail] = useState("")
  const [amount, setAmount] = useState("")
  const [selectedToken, setSelectedToken] = useState<keyof typeof TOKEN_ADDRESSES>("USD")
  const [balance, setBalance] = useState<number>(0)
  const [showDialog, setShowDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [recipientWallet, setRecipientWallet] = useState<`0x${string}` | null>(null)
  const [displayName, setDisplayName] = useState<string | null>(null)

  const { user, ready } = usePrivy();
  const { client } = useSmartWallets();
  const { sessionId } = useAppContext();

  const wallet = user?.linkedAccounts?.find((account) => account.type === 'smart_wallet')?.address as `0x${string}` | undefined;

  const getTokenDecimals = (token: keyof typeof TOKEN_ADDRESSES): number => {
    return token === "WBTC" ? 8 : token === "USD" ? 2 : 4;
  };

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

  const handleResolveAndShowDialog = async () => {
    try {
      const response = await fetch("/api/resolve-wallet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
      
      if (response.status === 404) {
        toast.error("E-mail não encontrado, usuário não possui conta na plataforma");
        return;
      }

      if (!response.ok) {
        toast.error("Erro ao buscar usuário");
        return;
      }

      const data = await response.json();
      setRecipientWallet(data.walletAddress);
      setDisplayName(data.displayName);
      setShowDialog(true);

    } catch (error) {
      console.error("Erro ao resolver wallet:", error);
      toast.error("Erro ao buscar usuário");
    } 
  }

  const handleConfirmTransfer = async () => {
    try{
      setIsLoading(true);
      const tokenAddress = TOKEN_ADDRESSES[selectedToken];
      if (!tokenAddress || !recipientWallet || !amount) return;

      const decimals = await handleDecimals(tokenAddress);
      console.log("decimals", decimals);
      const amountFormatted = parseUnits(amount, decimals);

      const txHash = await client?.sendTransaction(
        {
          calls: [
            {
              to: process.env.NEXT_PUBLIC_VAULT_ADDRESS as `0x${string}`,
              value: BigInt(0),
              data: encodeFunctionData({
                abi: Vault.abi,
                functionName: "transferInternal",
                args: [
                  tokenAddress,
                  recipientWallet,
                  amountFormatted
                ],
              }),
            }
          ]
        },
        {
          uiOptions: {
            showWalletUIs: false
          }
        }
      );

      toast.success("Transferência realizada com sucesso!");
      
      // Salva a tarefa como concluída após sucesso
      await saveTaskCompleted(5); // Transfer taskId = 5
      
      await fetchBalance();
      
      // Limpar o campo de valor após sucesso
      setAmount("");
    } catch (error) {
      console.error("Erro ao transferir:", error);
      toast.error("Erro ao realizar transferência");
    } finally {
      setIsLoading(false);
    }
  }

  const fetchBalance = async () => {
    const balance = await handleBalanceOnContract(wallet, TOKEN_ADDRESSES[selectedToken] as `0x${string}`);
    if (balance !== undefined) {
      setBalance(balance);
    }
  };

  useEffect(() => {
    if (!wallet) return;
    fetchBalance();
  }, [selectedToken, wallet])

  // Validação de saldo insuficiente
  useEffect(() => {
    if (amount && Number.parseFloat(amount) > balance) {
      toast.error(`Saldo insuficiente. Você possui ${balance.toFixed(getTokenDecimals(selectedToken))} ${selectedToken} disponível.`);
    }
  }, [amount, balance, selectedToken])

  return (
    <>
    <TransferConfirmationDialog
      open={showDialog}
      onClose={() => {
        setShowDialog(false);
        setRecipientWallet(null);
        setDisplayName(null);
      }}
      email={email}
      token={selectedToken}
      amount={amount}
      onConfirm={handleConfirmTransfer}
    />
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
          <Send className="w-5 h-5 text-blue-700" />
        </div>
        <h2 className="text-xl font-semibold">Transferir Tokens</h2>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <span className="text-sm text-muted-foreground">E-mail do destinatário</span>
          <Input
            type="email"
            placeholder="exemplo@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <span className="text-sm text-muted-foreground">Token</span>
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
            <span className="text-sm text-muted-foreground">
              Saldo disponível: {balance.toFixed(getTokenDecimals(selectedToken))} {selectedToken}
            </span>
          </div>
          <div className="relative">
            <Input
              type="number"
              placeholder="0.0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={`pr-20 ${
                amount && Number.parseFloat(amount) > balance ? 'border-red-500 bg-red-50' : ''
              }`}
            />
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-700 hover:bg-blue-50"
              onClick={() => setAmount(balance.toFixed(getTokenDecimals(selectedToken)))}
            >
              MAX
            </Button>
          </div>
        </div>

        <Button
          className="w-full bg-blue-700 hover:bg-blue-600 text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          size="lg"
          onClick={() => {
            saveButtonClick(5); // Transfer buttonId = 5
            handleResolveAndShowDialog();
          }}
          disabled={
            !email || 
            !amount || 
            Number.parseFloat(amount) <= 0 || 
            Number.parseFloat(amount) > balance || 
            isLoading
          }
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : "Transferir"}
        </Button>
      </div>
    </Card>
    </>
  )
}