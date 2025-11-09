"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowDownUp, Loader2, Settings } from "lucide-react"
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getTokenAddress, acceptedTokens, getTokenDecimals } from "@/lib/utils"
import Vault from "../abi/Vault.json"
import { formatUnits, parseUnits } from "viem"
import { useAppContext } from "@/contexts/AppContext"
import { trackButtonClick } from "@/lib/track-click"
import { BUTTON_IDS } from "@/lib/button-ids"
import { trackTaskCompleted } from "@/lib/track-task-completed"

export function SwapCard() {
  const [fromToken, setFromToken] = useState("USD")
  const [toToken, setToToken] = useState("WBTC")
  const [fromAmount, setFromAmount] = useState("")
  const [toAmount, setToAmount] = useState("")
  const { address } = useAccount()
  const { sessionId } = useAppContext()


  const parsedAmount = fromAmount && fromAmount !== "0" ? parseUnits(fromAmount, getTokenDecimals(fromToken)) : undefined
  const { writeContract, data: swapHash, error: writeError } = useWriteContract();
  const { isLoading: isLoadingSwap, isSuccess: isSwapConfirmed } = useWaitForTransactionReceipt({
    hash: swapHash,
  });

  // Rastreia quando o swap é confirmado com sucesso
  useEffect(() => {
    if (isSwapConfirmed) {
      trackTaskCompleted(BUTTON_IDS.SWAP, sessionId);
    }
  }, [isSwapConfirmed, sessionId]);
  
  const handleSwapTokens = () => {
    const tempToken = fromToken
    const tempAmount = fromAmount
    setFromToken(toToken)
    setToToken(tempToken)
    setFromAmount(toAmount)
    setToAmount(tempAmount)
  }


  const { data: priceFeedInfo } = useReadContract({
    address: process.env.NEXT_PUBLIC_VAULT_ADDRESS as `0x${string}`,
    abi: Vault.abi,
    functionName: 'getTokenPriceFeedInfo',
    args: [getTokenAddress(fromToken)],
    query: {
      enabled: !!fromToken,
    },
  });

  const { data: exchangeAmount } = useReadContract({
    address: process.env.NEXT_PUBLIC_VAULT_ADDRESS as `0x${string}`,
    abi: Vault.abi,
    functionName: 'getExchangeRate',
    args: [getTokenAddress(toToken), getTokenAddress(fromToken), parsedAmount],
    query: {
      enabled: !!fromToken && !!toToken && !!parsedAmount,
    },
  })

  const { data: userBalance, refetch: refetchUserBalance } = useReadContract({
    address: process.env.NEXT_PUBLIC_VAULT_ADDRESS as `0x${string}`,
    abi: Vault.abi,
    functionName: 'balanceOfToken',
    args: [address!, getTokenAddress(fromToken)],
    query: {
      enabled: !!address && !!fromToken,
    },
  })

  const { data: poolLiquidity } = useReadContract({
    address: process.env.NEXT_PUBLIC_VAULT_ADDRESS as `0x${string}`,
    abi: Vault.abi,
    functionName: 'poolLiquidity',
    args: [getTokenAddress(toToken)],
    query: {
      enabled: !!toToken,
    },
  })

  useEffect(() => {
    if (isSwapConfirmed) {
      refetchUserBalance();
    }
  }, [isSwapConfirmed, refetchUserBalance]);

  const handleSwap = async () => {
    trackButtonClick(BUTTON_IDS.SWAP, sessionId);
    
    try {

      const tx = await writeContract({
        address: process.env.NEXT_PUBLIC_VAULT_ADDRESS as `0x${string}`,
        abi: Vault.abi,
        functionName: 'swap',
        args: [getTokenAddress(toToken), getTokenAddress(fromToken), parsedAmount],
      })
      console.log("📤 Tx enviada:", tx)
    } catch (err) {
      console.error("❌ Falha ao enviar swap:", err)
    }
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Swap</h2>
      </div>

      {/* From Token */}
      <div className="space-y-2 mb-2">
        <Label className="text-sm text-muted-foreground">De</Label>
        <div className="relative">
          <Card className="p-4 bg-muted/50 border-2 hover:border-primary/50 transition-colors">
            <div className="flex items-center justify-around mb-2">
              <Select value={fromToken} onValueChange={setFromToken}>
                <SelectTrigger className="w-[140px] border-0 bg-transparent p-0 h-auto font-semibold text-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {acceptedTokens.filter((t) => t.symbol !== toToken).map((token) => (
                    <SelectItem key={token.symbol} value={token.symbol}>
                      <div className="flex items-center gap-2 px-2">
                        <span>{token.symbol}</span>
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
                className="text-right text-2xl font-semibold border-0 bg-transparent px-4 h-auto focus-visible:ring-0 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
              />
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{fromToken}</span>
              <span>Saldo: {userBalance ? Number(userBalance as bigint / BigInt(10 ** getTokenDecimals(fromToken))).toFixed(4) : "0.0000"}</span>
            </div>
          </Card>
        </div>
      </div>

      <div className="flex justify-center -my-2 relative z-10">
        <Button
          variant="outline"
          size="icon"
          className="rounded-full h-10 w-10 bg-background border-4 border-background hover:bg-muted"
          onClick={handleSwapTokens}
        >
          <ArrowDownUp className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2 mb-6">
        <Label className="text-sm text-muted-foreground">Para</Label>
        <div className="relative">
          <Card className="p-4 bg-muted/50 border-2 hover:border-primary/50 transition-colors">
            <div className="flex items-center justify-around mb-2">
              <Select value={toToken} onValueChange={setToToken}>
                <SelectTrigger className="w-[140px] border-0 bg-transparent p-0 h-auto font-semibold text-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {acceptedTokens.filter((t) => t.symbol !== fromToken).map((token) => (
                    <SelectItem key={token.symbol} value={token.symbol}>
                      <div className="flex items-center gap-2 px-2">
                        <span>{token.symbol}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                disabled={false}
                value={exchangeAmount ? Number(formatUnits(exchangeAmount as bigint, getTokenDecimals(toToken))).toFixed(8) : "0.0000"}
                onChange={(e) => setToAmount(e.target.value)}
                className="text-right text-2xl font-semibold border-0 bg-transparent px-4 h-auto focus-visible:ring-0 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
              />
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{toToken}</span>
              <span>Liquidez: {poolLiquidity ? Number(poolLiquidity as bigint / BigInt(10 ** getTokenDecimals(toToken))).toFixed(4) : "0.0000"}</span>
            </div>
          </Card>
        </div>
      </div>

      {fromAmount && (
        <div className="mb-4 p-3 bg-muted/50 rounded-lg space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Taxa de câmbio</span>
            <span className="font-medium">
              1 {fromToken} ≈ {exchangeAmount ? (Number(formatUnits(exchangeAmount as bigint, getTokenDecimals(toToken))) / Number.parseFloat(fromAmount)).toFixed(4) : "Calculando..."} {exchangeAmount ? toToken : ""}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Seu saldo</span>
            <span className="font-medium">
              {userBalance ? Number(userBalance as bigint / BigInt(10 ** getTokenDecimals(fromToken))).toFixed(4) : "0.0000"} {fromToken}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Liquidez disponível</span>
            <span className="font-medium">
              {poolLiquidity ? Number(poolLiquidity as bigint / BigInt(10 ** getTokenDecimals(toToken))).toFixed(4) : "0.0000"} {toToken}
            </span>
          </div>
        </div>
      )}

      {isLoadingSwap === true && (
          <div>
            <div className="w-full p-3 bg-yellow-100 border border-yellow-300 rounded text-yellow-700 text-sm text-center flex items-center justify-center">
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Aguarde a confirmação...
            </div>
          </div>
        )}

      <Button
        className="w-full h-12 text-base font-semibold"
        size="lg"
        onClick={handleSwap}
        disabled={!fromAmount || !userBalance}
      >
        {isLoadingSwap ? 'Processando...' : 'Swap'}
      </Button>
      
      {writeError && (
        <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded text-red-700 text-sm">
          Erro: {writeError.message}
        </div>
      )}
      
    </Card>
  )
}
