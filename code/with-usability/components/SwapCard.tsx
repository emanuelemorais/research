"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { ArrowDownUp, Loader2, Repeat, Settings } from "lucide-react"
import { encodeFunctionData, parseUnits } from "viem"
import { usePrivy } from "@privy-io/react-auth"
import { useSmartWallets } from "@privy-io/react-auth/smart-wallets"
import { toast } from "sonner"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SwapConfirmationDialog } from "./Dialog/SwapConfirmationDialog"

import Vault from "../abi/Vault.json"
import { acceptedTokens, TOKEN_ADDRESSES, handleDecimals, handleBalanceOnContract, handleGetExchangeRate, handleGetLiquidity } from "@/lib/utils"
import { useAppContext } from "@/contexts/AppContext"

export function SwapCard() {
  const [fromToken, setFromToken] = useState<keyof typeof TOKEN_ADDRESSES>("USD")
  const [toToken, setToToken] = useState<keyof typeof TOKEN_ADDRESSES>("WBTC")
  const [fromAmount, setFromAmount] = useState("")
  const [toAmount, setToAmount] = useState("")
  const [fromBalance, setFromBalance] = useState<number>(0)
  const [exchangeRate, setExchangeRate] = useState<number | null>(null)
  const [liquidity, setLiquidity] = useState<number | null>(null)
  const [openSwapConfirmationDialog, setOpenSwapConfirmationDialog] = useState(false)
  const [loading, setLoading] = useState(false)

  const { user, ready } = usePrivy();
  const { client } = useSmartWallets();
  const { sessionId } = useAppContext();

  const wallet = user?.linkedAccounts?.find((account) => account.type === 'smart_wallet')?.address as `0x${string}` | undefined;
  
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
  
  const handleSwapTokens = () => {
    const tempToken = fromToken
    const tempAmount = fromAmount
    setFromToken(toToken)
    setToToken(tempToken)
    setFromAmount(toAmount)
    setToAmount(tempAmount)
  }

  const fetchBalance = async () => {
    if (!wallet) return;
    const balance = await handleBalanceOnContract(wallet, TOKEN_ADDRESSES[fromToken] as `0x${string}`);
    if (balance !== undefined) {
      setFromBalance(balance);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, [fromToken, wallet])

  // Validação de saldo insuficiente
  useEffect(() => {
    if (fromAmount && Number(fromAmount) > fromBalance) {
      toast.error(`Saldo insuficiente. Você possui ${fromBalance.toFixed(4)} ${fromToken} depositado.`);
    }
  }, [fromAmount, fromBalance, fromToken])

  useEffect(() => {
    const fetchExchangeRate = async () => {
      if (fromAmount && Number(fromAmount) > 0) {
        const rate = await handleGetExchangeRate(fromAmount, fromToken, toToken);
        setExchangeRate(Number(rate));
      } else {
        setExchangeRate(null);
      }
    };

    const fetchLiquidity = async () => {
      if (toToken) {
        const liquidity = await handleGetLiquidity(toToken);
        setLiquidity(Number(liquidity));
      } else {
        setLiquidity(null);
      }
    };

    fetchLiquidity();
    fetchExchangeRate();
  }, [fromAmount, fromBalance, fromToken, toToken])

  // Validação de liquidez
  useEffect(() => {
    if (exchangeRate !== null && liquidity !== null && exchangeRate > liquidity) {
      toast.error(`Liquidez insuficiente. Disponível: ${liquidity.toFixed(6)} ${toToken}, necessário: ${exchangeRate.toFixed(6)} ${toToken}`);
    }
  }, [exchangeRate, liquidity, toToken])

  const handleSwap = async () => {
    try{
    if (!fromAmount || !fromToken || !toToken) return;

    setLoading(true);
    const fromAmountFormatted = parseUnits(fromAmount, await handleDecimals(TOKEN_ADDRESSES[fromToken] as `0x${string}`));
    const txHash = await client?.sendTransaction(
      {
        calls: [
          {
            to: process.env.NEXT_PUBLIC_VAULT_ADDRESS as `0x${string}`,
            value: BigInt(0),
            data: encodeFunctionData({
              abi: Vault.abi,
              functionName: "swap",
              args: [
                TOKEN_ADDRESSES[toToken] as `0x${string}`,
                TOKEN_ADDRESSES[fromToken] as `0x${string}`,
                fromAmountFormatted,
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

    setFromAmount("");
    setToAmount("");

    await fetchBalance();
    toast.success("Troca realizada com sucesso!");

    await saveTaskCompleted(4);
     
  } catch (error) {
    console.error("Erro ao realizar troca:", error);
    toast.error("Erro ao realizar troca");
  } finally {
    setLoading(false);
  }
  }

  return (
    <> 
    <SwapConfirmationDialog
      open={openSwapConfirmationDialog}
      onClose={() => setOpenSwapConfirmationDialog(false)}
      fromToken={fromToken}
      toToken={toToken}
      fromAmount={fromAmount}
      toAmount={exchangeRate !== null ? exchangeRate.toString() : "0.000000"}
      rate={exchangeRate !== null ? exchangeRate : 0}
      onConfirm={handleSwap}
    />
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
            <Repeat className="w-5 h-5 text-blue-700" />
          </div>
          <h2 className="text-xl font-semibold">Trocar tokens</h2>
        </div>

        <div className="space-y-2 mb-2">
          <Label className="text-sm text-muted-foreground">De</Label>
          <div className="relative">
            <Card className="p-4 bg-muted/50 border-2 hover:border-primary/50 transition-colors">
              <div className="flex items-center justify-around mb-2 gap-4">
                <Select value={fromToken} onValueChange={(value) => setFromToken(value as keyof typeof TOKEN_ADDRESSES)}>
                  <SelectTrigger className="w-[140px] border-0 bg-transparent p-0 h-auto font-semibold text-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {acceptedTokens.filter((t) => t.symbol !== toToken).map((token) => (
                      <SelectItem key={token.symbol} value={token.symbol}>
                      <div className="flex items-center gap-2">
                        <Image src={token.image} alt={token.symbol} width={20} height={20} className="p-0.5" />
                        <span className="font-medium">{token.symbol}</span>
                      </div>
                    </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  placeholder="0.0"
                  min="0"
                  step="0.00000001"
                  value={fromAmount}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "" || (Number(value) >= 0)) {
                      setFromAmount(value);
                    }
                  }}
                  className={`border-1 border-gray-300 text-right text-2xl font-semibold bg-transparent px-4 py-2 h-auto focus-visible:ring-0 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield] ${
                    fromAmount && Number(fromAmount) > fromBalance ? 'text-red-600 border-red-600 bg-red-50' : ''
                  }`}
                />
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <span>Saldo depositado: {fromBalance.toFixed(4)} {fromToken}</span>
              </div>
            </Card>
          </div>
        </div>

        <div className="flex justify-center -my-2 relative z-10">
          <Button
            variant="outline"
            size="icon"
            className="rounded-full h-10 w-10 bg-background border-4 border-background hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleSwapTokens}
            disabled={loading}
          >
            <ArrowDownUp className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-2 mb-6">
          <Label className="text-sm text-muted-foreground">Para</Label>
          <div className="relative">
            <Card className="p-4 bg-muted/50 border-2 hover:border-primary/50 transition-colors">
              <div className="flex items-center justify-around mb-2 gap-4">
                <Select value={toToken} onValueChange={(value) => setToToken(value as keyof typeof TOKEN_ADDRESSES)}>
                  <SelectTrigger className="w-[140px] border-0 bg-transparent p-0 h-auto font-semibold text-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {acceptedTokens.filter((t) => t.symbol !== fromToken).map((token) => (
                      <SelectItem key={token.symbol} value={token.symbol}>
                      <div className="flex items-center gap-2">
                        <Image src={token.image} alt={token.symbol} width={20} height={20} className="p-0.5" />
                        <span className="font-medium">{token.symbol}</span>
                      </div>
                    </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  disabled={true}
                  value={exchangeRate !== null ? exchangeRate.toString() : ""}
                  onChange={(e) => setToAmount(e.target.value)}
                  placeholder="0.0"
                  className="border-1 border-gray-300 text-right text-2xl font-semibold bg-transparent px-4 py-2 h-auto focus-visible:ring-0 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                />
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Liquidez: {liquidity !== null ? liquidity.toString() : "0.0000"}</span>
                {exchangeRate !== null && liquidity !== null && exchangeRate > liquidity && (
                  <span className="text-red-600 font-medium">Liquidez insuficiente</span>
                )}
              </div>
            </Card>
          </div>
        </div>

        {fromAmount && (
          <div className="mb-4 p-3 bg-muted/50 rounded-lg space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Valor do câmbio</span>
              <span className="font-medium">
                1 {fromToken} ≈ {exchangeRate !== null ? (exchangeRate / Number(fromAmount)).toFixed(10) : "Calculando..."} {toToken}
              </span>
            </div>
          </div>
        )}

        <Button
          className="w-full h-12 text-base font-semibold bg-blue-700 hover:bg-blue-600 text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          size="lg"
          onClick={() => {
            saveButtonClick(4); // Swap buttonId = 4
            setOpenSwapConfirmationDialog(true);
          }}
          disabled={
            !fromAmount || 
            Number(fromAmount) <= 0 || 
            Number(fromAmount) > fromBalance || 
            loading ||
            (exchangeRate !== null && liquidity !== null && exchangeRate > liquidity)
          }
        >
          {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Aguarde a confirmação...</> : 'Realizar Troca'}
        </Button>
        
      </Card>
    </>
  )
}
