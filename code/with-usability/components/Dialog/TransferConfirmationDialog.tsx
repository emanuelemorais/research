"use client"

import { TransactionConfirmationDialog } from "./TransactionConfirmationDialog"
import { Wallet } from "lucide-react"

interface TransferConfirmationDialogProps {
  open: boolean
  onClose: () => void
  email: string
  token: string
  amount: string
  onConfirm: () => Promise<void>
}

export function TransferConfirmationDialog({
  open,
  onClose,
  email,
  token,
  amount,
  onConfirm,
}: TransferConfirmationDialogProps) {
  const summary = (
    <div className="rounded-lg border bg-blue-50/80 border-blue-100 p-4 text-sm text-blue-950 my-5">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-blue-800">Destinatário:</span>
        <span>{email}</span>
      </div>
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-blue-800">Token:</span>
        <span>{token}</span>
      </div>
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-blue-800">Quantidade:</span>
        <span>{amount}</span>
      </div>
    </div>
  )

  return (
    <TransactionConfirmationDialog
      open={open}
      onClose={onClose}
      title="Confirmar Transferência"
      description="Verifique as informações antes de enviar seus tokens."
      summary={summary}
      confirmLabel="Confirmar Envio"
      onConfirm={onConfirm}
      successMessage="Transferência concluída com sucesso!"
    />
  )
}