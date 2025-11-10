'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface NASAFormData {
  mentalDemand: number | null;
  physicalDemand: number | null;
  temporalDemand: number | null;
  performance: number | null;
  effort: number | null;
  frustration: number | null;
}

function NASATLXContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [platformName, setPlatformName] = useState<string>('Plataforma');
  const [formData, setFormData] = useState<NASAFormData>({
    mentalDemand: null,
    physicalDemand: null,
    temporalDemand: null,
    performance: null,
    effort: null,
    frustration: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const sessionIdParam = searchParams?.get('sessionId');
    const userIdParam = searchParams?.get('userId');

    if (sessionIdParam) {
      const parsedSessionId = parseInt(sessionIdParam, 10);
      setSessionId(parsedSessionId);
      
      fetch('/api/user/session/get', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId: parsedSessionId }),
      })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.session) {
            const platformId = data.session.platformId;
            const withUsabilityId = parseInt(process.env.NEXT_PUBLIC_WITH_USABILITY_ID || '1', 10);
            
            if (platformId === withUsabilityId) {
              setPlatformName('With Usability');
            } else {
              setPlatformName('No Usability');
            }
          }
        })
        .catch(err => console.error('Error fetching session info:', err));
    }
    
    if (userIdParam) {
      setUserId(parseInt(userIdParam, 10));
    }

    setLoading(false);
  }, [searchParams]);

  const updateFormData = (field: keyof NASAFormData, value: number | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!sessionId) {
      alert('Erro: Session ID não encontrado.');
      return;
    }

    if (!userId) {
      alert('Erro: ID do usuário não encontrado.');
      return;
    }

    setSaving(true);
    
    try {
      const response = await fetch('/api/nasa-tlx/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          ...formData,
        }),
      });

      const data = await response.json();
      if (data.success) {
        router.push(`/${userId}/testing-journey?completed=true`);
      } else {
        console.error('Failed to save NASA TLX response:', data.error);
        alert('Erro ao salvar resposta. Por favor, tente novamente.');
        setSaving(false);
      }
    } catch (error) {
      console.error('Error saving NASA TLX response:', error);
      alert('Erro ao salvar resposta. Por favor, tente novamente.');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-gray-600">Carregando...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!sessionId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-red-600">Erro: Session ID não encontrado. Por favor, volte à página anterior.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 🔧 Corrigido: O valor interno é mantido no estado local e só é confirmado no blur
  const SliderComponent = ({
    label,
    description,
    value,
    onCommit,
  }: {
    label: string;
    description: string;
    value: number | null;
    onCommit: (value: number | null) => void;
  }) => {
    const [internal, setInternal] = useState<string>(value?.toString() ?? '');

    useEffect(() => {
      if (value !== null && value.toString() !== internal) {
        setInternal(value.toString());
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      // Permite digitar livremente
      setInternal(inputValue);
    };

    const handleBlur = () => {
      if (internal === '') {
        onCommit(null);
        return;
      }
      const numValue = Number(internal);
      if (isNaN(numValue) || numValue < 0) {
        setInternal('');
        onCommit(null);
      } else if (numValue > 100) {
        setInternal('100');
        onCommit(100);
      } else {
        onCommit(numValue);
      }
    };

    return (
      <div className="space-y-2">
        <div>
          <Label className="text-base font-semibold">{label}</Label>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-600 font-medium whitespace-nowrap">
              0 (Muito baixo)
            </span>
            <Input
              type="number"
              min={0}
              max={100}
              step={1}
              value={internal}
              onChange={handleChange}
              onBlur={handleBlur}
              className="text-center text-2xl font-bold text-blue-600 bg-blue-50 px-4 py-2 w-32"
            />
            <span className="text-xs text-gray-600 font-medium whitespace-nowrap">
              100 (Muito alto)
            </span>
          </div>
        </div>
      </div>
    );
  };

  const FormSection = ({
    title,
    data,
    onUpdate,
  }: {
    title: string;
    data: NASAFormData;
    onUpdate: (field: keyof NASAFormData, value: number | null) => void;
  }) => (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <SliderComponent
          label="1. Exigência Mental (Mental Demand)"
          description="Quanto esforço mental e concentração foram necessários para usar a plataforma?"
          value={data.mentalDemand}
          onCommit={(v) => onUpdate('mentalDemand', v)}
        />
        <SliderComponent
          label="2. Exigência Física (Physical Demand)"
          description="Quanto esforço físico foi necessário?"
          value={data.physicalDemand}
          onCommit={(v) => onUpdate('physicalDemand', v)}
        />
        <SliderComponent
          label="3. Exigência Temporal (Temporal Demand)"
          description="Quão pressionado(a) pelo tempo você se sentiu?"
          value={data.temporalDemand}
          onCommit={(v) => onUpdate('temporalDemand', v)}
        />
        <SliderComponent
          label="4. Desempenho (Performance)"
          description="Quão satisfeito(a) você ficou com o seu desempenho?"
          value={data.performance}
          onCommit={(v) => onUpdate('performance', v)}
        />
        <SliderComponent
          label="5. Esforço (Effort)"
          description="Quanto esforço total você precisou fazer?"
          value={data.effort}
          onCommit={(v) => onUpdate('effort', v)}
        />
        <SliderComponent
          label="6. Frustração (Frustration Level)"
          description="Quão irritado(a) ou frustrado(a) você se sentiu?"
          value={data.frustration}
          onCommit={(v) => onUpdate('frustration', v)}
        />
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 p-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center mb-4">
              Avaliação NASA TLX
            </CardTitle>
            <CardDescription className="text-lg text-center">
              Avalie o quanto cada aspecto descreve o esforço e a experiência que você teve.
            </CardDescription>
          </CardHeader>
        </Card>

        <FormSection title="Avaliação" data={formData} onUpdate={updateFormData} />

        <div className="flex justify-center pt-4">
          <Button
            onClick={handleSubmit}
            disabled={saving || !sessionId}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Salvando...' : 'Concluir'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function NASATLXPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 p-4">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <p className="text-center text-gray-600">Carregando...</p>
            </CardContent>
          </Card>
        </div>
      }
    >
      <NASATLXContent />
    </Suspense>
  );
}