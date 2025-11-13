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
    // Verificar múltiplos indicadores para maior confiabilidade
    const checks = [
      document.querySelector('[class*="skiptranslate"]') !== null,
      document.querySelector('[id*="google_translate"]') !== null,
      document.querySelector('[id*="gtx-trans"]') !== null,
      document.body?.getAttribute('data-google-translate') !== null,
      document.documentElement.classList.contains('translated-ltr'),
      document.documentElement.classList.contains('translated-rtl'),
      // Verificar se o lang mudou (indicador comum do Translate)
      (() => {
        const originalLang = document.documentElement.getAttribute('data-original-lang');
        const currentLang = document.documentElement.getAttribute('lang');
        return originalLang !== null && currentLang !== originalLang;
      })()
    ];
    
    return checks.some(check => check === true);
  } catch (error) {
    // Se houver erro ao verificar, assumir que está ativo para segurança
    // É melhor desabilitar animações do que ter erros
    return true;
  }
}

// Listener global para capturar erros de DOM que podem indicar Google Translate
let domErrorDetected = false;
if (typeof window !== 'undefined') {
  const originalErrorHandler = window.onerror;
  window.addEventListener('error', (event) => {
    if (event.message && (
      event.message.includes('insertBefore') ||
      event.message.includes('removeChild') ||
      event.message.includes('appendChild') ||
      event.message.includes('NotFoundError')
    )) {
      domErrorDetected = true;
    }
  }, true);
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
    const checkTranslate = () => {
      try {
        const isActive = isGoogleTranslateActive() || domErrorDetected
        setHasTranslate(isActive)
        return isActive
      } catch (error) {
        // Em caso de erro, assumir que está ativo para segurança
        setHasTranslate(true)
        return true
      }
    }
    
    checkTranslate()
    
    // Verificar periodicamente também (não apenas com observer)
    const intervalId = setInterval(() => {
      checkTranslate()
    }, 500)
    
    // Observar mudanças no DOM que podem indicar ativação do translate
    try {
      const observer = new MutationObserver(() => {
        try {
          checkTranslate()
        } catch (error) {
          // Se houver erro, assumir que está ativo
          setHasTranslate(true)
        }
      })
      
      if (document.body) {
        observer.observe(document.body, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['class', 'id', 'lang']
        })
      }
      
      return () => {
        clearInterval(intervalId)
        try {
          observer.disconnect()
        } catch (error) {
          // Ignorar erros ao desconectar
        }
      }
    } catch (error) {
      // Se houver erro ao criar observer, assumir que está ativo para segurança
      setHasTranslate(true)
      return () => {
        clearInterval(intervalId)
      }
    }
  }, [])

  const handleConfirm = async () => {
    setIsLoading(true)
    try {
      await onConfirm()
      setIsSuccess(true)
      // Delay maior quando Google Translate está ativo para garantir que o DOM está estável
      const delay = hasTranslate ? 2000 : 1600
      setTimeout(() => {
        // Verificar novamente antes de fechar para evitar erros
        if (!isGoogleTranslateActive() || hasTranslate) {
          onClose()
          setIsSuccess(false)
        } else {
          // Se o translate foi ativado durante a transação, aguardar mais
          setTimeout(() => {
            onClose()
            setIsSuccess(false)
          }, 500)
        }
      }, delay)
    } catch (error) {
      console.error("Erro ao confirmar transação:", error)
      setIsLoading(false)
    } finally {
      if (!isSuccess) {
        setIsLoading(false)
      }
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

        {/* Sempre usar renderização simples quando Google Translate está ativo para evitar conflitos de DOM */}
        {hasTranslate ? (
          // Renderização simples sem animações quando Google Translate está ativo
          <div>
            {!isLoading && !isSuccess && <div key="summary">{summary}</div>}
            {isLoading && !isSuccess && (
              <div key="loading" className="flex flex-col items-center justify-center py-8 gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-blue-700" />
                <p className="text-sm text-gray-600">
                  Transação sendo processada... aguarde confirmação.
                </p>
              </div>
            )}
            {isSuccess && (
              <div key="success" className="flex flex-col items-center justify-center py-8 gap-3">
                <CheckCircle2 className="w-7 h-7 text-green-600" />
                <p className="text-sm font-medium text-green-700">
                  {successMessage}
                </p>
              </div>
            )}
          </div>
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