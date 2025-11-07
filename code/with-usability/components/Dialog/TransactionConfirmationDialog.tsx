"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"
import { Loader2, CheckCircle2, ShieldCheck } from "lucide-react"

interface TransactionConfirmationDialogProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  summary: React.ReactNode
  confirmLabel: string
  onConfirm: () => Promise<void>
  successMessage?: string
}

export function TransactionConfirmationDialog({
  open,
  onClose,
  title,
  description,
  summary,
  confirmLabel,
  onConfirm,
  successMessage = "Transação realizada com sucesso!",
}: TransactionConfirmationDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleConfirm = async () => {
    setIsLoading(true)
    try {
      await onConfirm()
      setIsSuccess(true)
      setTimeout(() => {
        onClose()
        setIsSuccess(false)
      }, 1600)
    } catch (error) {
      console.error("Erro ao confirmar transação:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className="sm:max-w-[430px] rounded-2xl border border-blue-100 shadow-lg">
        <AlertDialogHeader className="space-y-1 text-center flex flex-col items-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
            <ShieldCheck className="w-6 h-6 text-blue-700" />
          </div>
          <AlertDialogTitle className="text-xl font-semibold text-gray-900">
            {title}
          </AlertDialogTitle>
          {description && (
            <AlertDialogDescription className="text-gray-500 text-sm">
              {description}
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>

        <AnimatePresence mode="wait">
          {!isLoading && !isSuccess && (
            <motion.div
              key="summary"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              {summary}
            </motion.div>
          )}

          {isLoading && !isSuccess && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-8 gap-3"
            >
              <Loader2 className="w-6 h-6 animate-spin text-blue-700" />
              <p className="text-sm text-gray-600">
                Transação sendo processada... aguarde confirmação.
              </p>
            </motion.div>
          )}

          {isSuccess && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-8 gap-3"
            >
              <CheckCircle2 className="w-7 h-7 text-green-600" />
              <p className="text-sm font-medium text-green-700">
                {successMessage}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <AlertDialogFooter className="mt-4">
          {!isLoading && !isSuccess && (
            <>
              <AlertDialogCancel className="rounded-lg border border-gray-200 hover:bg-gray-100 cursor-pointer">
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirm}
                className="bg-blue-700 hover:bg-blue-600 rounded-lg transition-all cursor-pointer"
              >
                {confirmLabel}
              </AlertDialogAction>
            </>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}