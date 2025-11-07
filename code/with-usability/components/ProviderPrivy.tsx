'use client';

import {PrivyProvider} from '@privy-io/react-auth';
import {SmartWalletsProvider} from '@privy-io/react-auth/smart-wallets';
import { AppContextProvider } from '@/contexts/AppContext';

// Get appId - will be empty during build if not set
const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

export default function Providers({children}: {children: React.ReactNode}) {
  // During build/SSR, if appId is not set, render without PrivyProvider
  // This allows the build to succeed, but the app will need the env var at runtime
  if (!privyAppId) {
    // Only log error in browser (client-side)
    if (typeof window !== 'undefined') {
      console.error(
        'NEXT_PUBLIC_PRIVY_APP_ID is required. Please set it in your .env.local file. ' +
        'Get your appId from https://dashboard.privy.io/'
      );
    }
    
    // Render without PrivyProvider during build/SSR if appId is missing
    return (
      <AppContextProvider>
        {children}
      </AppContextProvider>
    );
  }

  return (
    <AppContextProvider>
      <PrivyProvider
        appId={privyAppId}
        config={{
          embeddedWallets: {
            ethereum: {
              createOnLogin: 'users-without-wallets'
            },
          }
        }}
      >
        <SmartWalletsProvider>
          {children}
        </SmartWalletsProvider>
      </PrivyProvider>
    </AppContextProvider>
  );
}