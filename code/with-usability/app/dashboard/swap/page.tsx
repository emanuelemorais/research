"use client"
import { SwapCard } from "@/components/SwapCard"

export default function SwapPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2">Trocar tokens</h1>
          <p className="text-muted-foreground text-lg">
            Troque seus tokens de forma instantânea
          </p>
        </div>

        <SwapCard />

      </div>
    </div>
  )
}
