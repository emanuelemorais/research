"use client"
import { DepositCard } from "@/components/deposit-card"

export default function DepositPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Deposit</h1>
        <p className="text-muted-foreground">Deposite tokens na plataforma</p>
      </div>
      <DepositCard />
    </div>
  )
}

