'use client';

import {PrivyProvider} from '@privy-io/react-auth';
import {SmartWalletsProvider} from '@privy-io/react-auth/smart-wallets';
import { AppContextProvider } from '@/contexts/AppContext';

export default function Providers({children}: {children: React.ReactNode}) {
  return (
    <AppContextProvider>
      <PrivyProvider
        appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID as string}
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