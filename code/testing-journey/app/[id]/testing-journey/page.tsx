'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Lock, Compass, X, Loader2 } from 'lucide-react';

interface Step {
  id: number;
  route: string;
  platformId: number;
  type: 'platform' | 'form';
  sessionId?: number;
}

export default function ResultPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const userId = params?.id ? parseInt(params.id as string) : null;

  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(true);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [steps, setSteps] = useState<Step[]>([]);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const isCheckingRef = useRef(false);

  const checkSessionsStatus = useCallback(async () => {
    if (isCheckingRef.current || !userId || steps.length === 0) return;
    isCheckingRef.current = true;

    try {
      const nextCompleted = new Set<number>();

      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];

        if (step.type === 'platform') {
          const res = await fetch('/api/user/session/check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, platformId: step.platformId }),
          });
          const data = await res.json();

          if (data?.success && data?.completed && data?.session?.id) {
            nextCompleted.add(step.id);
            setSteps(prev =>
              prev.map(s =>
                s.id === step.id ? { ...s, sessionId: data.session.id } : s
              )
            );
          }
        } else {
          const platformStep = steps.find(
            s => s.type === 'platform' && s.platformId === step.platformId
          );
          let sessionIdToCheck = platformStep?.sessionId;

          if (!sessionIdToCheck) {
            const sessionRes = await fetch('/api/user/session/check', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId, platformId: step.platformId }),
            });
            const sessionData = await sessionRes.json();

            if (sessionData?.success && sessionData?.session?.id) {
              sessionIdToCheck = sessionData.session.id;
              // Atualiza o step da plataforma com o sessionId
              setSteps(prev =>
                prev.map(s =>
                  s.type === 'platform' && s.platformId === step.platformId
                    ? { ...s, sessionId: sessionIdToCheck }
                    : s
                )
              );
            }
          }

          if (sessionIdToCheck) {
            const res = await fetch('/api/nasa-tlx/check', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ sessionId: sessionIdToCheck }),
            });
            const data = await res.json();

            if (data?.success && data?.exists) {
              nextCompleted.add(step.id);
            }
          }
        }
      }

      setCompletedSteps(prev => {
        const updated = Array.from(new Set([...prev, ...nextCompleted]));
        return updated;
      });
    } catch (err) {
      console.error('Error checking sessions:', err);
    } finally {
      isCheckingRef.current = false;
    }
  }, [userId, steps]);


  useEffect(() => {
    if (!userId) {
      setLoading(false);
      setVerifying(false);
      return;
    }

    const stepsFixed: Step[] = [
      {
        id: 1,
        route: process.env.NEXT_PUBLIC_WITH_USABILITY_LINK as string,
        platformId: 2,
        type: 'platform',
      },
      {
        id: 2,
        route: '/nasa-tlx',
        platformId: 2,
        type: 'form',
      },
      {
        id: 3,
        route: process.env.NEXT_PUBLIC_NO_USABILITY_LINK as string,
        platformId: 1,
        type: 'platform',
      },
      {
        id: 4,
        route: '/nasa-tlx',
        platformId: 1,
        type: 'form',
      }
    ];

    setSteps(stepsFixed);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    if (!loading && steps.length > 0 && userId) {
      (async () => {
        setVerifying(true);
        await checkSessionsStatus();
        setVerifying(false);
      })();
    }
  }, [loading, userId, steps, checkSessionsStatus]);

  useEffect(() => {
    const completed = searchParams?.get('completed');
    if (completed === 'true' && !loading && steps.length > 0 && userId) {
      (async () => {
        setVerifying(true);
        await checkSessionsStatus();
        setVerifying(false);
        router.replace(`/${userId}/testing-journey`, { scroll: false });
      })();
    }
  }, [searchParams, loading, steps, userId, router, checkSessionsStatus]);

  const handleNavigate = async (step: Step) => {
    if (!userId) return alert('Erro: ID do usuário não encontrado.');

    if (step.type === 'platform') {
      const res = await fetch('/api/user/session/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, platformId: step.platformId }),
      });
      const data = await res.json();

      if (data?.success && data?.sessionId) {
        setSteps(prev =>
          prev.map(s =>
            s.id === step.id ? { ...s, sessionId: data.sessionId } : s
          )
        );
        window.location.href = `${step.route}/${userId}/${data.sessionId}`;
      } else {
        alert('Erro ao criar sessão.');
      }
    } else {
      const platformStep = steps.find(
        s => s.type === 'platform' && s.platformId === step.platformId
      );
      const sessionId = platformStep?.sessionId;

      if (!sessionId)
        return alert('Erro: complete a plataforma antes do formulário.');

      router.push(`${step.route}?sessionId=${sessionId}&userId=${userId}`);
    }
  };

  const isStepUnlocked = (i: number) =>
    i === 0 ? true : completedSteps.includes(steps[i - 1].id);
  const isStepCompleted = (id: number) => completedSteps.includes(id);

  const allStepsCompleted = steps.length > 0 && completedSteps.length === steps.length;

  useEffect(() => {
    if (allStepsCompleted && !loading && !verifying) {
      setShowCompletionModal(true);
    }
  }, [allStepsCompleted, loading, verifying]);

  if (loading || verifying || steps.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="w-6 h-6 text-gray-600 animate-spin" />
          <p className="text-center text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {showCompletionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md shadow-2xl relative">
            <button
              onClick={() => setShowCompletionModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <CardHeader className="text-center">
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-12 h-12 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold mb-2 text-green-700">
                Parabéns!
              </CardTitle>
              <CardDescription className="text-base text-gray-700">
                Você finalizou o experimento, obrigada pela contribuição!
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 pb-6">
              <div className="flex justify-center">
                <Button
                  onClick={() => setShowCompletionModal(false)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Fechar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 p-4">
        <Card className="w-full max-w-2xl shadow-lg">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Compass className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold mb-2">Fluxo de Teste</CardTitle>
            <CardDescription className="text-lg text-gray-600">
              Complete cada etapa para desbloquear a próxima
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-8">
            <Button
              onClick={() => window.open('/instructions', '_blank')}
              className="cursor-pointer w-full bg-blue-600 hover:bg-blue-700 text-white py-6 flex items-center justify-center gap-3 text-lg font-semibold"
            >
              <span className="text-3xl font-bold">i</span>
              Acessar instruções
            </Button>

            {steps.map((step, i) => {
              const unlocked = isStepUnlocked(i);
              const completed = isStepCompleted(step.id);
              const label =
                step.type === 'platform'
                  ? `Plataforma ${step.platformId}`
                  : `Formulário ${step.platformId}`;

              return (
                <div key={step.id} className="flex flex-col items-center gap-2">
                  <div
                    className={`w-full rounded-lg p-4 flex items-center justify-between border transition-all ${unlocked
                        ? completed
                          ? 'bg-green-50 border-green-200'
                          : 'bg-white border-gray-200 hover:border-blue-300'
                        : 'bg-gray-100 border-gray-300 opacity-80'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      {completed ? (
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                      ) : unlocked ? (
                        <div className="w-6 h-6 rounded-full border-2 border-blue-500" />
                      ) : (
                        <Lock className="w-5 h-5 text-gray-500" />
                      )}
                      <div>
                        <p className="font-semibold text-gray-900">{label}</p>
                        {completed && (
                          <p className="text-sm text-green-700">
                            Completado com sucesso
                          </p>
                        )}
                        {!completed && unlocked && (
                          <p className="text-sm text-blue-600">Pronto para iniciar</p>
                        )}
                        {!unlocked && <p className="text-sm text-gray-500">Bloqueado</p>}
                      </div>
                    </div>
                    {!completed && (
                      <Button
                        disabled={!unlocked}
                        onClick={() => handleNavigate(step)}
                        className={`${unlocked
                            ? 'bg-blue-600 hover:opacity-90 text-white cursor-pointer'
                            : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                          }`}
                      >
                        {unlocked ? 'Começar' : 'Bloqueado'}
                      </Button>
                    )}
                  </div>
                  {completed && step.id !== steps.length && (
                    <div className="w-1 h-6 bg-green-400 rounded-full"></div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </>
  );
}