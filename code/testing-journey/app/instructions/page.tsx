'use client';

import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  MessageCircle,
  ArrowRight,
  ArrowLeft,
  Wallet,
  ArrowDown,
  ArrowUpRight,
  LogOut,
  Info,
  Copy,
  Check,
} from 'lucide-react';
import { useState } from 'react';

export default function InstructionsPage() {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);
  const walletAddress = '0x41415c8842a214db47765e4b0fe39a4530b0b7c0';
  const emailAddress = 'emanuele.martins@sou.inteli.edu.br';

  const handleGoHome = () => {
    router.push('/');
  };

  const handleAssistance = () => {
    window.open('https://wa.me/5531995279660?text=Olá, estou participando da pesquisa e preciso de ajuda.', '_blank');
  };

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  };

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(emailAddress);
      setEmailCopied(true);
      setTimeout(() => setEmailCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy email:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 p-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader className="text-center relative">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold mb-2">
              Instruções do Teste
            </CardTitle>
            <CardDescription className="text-lg">
              Guia passo a passo para executar os testes
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Overview Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-blue-600" />
              Visão Geral do Fluxo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700 leading-relaxed">
              O fluxo de testes é composto por <strong>2 etapas</strong>, onde você terá contato
              com duas plataformas diferentes mas com funções iguais. Ao finalizar a interação com
              cada plataforma será solicitado o preenchimento de um formulário sobre suas percepções.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-900 text-sm">
                <strong>Importante:</strong> Cada formulário possui 6 perguntas e leva em média
                3-5 minutos para ser respondido.
              </p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-purple-900 text-sm mb-3">
                    <strong>Nota:</strong> No campo inferior direito terá um botão flutuante azul
                    (redondo com um <strong>i</strong>) que direciona para essas instruções novamente,
                    caso necessário.
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-white font-bold text-xl">i</span>
                    </div>
                    <p className="text-purple-800 text-xs italic">
                      Exemplo do botão flutuante
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Platform 1 Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <Wallet className="w-5 h-5 text-green-600" />
              Plataforma 1
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Prerequisites */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-4">
              <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Pré-requisitos
              </h3>
              <div className="space-y-3 text-green-800 text-sm">
                <p>
                  • Instalar MetaMask{' '}
                  <a
                    href="https://chromewebstore.google.com/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline inline-flex items-center gap-1"
                  >
                    (clique aqui para baixar)
                    <ExternalLink className="w-3 h-3" />
                  </a>{' '}
                  e seguir os passos previamente explicados no próprio aplicativo
                </p>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
                  <p className="font-semibold text-green-900 mb-2">
                    • Solicitar tokens nativos para gás (Ethereum Sepolia)
                  </p>
                  <p className="text-sm text-gray-700">
                    Para realizar as transações na plataforma, você precisará de tokens ETH na rede Sepolia para pagar as taxas de gás. Siga os passos abaixo:
                  </p>
                  <div className="space-y-2 text-sm text-gray-700">
                    <p>
                      <strong>Passo 1:</strong> Acesse o link:{' '}
                      <a
                        href="https://cloud.google.com/application/web3/faucet/ethereum/sepolia"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline inline-flex items-center gap-1 font-medium"
                      >
                        Google Cloud Web3 Faucet
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </p>
                    <p>
                      <strong>Passo 2:</strong> Coloque o endereço da carteira e clique em "Get 0.05 Sepolia ETH"
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-yellow-900 mb-2">
                      <strong>Problemas ou dúvidas?</strong> Se você encontrar dificuldades ao solicitar os tokens do faucet, instalar o MetaMask ou tiver qualquer dúvida, clique no botão abaixo para solicitar assistência.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAssistance}
                      className="border-yellow-300 text-yellow-700 hover:bg-yellow-100 cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Solicitar Assistência
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Platform 1 Steps */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-green-600" />
                Passos a serem cumpridos ao interagir com a plataforma:
              </h3>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-700">
                  <strong>Nota:</strong> Repare que a sua carteira já terá tokens USD
                  previamente para realizar a interação.
                </p>
              </div>
              <ol className="space-y-3 list-decimal list-inside">
                <li className="text-gray-700 flex items-start gap-2">
                  <span className="font-medium">1. Realizar um depósito</span>
                </li>
                <li className="text-gray-700 flex items-start gap-2">
                  <span className="font-medium">2. Fazer um swap de USD para WBTC</span>
                </li>
                <li className="text-gray-700 flex items-start gap-2">
                  <span className="font-medium">
                    3. Transferir tokens para outra carteira → Enviar para{' '}
                    <button
                      onClick={handleCopyAddress}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded text-blue-700 font-mono text-sm transition-colors cursor-pointer"
                      title="Clique para copiar"
                    >
                      {walletAddress}
                      {copied ? (
                        <Check className="w-3 h-3 text-green-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </span>
                </li>
                <li className="text-gray-700 flex items-start gap-2">
                  <span className="font-medium">4. Retirar tokens da plataforma</span>
                </li>
                <li className="text-gray-700 flex items-start gap-2">
                  <span className="font-medium">5. Fazer logout</span>
                </li>
              </ol>
            </div>

            {/* Warning */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <p className="text-yellow-900 text-sm">
                  <strong>Importante!</strong> Ao fazer logout não será mais possível entrar na
                  plataforma, então só saia em caso de finalização ou desistência.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Platform 2 Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <Wallet className="w-5 h-5 text-purple-600" />
              Plataforma 2
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Platform 2 Steps */}
            <div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-700">
                  <strong>Nota:</strong> Repare que a sua carteira já terá tokens USD
                  previamente para realizar a interação.
                </p>
              </div>
              <ol className="space-y-3 list-decimal list-inside">
                <li className="text-gray-700 flex items-start gap-2">
                  <span className="font-medium">1. Realizar um depósito</span>
                </li>
                <li className="text-gray-700 flex items-start gap-2">
                  <span className="font-medium">2. Fazer um swap de USD para WBTC</span>
                </li>
                <li className="text-gray-700 flex items-start gap-2">
                  <span className="font-medium">
                    3. Transferir tokens para outra carteira → envie para{' '}
                    <button
                      onClick={handleCopyEmail}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded text-blue-700 font-mono text-sm transition-colors cursor-pointer"
                      title="Clique para copiar"
                    >
                      {emailAddress}
                      {emailCopied ? (
                        <Check className="w-3 h-3 text-green-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </span>
                </li>
                <li className="text-gray-700 flex items-start gap-2">
                  <span className="font-medium">4. Retirar tokens da plataforma</span>
                </li>
                <li className="text-gray-700 flex items-start gap-2">
                  <span className="font-medium">5. Fazer logout</span>
                </li>
              </ol>
            </div>

            {/* Warning */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <p className="text-yellow-900 text-sm">
                  <strong>Importante!</strong> Ao fazer logout não será mais possível entrar na
                  plataforma, então só saia em caso de finalização ou desistência.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

