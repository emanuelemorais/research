import { WithdrawCard } from "@/components/withdraw-card"

export default function WithdrawPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Withdraw</h1>
        <p className="text-muted-foreground">Retire seus fundos da plataforma</p>
      </div>
      <WithdrawCard />
    </div>
  )
}

