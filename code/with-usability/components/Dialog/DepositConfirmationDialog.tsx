"use client"

import { TransactionConfirmationDialog } from "./TransactionConfirmationDialog"
import { Wallet } from "lucide-react"

interface DepositConfirmationDialogProps {
  open: boolean
  onClose: () => void
  token: string
  amount: string
  onConfirm: () => Promise<void>
}

export function DepositConfirmationDialog({
  open,
  onClose,
  token,
  amount,
  onConfirm,
}: DepositConfirmationDialogProps) {
  const summary = (
    <div className="rounded-lg border bg-blue-50/80 border-blue-100 p-4 text-sm text-blue-950 my-5">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-blue-800">Token:</span>
        <span>{token}</span>
      </div>
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-blue-800">Quantidade:</span>
        <span>{amount}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="font-medium text-blue-800">Destino:</span>
        <div className="flex items-center gap-1">
          <Wallet className="w-4 h-4 text-blue-600" />
          <span>Vault verificado</span>
        </div>
      </div>
    </div>
  )

  return (
    <TransactionConfirmationDialog
      open={open}
      onClose={onClose}
      title="Confirmar Depósito"
      description="Revise as informações antes de prosseguir com a operação."
      summary={summary}
      confirmLabel="Confirmar Depósito"
      onConfirm={onConfirm}
      successMessage="Depósito realizado com sucesso!"
    />
  )
}