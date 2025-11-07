'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { GraduationCap, Cpu, User, ArrowLeft } from 'lucide-react';

export default function FormPage() {
  const router = useRouter();
  const { setUserId } = useUser();
  const [age, setAge] = useState('');
  const [educationLevel, setEducationLevel] = useState('');
  const [blockchainKnowledge, setBlockchainKnowledge] = useState('');
  const [educationLevels, setEducationLevels] = useState<any[]>([]);
  const [blockchainLevels, setBlockchainLevels] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchLevels = async () => {
      try {
        const [eduResponse, blockResponse] = await Promise.all([
          fetch('/api/levels/education'),
          fetch('/api/levels/blockchain'),
        ]);

        const eduData = await eduResponse.json();
        const blockData = await blockResponse.json();

        setEducationLevels(eduData.rows || eduData);
        setBlockchainLevels(blockData.rows || blockData);
      } catch (error) {
        console.error('Error fetching levels:', error);
      }
    };

    fetchLevels();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (age && educationLevel && blockchainKnowledge) {
      setLoading(true);
      try {
        const response = await fetch('/api/user/new', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ educationLevelId: educationLevel, blockchainKnowledgeLevelId: blockchainKnowledge, age }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('API Error:', response.status, errorText);
          alert('Erro ao criar usuário. Por favor, tente novamente.');
          return;
        }

        const data = await response.json();
        if (data.success && data.userId) {
          setUserId(data.userId);
          router.push(`/${data.userId}/testing-journey`);
        } else {
          console.error('Unexpected response format:', data);
          alert('Erro inesperado. Por favor, tente novamente.');
        }
      } catch (error) {
        console.error('Error submitting form:', error);
        alert('Erro ao enviar formulário. Por favor, tente novamente.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleGoHome = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleGoHome}
            className="absolute left-4 top-4 hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold mb-2">Formulário de Perfil</CardTitle>
          <CardDescription className="text-lg">
            Preencha suas informações para continuar
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <User className="w-5 h-5 text-blue-600" />
                <Label htmlFor="age" className="text-blue-900 font-semibold">
                  Idade
                </Label>
              </div>
              <Select value={age} onValueChange={setAge} >
                <SelectTrigger id="age" className="cursor-pointer w-full">
                  <SelectValue placeholder="Selecione sua idade" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 48 }, (_, i) => i + 18).map((ageValue) => (
                    <SelectItem key={ageValue} value={String(ageValue)}>
                      {ageValue}
                    </SelectItem>
                  ))}
                  <SelectItem value="65+">65+</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <GraduationCap className="w-5 h-5 text-purple-600" />
                <Label
                  htmlFor="education"
                  className="text-purple-900 font-semibold"
                >
                  Nível de escolaridade
                </Label>
              </div>
              <Select value={educationLevel} onValueChange={setEducationLevel}>
                <SelectTrigger id="education" className="cursor-pointer w-full">
                  <SelectValue placeholder="Selecione seu nível de escolaridade" />
                </SelectTrigger>
                <SelectContent>
                  {educationLevels.length > 0 ? (
                    educationLevels.map((level) => (
                      <SelectItem key={level.id} value={String(level.id)}>
                        {level.name}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      Loading...
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <Cpu className="w-5 h-5 text-green-600" />
                <Label
                  htmlFor="blockchain"
                  className="text-green-900 font-semibold"
                >
                  Nível de conhecimento de blockchain
                </Label>
              </div>
              <Select
                value={blockchainKnowledge}
                onValueChange={setBlockchainKnowledge}
              >
                <SelectTrigger id="blockchain" className="cursor-pointer w-full">
                  <SelectValue placeholder="Selecione seu nível de conhecimento de blockchain" />
                </SelectTrigger>
                <SelectContent>
                  {blockchainLevels.length > 0 ? (
                    blockchainLevels.map((level) => (
                      <SelectItem key={level.id} value={String(level.id)}>
                        {level.name}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      Loading...
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
              size="lg"
              disabled={!age || !educationLevel || !blockchainKnowledge || loading}
            >
              {loading ? 'Enviando...' : 'Continuar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}