"use client"

import { useAccount } from "wagmi"
import { Wallet } from "lucide-react"
import { ConnectButtonCustom } from "@/components/connect-button"
import { Card } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { useAppContext } from "@/contexts/AppContext"

export default function HomePage() {
  const router = useRouter()

  const { isConnected } = useAccount()
  const { sessionId, userId } = useAppContext();

  useEffect(() => {
    if (isConnected && sessionId && userId) {
      router.push(`/${userId}/${sessionId}/dashboard`)
    }
  }, [isConnected, sessionId, userId])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 p-4">
      <Card className="w-full max-w-md p-8 text-center">

        <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Wallet className="w-8 h-8 text-primary-foreground" />
        </div>

        <h1 className="text-3xl font-bold mb-2">DeFi Platform</h1>
        <p className="text-muted-foreground mb-8">Conecte sua carteira para acessar a plataforma</p>

        <div className="flex justify-center">
          <ConnectButtonCustom />
        </div>

      </Card>
    </div>
  )
}
