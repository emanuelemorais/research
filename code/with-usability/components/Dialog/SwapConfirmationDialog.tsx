"use client"

import { TransactionConfirmationDialog } from "./TransactionConfirmationDialog"
import { ArrowRightLeft } from "lucide-react"

interface SwapConfirmationDialogProps {
  open: boolean
  onClose: () => void
  fromToken: string
  toToken: string
  fromAmount: string
  toAmount: string
  rate: number 
  onConfirm: () => Promise<void>
}

export function SwapConfirmationDialog({
  open,
  onClose,
  fromToken,
  toToken,
  fromAmount,
  toAmount,
  rate,
  onConfirm,
}: SwapConfirmationDialogProps) {
  const summary = (
    <div className="rounded-lg border bg-blue-50/80 border-blue-100 p-4 text-sm text-blue-950 my-5 space-y-3">
      <div className="flex items-center justify-between mb-1">
        <span className="font-medium text-blue-800">De:</span>
        <span>
          {fromAmount} {fromToken}
        </span>
      </div>
      <div className="flex items-center justify-between mb-1">
        <span className="font-medium text-blue-800">Para:</span>
        <span>
          {toAmount} {toToken}
        </span>
      </div>
      <div className="flex items-center justify-center gap-2 mt-2">
        <span className="text-blue-800 text-sm">
          1 {fromToken} ≈ {(rate / Number(fromAmount)).toFixed(6)} {toToken}
        </span>
      </div>
    </div>
  )

  return (
    <TransactionConfirmationDialog
      open={open}
      onClose={onClose}
      title="Confirmar Troca"
      description="Revise os detalhes antes de confirmar a troca de tokens."
      summary={summary}
      confirmLabel="Confirmar Swap"
      onConfirm={onConfirm}
      successMessage="Swap realizado com sucesso!"
    />
  )
}