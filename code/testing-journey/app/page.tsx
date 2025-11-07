'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Shield, Lock, FileText } from 'lucide-react';

export default function ConsentPage() {
  const router = useRouter();
  const [consented, setConsented] = useState(false);

  const handleNext = () => {
    if (consented) {
      router.push('/initial-form');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold mb-2">Pesquisa de Perfil</CardTitle>
          <CardDescription className="text-lg">
            Bem-vindo(a) ao nosso sistema de pesquisa
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Sobre esta Pesquisa</h3>
              <p className="text-blue-800 text-sm leading-relaxed">
                Esta é uma pesquisa acadêmica que visa compreender o perfil dos usuários
                de plataformas DeFi (Finanças Descentralizadas). Todas as informações coletadas são totalmente anônimas. Não coletamos
                nomes, e-mails ou qualquer informação que permita sua identificação pessoal.
              </p>
            </div>

          </div>

          <div className="border-t pt-4">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={consented}
                onChange={(e) => setConsented(e.target.checked)}
                className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
              />
              <span className="text-sm text-gray-700 group-hover:text-gray-900">
                Eu concordo em participar desta pesquisa e confirmo que li e compreendi as
                informações acima.
              </span>
            </label>
          </div>

          <Button
            onClick={handleNext}
            disabled={!consented}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
            size="lg"
          >
            Próximo
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}