"use client";

import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowDownLeft, Send, Repeat, ArrowUpRight, LoaderCircle, Info } from "lucide-react";
import Link from "next/link";
import { memo, useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ethImage from "@/images/ethereum-eth-logo.svg";
import btcImage from "@/images/bitcoin-btc-logo.svg";
import usdImage from "@/images/dolar-usd-logo.svg";
import { formatUnits} from "viem";
import BaseToken from "@/abi/BaseToken.json";
import Vault from "@/abi/Vault.json";
import { getPublicClient } from "@/lib/utils";
import { TOKEN_ADDRESSES } from "@/lib/utils";
import {usePrivy} from '@privy-io/react-auth';

const quickActions = [
  {
    label: "Depositar",
    href: "/dashboard/deposit",
    icon: ArrowDownLeft,
    description: "Adicione fundos à sua conta DeFi.",
    color: "bg-green-100 text-green-700 hover:bg-green-200",
  },
  {
    label: "Transferir",
    href: "/dashboard/transfer",
    icon: Send,
    description: "Envie tokens para outro usuário.",
    color: "bg-blue-100 text-blue-700 hover:bg-blue-200",
  },
  {
    label: "Trocar",
    href: "/dashboard/swap",
    icon: Repeat,
    description: "Troque seus ativos de forma instantânea.",
    color: "bg-yellow-100 text-yellow-700 hover:bg-yellow-200",
  },
  {
    label: "Sacar",
    href: "/dashboard/withdraw",
    icon: ArrowUpRight,
    description: "Retire seus fundos para a carteira.",
    color: "bg-red-100 text-red-700 hover:bg-red-200",
  },
];

const VAULT_ADDRESS = process.env.NEXT_PUBLIC_VAULT_ADDRESS as `0x${string}` | undefined;

interface TokenBalance {
  wallet: string;
  deposited: string;
}

const DashboardPage = memo(function DashboardPage() {
  const { user, ready } = usePrivy();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [balances, setBalances] = useState<Record<string, TokenBalance>>({
    
    ETH: { wallet: "0", deposited: "0" },
    USD: { wallet: "0", deposited: "0" },
    WBTC: { wallet: "0", deposited: "0" },
  });
  const [loading, setLoading] = useState(true);

  const fetchBalances = useCallback(async () => {
      if (!ready || !user) {
        return;
      }

      try {
        setLoading(true);
        const accountAddress = user?.linkedAccounts?.find((account) => account.type === 'smart_wallet')?.address as `0x${string}` | undefined;
        
        if (!accountAddress) {
          setLoading(false);
          return;
        }
        
        const publicClient = getPublicClient();

        const ethBalance = await publicClient.getBalance({
          address: accountAddress,
        });
        const ethBalanceFormatted = formatUnits(ethBalance, 18);

        let ethDeposited = "0";
        if (VAULT_ADDRESS) {
          try {
            const ethDepositedRaw = await publicClient.readContract({
              address: VAULT_ADDRESS,
              abi: Vault.abi,
              functionName: "balanceOfToken",
              args: [accountAddress, "0x0000000000000000000000000000000000000000" as `0x${string}`],
            });
            ethDeposited = formatUnits(ethDepositedRaw as bigint, 18);
            console.log("✅ [VAULT] Saldo ETH depositado no vault:", ethDeposited, "ETH");
          } catch (err) {
            console.error("❌ [VAULT] Erro ao buscar ETH depositado:", err);
          }
        }

        setBalances((prev) => ({
          ...prev,
          ETH: { wallet: ethBalanceFormatted, deposited: ethDeposited },
        }));

        for (const [symbol, tokenAddress] of Object.entries(TOKEN_ADDRESSES)) {

          if (symbol === "ETH" || !tokenAddress) {
            if (!tokenAddress) {
              console.log(`⚠️  [ON-CHAIN] Token ${symbol} sem endereço configurado, pulando...`);
            }
            continue;
          }
          try {
            
            const walletBalance = await publicClient.readContract({
              address: tokenAddress,
              abi: BaseToken.abi,
              functionName: "balanceOf", 
              args: [accountAddress],
            }) as bigint;


            const decimals = await publicClient.readContract({
              address: tokenAddress,
              abi: BaseToken.abi,
              functionName: "decimals",
            });

            const walletBalanceFormatted = formatUnits(
              walletBalance as bigint,
              decimals as number
            );

            let depositedBalanceFormatted = "0";
            if (VAULT_ADDRESS) {
              try {
                console.log(`🏦 [VAULT] Buscando saldo depositado de ${symbol} no vault...`);
                const depositedBalance = await publicClient.readContract({
                  address: VAULT_ADDRESS,
                  abi: Vault.abi,
                  functionName: "balanceOfToken", 
                  args: [accountAddress, tokenAddress],
                });
                depositedBalanceFormatted = formatUnits(
                  depositedBalance as bigint,
                  decimals as number
                );
              } catch (err) {
                console.error(`❌ [VAULT] Erro ao buscar ${symbol} depositado:`, err);
              }
            }

            setBalances((prev) => ({
              ...prev,
              [symbol]: {
                wallet: walletBalanceFormatted,
                deposited: depositedBalanceFormatted,
              },
            }));
          } catch (err) {
            console.error(`❌ [ON-CHAIN] Erro ao buscar saldo de ${symbol}:`, err);
          }
        }
        
      } catch (err) {
        console.error("❌ [ERRO GERAL] Erro ao buscar saldos:", err);
      } finally {
        setLoading(false);
      }
  }, [user, ready]);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  // Se veio de um mint recente, refetch após um delay para garantir que os valores estão atualizados
  useEffect(() => {
    const minted = searchParams.get('minted');
    if (minted === 'true') {
      // Remove o parâmetro da URL
      router.replace('/dashboard', { scroll: false });
      
      // Aguarda um pouco e refaz o fetch dos saldos para garantir que está atualizado
      const timeoutId = setTimeout(() => {
        console.log('🔄 Refazendo fetch dos saldos após mint...');
        fetchBalances();
      }, 2000);

      return () => clearTimeout(timeoutId);
    }
  }, [searchParams, router, fetchBalances]);

  const formatBalance = (balance: string) => {
    const num = parseFloat(balance);
    if (num === 0) return "0";
    if (num < 0.000001) return "< 0.000001";
    return num.toFixed(6);
  };

  return (
    <div className="space-y-8 p-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2 text-gray-800">Dashboard</h1>
        <p className="text-muted-foreground">
          Gerencie seus ativos de forma descentralizada
        </p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.href} href={action.href}>
              <Card
                className="p-4 hover:scale-98 bg-blue-50 rounded-xl transition-transform duration-150 hover:shadow-md cursor-pointer flex flex-col justify-between h-32"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Icon className="w-5 h-5 text-blue-800" />
                  <span className="font-semibold text-lg text-blue-800">{action.label}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {action.description}
                </p>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Saldo depositado</h2>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-4 h-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  Valor total de tokens que você depositou na plataforma e estão disponíveis para operações DeFi.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-8">
              <LoaderCircle className="w-5 h-5 animate-spin" />
              <span className="text-muted-foreground">Carregando saldos...</span>
            </div>
          ) : (
            <div className="space-y-4">

              {/* USD */}
              <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                <span className="flex items-center gap-2 text-gray-600 font-medium">
                  <img src={usdImage.src} alt="USD" className="w-8 h-8" />
                  USD
                </span>
                <span className="font-semibold text-gray-900">
                  {formatBalance(balances.USD.deposited)} USD
                </span>
              </div>

              {/* WBTC */}
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-gray-600 font-medium">
                  <img src={btcImage.src} alt="WBTC" className="w-8 h-8" />
                  WBTC
                </span>
                <span className="font-semibold text-gray-900">
                  {formatBalance(balances.WBTC.deposited)} WBTC
                </span>
              </div>
            </div>
          )}
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Saldo na carteira</h2>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-4 h-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  Valor total de tokens que você possui na sua carteira e ainda não foram depositados na plataforma.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-8">
              <LoaderCircle className="w-5 h-5 animate-spin" />
              <span className="text-muted-foreground">Carregando saldos...</span>
            </div>
          ) : (
            <div className="space-y-4">

              {/* USD */}
              <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                <span className="flex items-center gap-2 text-gray-600 font-medium">
                  <img src={usdImage.src} alt="USD" className="w-8 h-8" />
                  USD
                </span>
                <span className="font-semibold text-gray-900">
                  {formatBalance(balances.USD.wallet)} USD
                </span>
              </div>

              {/* WBTC */}
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-gray-600 font-medium">
                  <img src={btcImage.src} alt="WBTC" className="w-8 h-8" />
                  WBTC
                </span>
                <span className="font-semibold text-gray-900">
                  {formatBalance(balances.WBTC.wallet)} WBTC
                </span>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
});

export default DashboardPage;