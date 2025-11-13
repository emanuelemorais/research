"use client"
import { SwapCard } from "@/components/swap-card"

export default function SwapPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Swap</h1>
        <p className="text-muted-foreground">Troque tokens instantaneamente com as melhores taxas</p>
      </div>
      <SwapCard />
    </div>
  )
}

