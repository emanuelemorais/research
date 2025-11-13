'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  useLoginWithEmail,
  useSignupWithPasskey,
  useLoginWithOAuth,
} from '@privy-io/react-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Mail, Loader2, LogIn } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { usePrivy } from "@privy-io/react-auth";
import { useCreateWallet } from '@privy-io/react-auth';
import { KeyRound } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';


export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState(Array(6).fill(''));
  const [codeSent, setCodeSent] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [hasTranslate, setHasTranslate] = useState(false);
  const { sendCode, loginWithCode } = useLoginWithEmail();
  const { signupWithPasskey } = useSignupWithPasskey();
  const { loading, initOAuth } = useLoginWithOAuth();
  const router = useRouter();
  const params = useParams();
  const { ready, authenticated, user } = usePrivy();
  const { createWallet } = useCreateWallet();
  const [hasCreatedWallet, setHasCreatedWallet] = useState(false);
  const { sessionId, userId } = useAppContext();

  // Função para detectar se o Google Translate está ativo
  const isGoogleTranslateActive = (): boolean => {
    if (typeof window === 'undefined') return false;
    
    try {
      const hasTranslateElements = 
        document.querySelector('[class*="skiptranslate"]') !== null ||
        document.querySelector('[id*="google_translate"]') !== null ||
        document.body.getAttribute('data-google-translate') !== null ||
        document.documentElement.classList.contains('translated-ltr') ||
        document.documentElement.classList.contains('translated-rtl');
      
      return hasTranslateElements;
    } catch (error) {
      return false;
    }
  }

  useEffect(() => {
    // Verificar se Google Translate está ativo
    setHasTranslate(isGoogleTranslateActive())
    
    // Observar mudanças no DOM que podem indicar ativação do translate
    const observer = new MutationObserver(() => {
      setHasTranslate(isGoogleTranslateActive())
    })
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'id', 'lang']
    })
    
    return () => observer.disconnect()
  }, [])

  const urlUserId = params?.userId as string;
  const urlSessionId = params?.sessionId as string;
  const dashboardPath = `/${urlUserId}/${urlSessionId}/dashboard`;

  const saveButtonClick = useCallback(async (buttonId: number) => {
    if (!sessionId) return;
    try {
      await fetch("/api/button-click", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ buttonId, sessionId }),
      });
    } catch (error) {
      console.error("Error saving button click:", error);
    }
  }, [sessionId]);

  // Criar wallet quando o usuário fizer login
  useEffect(() => {
    const createWalletIfNeeded = async () => {
      if (!ready || !authenticated || !user || hasCreatedWallet) return;

      try {
        setIsRedirecting(true);
        setHasCreatedWallet(true);

        const hasEmbeddedWallet = user.linkedAccounts.some(
          (acc) =>
            acc.type === 'wallet' &&
            acc.connectorType === 'embedded' &&
            acc.walletClientType === 'privy'
        );

        if (!hasEmbeddedWallet) {
          console.log('⚙️ Creating embedded wallet...');
          const result = await createWallet();
          console.log('✅ Embedded wallet created:', result);
        } else {
          console.log('✅ Wallet already exists, skipping creation.');
        }

        // Salva o clique do botão de login quando o usuário faz login com sucesso
        await saveButtonClick(1); // Login buttonId = 1

        // Redirecionar para o dashboard
        router.push(dashboardPath);
      } catch (err) {
        console.error('❌ Failed to create wallet:', err);
        // Salva o clique mesmo se houver erro
        await saveButtonClick(1);
        router.push(dashboardPath);
      }
    };

    createWalletIfNeeded();
  }, [ready, authenticated, user, createWallet, hasCreatedWallet, router, saveButtonClick, dashboardPath]);

  const handleSendCode = async () => {
    if (!email) return;
    try {
      await sendCode({ email });
      setCodeSent(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    if (!/^[0-9]?$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    if (value && index < 5) {
      const next = document.getElementById(`code-${index + 1}`);
      next?.focus();
    }
  };

  const handleLogin = async () => {
    const fullCode = code.join('');
    if (fullCode.length === 6) {
      const result = await loginWithCode({ code: fullCode });
    }
  };

  const handleOAuth = async () => {
    try {
      await initOAuth({ provider: 'google' });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 relative">
      {isRedirecting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 flex flex-col items-center gap-4 shadow-xl">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
            <p className="text-lg font-medium text-gray-800">Redirecionando...</p>
            <p className="text-sm text-gray-500">Aguarde enquanto preparamos sua conta</p>
          </div>
        </div>
      )}
      <Card className="w-full max-w-md bg-white border border-gray-200 shadow-lg">
        <CardHeader className="text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-blue-700 rounded-full flex items-center justify-center mx-auto mb-2">
              <Wallet className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold mb-2">DeFi Platform</h1>
          </div>
          <CardTitle className="text-2xl font-semibold tracking-tight text-gray-800">
            Seja bem-vindo(a)
          </CardTitle>
          <p className="text-sm text-gray-500">Faça login ou cadastre-se para continuar</p>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-3">
            <label className="text-sm text-gray-700 font-medium">Email</label>
            <div className="flex space-x-2">
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.currentTarget.value)}
                className="bg-gray-50 border-gray-300 text-gray-800 focus:ring-2 focus:ring-blue-400"
              />
              <Button
                onClick={handleSendCode}
                variant="secondary"
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 border border-gray-300 cursor-pointer"
                disabled={!email}
              >
                <Mail className="w-4 h-4 mr-1 text-blue-600" />
                Send
              </Button>
            </div>

            {hasTranslate ? (
              // Renderização simples sem animações quando Google Translate está ativo
              codeSent && (
                <div className="flex flex-col items-center mt-4 space-y-3">
                  <p className="text-sm text-gray-600">
                    Digite o código de 6 dígitos enviado para seu email:
                  </p>
                  <div className="flex justify-center space-x-2">
                    {code.map((digit, i) => (
                      <Input
                        key={i}
                        id={`code-${i}`}
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleCodeChange(i, e.target.value)}
                        className="w-10 h-12 text-center text-lg bg-gray-50 border border-gray-300 text-gray-800 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 rounded-md transition-all"
                      />
                    ))}
                  </div>
                  <Button
                    onClick={handleLogin}
                    className="w-full mt-4 bg-blue-600 hover:bg-blue-500 text-white shadow-sm cursor-pointer"
                    disabled={code.join('').length < 6}
                  >
                    <LogIn className="w-4 h-4 mr-1" />
                    Login
                  </Button>
                </div>
              )
            ) : (
              // Renderização com animações quando Google Translate não está ativo
              <AnimatePresence mode="wait">
                {codeSent && (
                  <motion.div
                    key="code-inputs"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className="flex flex-col items-center mt-4 space-y-3"
                  >
                    <p className="text-sm text-gray-600">
                      Digite o código de 6 dígitos enviado para seu email:
                    </p>
                    <div className="flex justify-center space-x-2">
                      {code.map((digit, i) => (
                        <Input
                          key={i}
                          id={`code-${i}`}
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleCodeChange(i, e.target.value)}
                          className="w-10 h-12 text-center text-lg bg-gray-50 border border-gray-300 text-gray-800 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 rounded-md transition-all"
                        />
                      ))}
                    </div>
                    <Button
                      onClick={handleLogin}
                      className="w-full mt-4 bg-blue-600 hover:bg-blue-500 text-white shadow-sm cursor-pointer"
                      disabled={code.join('').length < 6}
                    >
                      <LogIn className="w-4 h-4 mr-1" />
                      Login
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>

          <Separator className="bg-gray-200" />

          <div className="text-center">
            <Button
              onClick={signupWithPasskey}
              className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 cursor-pointer"
            >
              <KeyRound className="w-4 h-4 mr-2 text-blue-600" />
              Sign up with Passkey
            </Button>
          </div>

          <div className="text-center">
            <Button
              onClick={handleOAuth}
              disabled={loading}
              className="w-full bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin w-4 h-4 mr-2 text-blue-600" />
                  Logging in...
                </>
              ) : (
                <>
                  <img
                    src="https://www.svgrepo.com/show/475656/google-color.svg"
                    alt="Google"
                    className="w-4 h-4 mr-2"
                  />
                  Log in with Google
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}