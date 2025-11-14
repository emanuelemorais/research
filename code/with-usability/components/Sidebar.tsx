"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import {
  Wallet,
  Repeat,
  ArrowDownLeft,
  Send,
  ArrowUpRight,
  LayoutDashboard,
  LogOut,
  Copy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePrivy } from "@privy-io/react-auth";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from 'lucide-react';
import { getPublicClient } from "@/lib/utils";
import { useAppContext } from "@/contexts/AppContext";

export function Sidebar() {
  const pathname = usePathname();
  const params = useParams();
  const { logout, user, ready } = usePrivy();
  const [copied, setCopied] = useState(false);
  const router = useRouter();
  const publicClient = getPublicClient();
  //const { userId, sessionId } = useAppContext();

  const urlUserId = params?.userId as string;
  const urlSessionId = params?.sessionId as string;
  const basePath =  `/${urlUserId}/${urlSessionId}/dashboard`;

  const menuItems = [
    { href: basePath, label: "Dashboard", icon: LayoutDashboard },
    { href: `${basePath}/deposit`, label: "Depositar", icon: ArrowDownLeft },
    { href: `${basePath}/transfer`, label: "Transferir", icon: Send },
    { href: `${basePath}/swap`, label: "Trocar", icon: Repeat },
    { href: `${basePath}/withdraw`, label: "Sacar", icon: ArrowUpRight },
  ];


  const wallet = user?.linkedAccounts?.find((account) => account.type === 'smart_wallet');
  const googleAccount = user?.linkedAccounts.find((acc) => acc.type === "google_oauth");
  const emailAccount = user?.linkedAccounts.find((acc) => acc.type === "email");

  const email =
    googleAccount?.email || emailAccount?.address || null;

  const shortAddress = wallet?.address
    ? `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`
    : null;

  const handleCopy = () => {
    if (wallet) {
      navigator.clipboard.writeText(wallet.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const saveButtonClick = async (buttonId: number) => {
    if (!urlSessionId) return;
    try {
      // Converter urlSessionId para número (a API espera número)
      const sessionId = parseInt(urlSessionId);
      if (isNaN(sessionId)) {
        console.error('urlSessionId não é um número válido:', urlSessionId);
        return;
      }
      
      await fetch("/api/button-click", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ buttonId, sessionId }),
      });
    } catch (error) {
      console.error("Error saving button click:", error);
      // Não bloqueia a funcionalidade se houver erro ao salvar o clique
    }
  };

  const saveTaskCompleted = async (taskId: number) => {
    if (!urlSessionId) return;
    try {
      // Converter urlSessionId para número (a API espera número)
      const sessionId = parseInt(urlSessionId);
      if (isNaN(sessionId)) {
        console.error('urlSessionId não é um número válido:', urlSessionId);
        return;
      }
      
      await fetch("/api/task-completed", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ taskId, sessionId }),
      });
    } catch (error) {
      console.error("Error saving completed task:", error);
      // Não bloqueia a funcionalidade se houver erro ao salvar a tarefa
    }
  };

  const handleLogout = async () => {
    try {
      await saveButtonClick(6); 

      if (urlUserId) {
        const platformId = process.env.NEXT_PUBLIC_PLATFORM_ID;

        // Verificar se platformId está definido
        if (!platformId) {
          console.error('platformId não está definido nas variáveis de ambiente');
          return;
        }

        // Converter urlUserId para número (a API espera número, não string)
        const userId = parseInt(urlUserId);
        
        if (isNaN(userId)) {
          console.error('urlUserId não é um número válido:', urlUserId);
          return;
        }

        const sessionResponse = await fetch("/api/user/session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId, platformId: parseInt(platformId, 10) }),
        });

        if (!sessionResponse.ok) {
          const errorData = await sessionResponse.json();
          console.error('Erro na resposta:', errorData);
        } else {
          const responseData = await sessionResponse.json();
          console.log('Resposta de sucesso:', responseData);
          await saveTaskCompleted(6);
        }
        
      } else {
        console.warn('userId não disponível, pulando atualização de sessão');
      }
    } catch (error) {
      console.error("Error updating session:", error);
    }
    
    await logout();
    window.location.href = `${process.env.NEXT_PUBLIC_PRE_FORM_LINK}/${urlUserId}/testing-journey`;
  };

  useEffect(() => {
    if (ready && !user) {
      router.push(`/${urlUserId}/${urlSessionId}`);
    }
  }, [ready, user, router, urlUserId, urlSessionId]);

  return (
    <aside className="w-64 border-r border-border bg-card flex flex-col">
      <div className="p-6 border-b border-border">
        <Link href={basePath} className="flex flex-col items-center gap-2">
          <div className="w-14 h-14 bg-blue-700 rounded-full flex items-center justify-center mx-auto mb-2">
            <Wallet className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold mb-2 text-gray-800">DeFi Platform</h1>
        </Link>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                    isActive
                      ? "bg-blue-700 text-primary-foreground"
                      : "hover:bg-blue-50 text-muted-foreground hover:text-blue-700"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-border space-y-3">
        {!ready ? (
            <div className="flex items-center justify-center gap-2">
              <LoaderCircle className="w-4 h-4 animate-spin" />
              Carregando smart account…
            </div>
        )
        : wallet && (
            <div className="text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-gray-800 mb-1">Carteira</p>
                <div className="text-xs text-gray-500 truncate bg-blue-50 rounded-lg p-1 px-2 w-fit">
                {publicClient.chain.name}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-gray-600">{shortAddress}</span>
                <button
                  onClick={handleCopy}
                  className="text-blue-600 hover:text-blue-700 transition cursor-pointer"
                  title="Copy address"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              
              {email && (
                <p className="mt-2 text-xs text-gray-500 truncate">
                  {email}
                </p>
              )}
            </div>
          )
         }
        <Button
          onClick={handleLogout}
          className={cn(
            "cursor-pointer flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg transition-colors bg-red-700 hover:bg-red-600 text-primary-foreground font-medium"
          )}
        >
          <LogOut className="w-4 h-4" />
          Sair
        </Button>
      </div>
    </aside>
  );
}