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

// Get projectId with fallback for build time
const projectId = process.env.NEXT_PUBLIC_PROJECT_ID || '';

// Only validate in browser (client-side)
if (typeof window !== 'undefined' && !projectId) {
  throw new Error(
    'NEXT_PUBLIC_PROJECT_ID is required. Please set it in your .env.local file. ' +
    'Get your projectId from https://cloud.walletconnect.com/'
  );
}

// Create config with projectId (will use empty string during build if not set)
const config = getDefaultConfig({
    appName: 'DeFi Platform',
    projectId: projectId || '00000000000000000000000000000000', // Temporary placeholder for build
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



