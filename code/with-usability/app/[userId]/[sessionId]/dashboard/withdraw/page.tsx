import { WithdrawCard } from "@/components/WithdrawCard"

export default function WithdrawPage() {
  return (
    <div className="min-h-full bg-gradient-to-b from-gray-50 to-gray-100 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2">Sacar</h1>
          <p className="text-muted-foreground text-lg">
            Sacar seus tokens da plataforma
          </p>
        </div>

        <WithdrawCard />

      </div>
    </div>
  )
}

