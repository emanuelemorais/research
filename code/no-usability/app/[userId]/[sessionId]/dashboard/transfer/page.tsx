import { TransferCard } from "@/components/transfer-card"

export default function TransferPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Transfer</h1>
        <p className="text-muted-foreground">Transfira tokens para outras carteiras</p>
      </div>
      <TransferCard />
    </div>
  )
}

