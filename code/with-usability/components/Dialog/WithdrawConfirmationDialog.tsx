"use client"

import { TransactionConfirmationDialog } from "./TransactionConfirmationDialog"

interface WithdrawConfirmationDialogProps {
  open: boolean
  onClose: () => void
  token: string
  totalDeposited: string
  withdrawAmount: string
  onConfirm: () => Promise<void>
}

export function WithdrawConfirmationDialog({
  open,
  onClose,
  token,
  totalDeposited,
  withdrawAmount,
  onConfirm,
}: WithdrawConfirmationDialogProps) {
  const summary = (
    <div className="rounded-lg border bg-blue-50/80 border-blue-100 p-4 text-sm text-blue-950 my-5 space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-medium text-blue-800">Token:</span>
        <span>{token}</span>
      </div>

      <div className="flex items-center justify-between">
        <span className="font-medium text-blue-800">Total depositado:</span>
        <span>{totalDeposited}</span>
      </div>

      <div className="flex items-center justify-between">
        <span className="font-medium text-blue-800">Quantidade a sacar:</span>
        <span className="font-semibold text-blue-900">{withdrawAmount}</span>
      </div>

    </div>
  )

  return (
    <TransactionConfirmationDialog
      open={open}
      onClose={onClose}
      title="Confirmar Retirada"
      description="Revise as informações antes de sacar seus tokens."
      summary={summary}
      confirmLabel="Confirmar Saque"
      onConfirm={onConfirm}
      successMessage="Saque realizado com sucesso!"
    />
  )
}