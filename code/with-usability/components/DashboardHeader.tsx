"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Loader2, X } from "lucide-react"
import { getPublicClient } from "@/lib/utils"
import { usePrivy } from "@privy-io/react-auth"
import { toast } from "sonner"

export function DashboardHeader() {
  const { user, ready } = usePrivy()
  const [isMinting, setIsMinting] = useState(false)
  const [mintStatus, setMintStatus] = useState<string>("")
  const [showInitialPopup, setShowInitialPopup] = useState(false)

  // Mostrar popup inicial quando a pessoa entra
  useEffect(() => {
    if (user && ready) {
      setShowInitialPopup(true)
    }
  }, [user, ready])

  const handleRequestTestUSD = async () => {
    if (!user || !ready) return

    const smartWallet = user?.linkedAccounts?.find(
      (acc) => acc.type === 'smart_wallet'
    )

    if (!smartWallet?.address) {
      toast.error("Carteira não encontrada")
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
        body: JSON.stringify({ userAddress: smartWallet.address }),
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
          toast.success("USD de teste solicitado com sucesso!")
          
          // Aguardar um pouco para garantir que a blockchain atualizou
          await new Promise(resolve => setTimeout(resolve, 1000))

          // Disparar evento para atualizar saldos no page
          window.dispatchEvent(new CustomEvent('mintCompleted'))
        } catch (waitError) {
          console.error('Erro ao aguardar confirmação:', waitError)
          // Mesmo se houver erro ao aguardar, tentar atualizar os saldos
          setMintStatus("Verificando saldos...")
          await new Promise(resolve => setTimeout(resolve, 3000))
          window.dispatchEvent(new CustomEvent('mintCompleted'))
          toast.success("Transação enviada! Verificando saldos...")
        }
      } else if (mintResult.success) {
        // Se não há transactionHash mas foi bem-sucedido, aguardar e atualizar
        setMintStatus("Processando...")
        await new Promise(resolve => setTimeout(resolve, 3000))
        window.dispatchEvent(new CustomEvent('mintCompleted'))
        toast.success("USD de teste solicitado com sucesso!")
      } else {
        toast.error(mintResult.error || "Erro ao solicitar USD de teste")
      }
    } catch (error) {
      console.error('Erro ao solicitar USD de teste:', error)
      toast.error("Erro ao solicitar USD de teste")
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
            disabled={!user || !ready}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Solicitar USD de teste
          </Button>
        </div>
      </header>

      {/* Popup inicial ao entrar */}
      {showInitialPopup && user && ready && (
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
            

              <div className="flex gap-3">
                <Button
                  onClick={handleRequestTestUSD}
                  disabled={isMinting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
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
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
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
