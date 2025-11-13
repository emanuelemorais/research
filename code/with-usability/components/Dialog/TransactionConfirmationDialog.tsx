"use client"

import { useState, useEffect } from "react"
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

// Função para detectar se o Google Translate está ativo
const isGoogleTranslateActive = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  try {
    // Google Translate adiciona elementos com essas características
    const hasTranslateElements = 
      document.querySelector('[class*="skiptranslate"]') !== null ||
      document.querySelector('[id*="google_translate"]') !== null ||
      document.body.getAttribute('data-google-translate') !== null ||
      document.documentElement.classList.contains('translated-ltr') ||
      document.documentElement.classList.contains('translated-rtl');
    
    return hasTranslateElements;
  } catch (error) {
    // Se houver erro ao verificar, assumir que não está ativo para evitar problemas
    return false;
  }
}

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
  const [hasTranslate, setHasTranslate] = useState(false)

  useEffect(() => {
    // Verificar se Google Translate está ativo
    setHasTranslate(isGoogleTranslateActive())
    
    // Observar mudanças no DOM que podem indicar ativação do translate
    try {
      const observer = new MutationObserver(() => {
        try {
          setHasTranslate(isGoogleTranslateActive())
        } catch (error) {
          // Ignorar erros no observer para evitar loops
        }
      })
      
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'id', 'lang']
      })
      
      return () => {
        try {
          observer.disconnect()
        } catch (error) {
          // Ignorar erros ao desconectar
        }
      }
    } catch (error) {
      // Se houver erro ao criar observer, continuar sem ele
      return () => {}
    }
  }, [])

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

        {hasTranslate ? (
          // Renderização simples sem animações quando Google Translate está ativo
          <>
            {!isLoading && !isSuccess && <div>{summary}</div>}
            {isLoading && !isSuccess && (
              <div className="flex flex-col items-center justify-center py-8 gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-blue-700" />
                <p className="text-sm text-gray-600">
                  Transação sendo processada... aguarde confirmação.
                </p>
              </div>
            )}
            {isSuccess && (
              <div className="flex flex-col items-center justify-center py-8 gap-3">
                <CheckCircle2 className="w-7 h-7 text-green-600" />
                <p className="text-sm font-medium text-green-700">
                  {successMessage}
                </p>
              </div>
            )}
          </>
        ) : (
          // Renderização com animações quando Google Translate não está ativo
          <AnimatePresence mode="wait" initial={false}>
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
        )}

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