"use client"

//import { ConnectButton } from "@/components/connect-button"
import  { ConnectButtonCustom } from "@/components/connect-button"
import { useAccount, useReadContract } from "wagmi"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Loader2, X } from "lucide-react"
import { createPublicClient, http } from "viem"
import { sepolia } from "viem/chains"
import Vault from "../abi/Vault.json"

export function DashboardHeader() {
  const router = useRouter()
  const { isConnected, address } = useAccount()
  const [isMinting, setIsMinting] = useState(false)
  const [mintStatus, setMintStatus] = useState<string>("")
  const [showInitialPopup, setShowInitialPopup] = useState(false)

  const { refetch: refetchUsdBalance } = useReadContract({
    address: process.env.NEXT_PUBLIC_VAULT_ADDRESS as `0x${string}`,
    abi: Vault.abi,
    functionName: 'balanceOfToken',
    args: [address!, process.env.NEXT_PUBLIC_USD_TOKEN_ADDRESS as `0x${string}`],
    query: {
      enabled: !!address, // Habilitar quando address estiver disponível
    },
  })

  useEffect(() => {
    if (!isConnected) {
      router.push("/")
    }
  }, [isConnected])

  // Mostrar popup inicial quando a pessoa entra
  useEffect(() => {
    if (address) {
      setShowInitialPopup(true)
    }
  }, [address])

  const getPublicClient = () => {
    return createPublicClient({
      chain: sepolia,
      transport: http(process.env.NEXT_PUBLIC_ALCHEMY_URL),
    })
  }

  const handleRequestTestUSD = async () => {
    if (!address) {
      alert("Carteira não conectada")
      return
    }

    // Fechar o popup inicial se estiver aberto
    setShowInitialPopup(false)

    setIsMinting(true)
    setMintStatus("Enviando transação...")

    try {
      const mintResponse = await fetch('/api/mint-usd', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userAddress: address }),
      })

      const mintResult = await mintResponse.json()

      if (mintResult.success && mintResult.transactionHash) {
        setMintStatus("Aguardando confirmação da transação...")
        
        // Aguardar a confirmação da transação na blockchain
        const publicClient = getPublicClient()
        
        try {
          await publicClient.waitForTransactionReceipt({
            hash: mintResult.transactionHash as `0x${string}`,
            timeout: 60000, // 60 segundos de timeout
          })

          setMintStatus("Transação confirmada! Atualizando saldos...")
          alert("USD de teste solicitado com sucesso!")
          
          // Aguardar um pouco para garantir que a blockchain atualizou
          await new Promise(resolve => setTimeout(resolve, 1000))

          // Atualizar os saldos após a confirmação
          await refetchUsdBalance()
        } catch (waitError) {
          console.error('Erro ao aguardar confirmação:', waitError)
          // Mesmo se houver erro ao aguardar, tentar atualizar os saldos
          setMintStatus("Verificando saldos...")
          await new Promise(resolve => setTimeout(resolve, 3000))
          await refetchUsdBalance()
          alert("Transação enviada! Verificando saldos...")
        }
      } else if (mintResult.success) {
        setMintStatus("Processando...")
        await new Promise(resolve => setTimeout(resolve, 3000))
        await refetchUsdBalance()
      } else {
        alert(mintResult.error || "Erro ao solicitar USD de teste")
      }
    } catch (error) {
      console.error('Erro ao solicitar USD de teste:', error)
      alert("Erro ao solicitar USD de teste")
    } finally {
      setIsMinting(false)
      setMintStatus("")
    }
  }

  return (
    <>
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="px-6 py-4 flex items-center justify-end gap-3">
          <Button
            onClick={() => setShowInitialPopup(true)}
            disabled={!address}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Solicitar USD de teste
          </Button>
          <ConnectButtonCustom />
        </div>
      </header>

      {/* Popup inicial ao entrar */}
      {showInitialPopup && address && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg bg-white border border-gray-200 shadow-lg p-6 relative">
            <button
              onClick={() => setShowInitialPopup(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              disabled={isMinting}
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex flex-col space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">
                  Solicitar token de teste para interação
                </h2>
                <p className="text-gray-600">
                  Irá mintar 1000 USD tokens para a carteira logada.
                </p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <p className="text-sm font-medium text-gray-700">Endereço do token USD:</p>
                <p className="text-sm text-gray-600 font-mono break-all">
                  {process.env.NEXT_PUBLIC_USD_TOKEN_ADDRESS}
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleRequestTestUSD}
                  disabled={isMinting}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  {isMinting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Processando...
                    </>
                  ) : (
                    "Solicitar USD de teste"
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Popup de loading durante o mint */}
      {isMinting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md bg-white border border-gray-200 shadow-lg p-6">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-green-600" />
              <p className="text-lg font-medium text-gray-800">Solicitando USD de teste...</p>
              <p className="text-sm text-gray-600 text-center">
                {mintStatus || "Estamos processando sua solicitação. Isso pode levar alguns segundos."}
              </p>
            </div>
          </Card>
        </div>
      )}
    </>
  )
}
