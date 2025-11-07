'use client';

import '@rainbow-me/rainbowkit/styles.css';
import {
  getDefaultConfig,
  RainbowKitProvider,
  Locale,
} from '@rainbow-me/rainbowkit';

import { WagmiProvider } from 'wagmi';
import {
  sepolia,
} from 'wagmi/chains';
import {
  QueryClientProvider,
  QueryClient,
} from "@tanstack/react-query";
import { useRouter } from 'next/navigation';
import { http, fallback } from 'wagmi';
import { AppContextProvider } from '@/contexts/AppContext';

const config = getDefaultConfig({
    appName: 'DeFi Platform',
    projectId: process.env.NEXT_PUBLIC_PROJECT_ID as string,
    chains: [sepolia],
    transports: {
      [sepolia.id]: fallback([
        http(process.env.NEXT_PUBLIC_ALCHEMY_URL as string)
      ]),
    },
    ssr: true,
  });

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10000, // 10 segundos
      refetchInterval: 30000, // 30 segundos
      retry: 2,
      retryDelay: 1000,
    },
  },
});


export default function RainbowKitLayout({ children }: { children: React.ReactNode }) {

  const { locale } = useRouter() as unknown as { locale: Locale };

  return (
    <AppContextProvider>
      <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            <RainbowKitProvider modalSize="compact" locale={locale}>
              {children}
            </RainbowKitProvider>
          </QueryClientProvider>
      </WagmiProvider>
    </AppContextProvider>
  );
}



