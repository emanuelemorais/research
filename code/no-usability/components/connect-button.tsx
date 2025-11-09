import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAppContext } from '@/contexts/AppContext';
import { trackButtonClick } from '@/lib/track-click';
import { BUTTON_IDS } from '@/lib/button-ids';
import { finalizeSession } from '@/lib/finalize-session';
import { useAccount, useDisconnect } from 'wagmi';
import { useEffect, useRef } from 'react';
import { LogOut } from 'lucide-react';

export const ConnectButtonCustom = () => {
  const { sessionId, userId } = useAppContext();
  const { isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const wasConnectedRef = useRef(isConnected);

  useEffect(() => {
    if (wasConnectedRef.current && !isConnected) {
      trackButtonClick(BUTTON_IDS.LOGOUT, sessionId);
      finalizeSession(sessionId);
    }
    wasConnectedRef.current = isConnected;
  }, [isConnected, sessionId]);

  const handleLogout = () => {
    finalizeSession(sessionId);
    disconnect();
    trackButtonClick(BUTTON_IDS.LOGOUT, sessionId);
    window.location.href = `${process.env.NEXT_PUBLIC_PRE_FORM_LINK}/${userId}/testing-journey`
  };

  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        const ready = mounted && authenticationStatus !== 'loading';
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus ||
            authenticationStatus === 'authenticated');
        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              'style': {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <button 
                    onClick={() => {
                      trackButtonClick(BUTTON_IDS.LOGIN, sessionId);
                      openConnectModal();
                    }} 
                    type="button" 
                    className="bg-primary text-white font-bold px-4 py-2 rounded-lg cursor-pointer"
                  >
                    Conectar Carteira
                  </button>
                );
              }
              if (chain.unsupported) {
                return (
                  <button onClick={openChainModal} type="button" className="bg-primary text-white text-bold px-4 py-2 rounded-lg">
                    Wrong network
                  </button>
                );
              }
              return (
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <button 
                    onClick={openAccountModal}
                    type="button" 
                    className="bg-gray-200 text-black text-bold px-4 py-2 rounded-lg"
                  >
                    {account?.displayName}
                  </button>
                  <button
                    onClick={handleLogout}
                    type="button"
                    className="bg-red-500 hover:bg-red-600 text-white font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                    Sair
                  </button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
};