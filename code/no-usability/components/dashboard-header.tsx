"use client"

//import { ConnectButton } from "@/components/connect-button"
import  { ConnectButtonCustom } from "@/components/connect-button"
import { useAccount } from "wagmi"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export function DashboardHeader() {
  const router = useRouter()
  
  const { isConnected } = useAccount()

  useEffect(() => {
    if (!isConnected) {
      router.push("/")
    }
  }, [isConnected])

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm">
      <div className="px-6 py-4 flex items-center justify-end">
        <ConnectButtonCustom />
      </div>
    </header>
  )
}
