"use client"
import { Card } from "@/components/ui/card"
import { useAccount, useReadContract } from 'wagmi';
import Vault from "../../abi/Vault.json"
import { formatEther, formatUnits } from "viem";
import { memo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";


const DashboardPage = memo(function DashboardPage() {
  const { address } = useAccount();
  const [isMinting, setIsMinting] = useState(false);
  const [mintStatus, setMintStatus] = useState<string>("");

  const { data: usdBalance, refetch: refetchUsdBalance } = useReadContract({
    address: process.env.NEXT_PUBLIC_VAULT_ADDRESS as `0x${string}`,
    abi: Vault.abi,
    functionName: 'balanceOfToken',
    args: [address!, process.env.NEXT_PUBLIC_USD_TOKEN_ADDRESS as `0x${string}`],
    query: {
      enabled: !!address,
      refetchInterval: 30000,
      staleTime: 10000,
    },
  });

  const { data: wbtcBalance } = useReadContract({
    address: process.env.NEXT_PUBLIC_VAULT_ADDRESS as `0x${string}`,
    abi: Vault.abi,
    functionName: 'balanceOfToken',
    args: [address!, process.env.NEXT_PUBLIC_WBTC_TOKEN_ADDRESS as `0x${string}`],
    query: {
      enabled: !!address,
      refetchInterval: 30000,
      staleTime: 10000,
    },
  });

  const getPublicClient = () => {
    return createPublicClient({
      chain: sepolia,
      transport: http(process.env.NEXT_PUBLIC_ALCHEMY_URL),
    });
  };

  const handleRequestTestUSD = async () => {
    if (!address) {
      alert("Carteira não conectada");
      return;
    }

    setIsMinting(true);
    setMintStatus("Enviando transação...");

    try {
      const mintResponse = await fetch('/api/mint-usd', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userAddress: address }),
      });

      const mintResult = await mintResponse.json();

      if (mintResult.success && mintResult.transactionHash) {
        setMintStatus("Aguardando confirmação da transação...");
        
        // Aguardar a confirmação da transação na blockchain
        const publicClient = getPublicClient();
        
        try {
          await publicClient.waitForTransactionReceipt({
            hash: mintResult.transactionHash as `0x${string}`,
            timeout: 60000, // 60 segundos de timeout
          });

          setMintStatus("Transação confirmada! Atualizando saldos...");
          alert("USD de teste solicitado com sucesso!");
          
          // Aguardar um pouco para garantir que a blockchain atualizou
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Atualizar os saldos após a confirmação
          await refetchUsdBalance();
        } catch (waitError) {
          console.error('Erro ao aguardar confirmação:', waitError);
          // Mesmo se houver erro ao aguardar, tentar atualizar os saldos
          setMintStatus("Verificando saldos...");
          await new Promise(resolve => setTimeout(resolve, 3000));
          await refetchUsdBalance();
          alert("Transação enviada! Verificando saldos...");
        }
      } else if (mintResult.success) {
        // Se não há transactionHash mas foi bem-sucedido, aguardar e atualizar
        setMintStatus("Processando...");
        await new Promise(resolve => setTimeout(resolve, 3000));
        await refetchUsdBalance();
        alert("USD de teste solicitado com sucesso!");
      } else {
        alert(mintResult.error || "Erro ao solicitar USD de teste");
      }
    } catch (error) {
      console.error('Erro ao solicitar USD de teste:', error);
      alert("Erro ao solicitar USD de teste");
    } finally {
      setIsMinting(false);
      setMintStatus("");
    }
  };


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Gerencie seus ativos de forma descentralizada</p>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Saldo depositado</h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">USD</span>
            <span className="font-semibold">{usdBalance && typeof usdBalance === 'bigint' ? Number(formatUnits(usdBalance, 18)) : "0.0000"} USD</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">WBTC</span>
            <span className="font-semibold">{wbtcBalance && typeof wbtcBalance === 'bigint' ? Number(formatUnits(wbtcBalance, 8)) : "0.00"} WBTC</span>
          </div>
        </div>

        {/* Botão para solicitar USD de teste */}
        <div className="pt-4 mt-4 border-t border-gray-200">
          <Button
            onClick={handleRequestTestUSD}
            disabled={isMinting || !address}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isMinting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Processando...
              </>
            ) : (
              "Solicitar USD de teste"
            )}
          </Button>
        </div>
      </Card>

      {/* Popup de loading durante o mint */}
      {isMinting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md bg-white border border-gray-200 shadow-lg p-6">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-lg font-medium text-gray-800">Solicitando USD de teste...</p>
              <p className="text-sm text-gray-600 text-center">
                {mintStatus || "Estamos processando sua solicitação. Isso pode levar alguns segundos."}
              </p>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
});

export default DashboardPage;
