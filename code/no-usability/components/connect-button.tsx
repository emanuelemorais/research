import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAppContext } from '@/contexts/AppContext';
import { trackButtonClick } from '@/lib/track-click';
import { BUTTON_IDS } from '@/lib/button-ids';
import { finalizeSession } from '@/lib/finalize-session';
import { useAccount, useDisconnect, useReadContract } from 'wagmi';
import { useEffect, useRef } from 'react';
import { LogOut } from 'lucide-react';
import BaseToken from '@/abi/BaseToken.json';
import { getTokenAddress } from '@/lib/utils';

const USD_TOKEN_ADDRESS = getTokenAddress('USD') as `0x${string}`;

export const ConnectButtonCustom = () => {
  const { sessionId, userId } = useAppContext();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const wasConnectedRef = useRef(isConnected);
  const hasCheckedBalanceRef = useRef(false);
  const isMintingRef = useRef(false);

  // Verificar saldo de USD
  const { data: usdBalance, refetch: refetchUsdBalance } = useReadContract({
    address: USD_TOKEN_ADDRESS,
    abi: BaseToken.abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && isConnected,
    },
  });

  // Verificar saldo e fazer mint via API se necessário quando conectar
  useEffect(() => {
    if (isConnected && address && usdBalance !== undefined && !hasCheckedBalanceRef.current && !isMintingRef.current) {
      hasCheckedBalanceRef.current = true;
      
      // Se o saldo for 0, chamar API para fazer mint
      if (usdBalance === BigInt(0)) {
        const requestMint = async () => {
          if (isMintingRef.current) {
            return; // Já está fazendo mint
          }
          
          isMintingRef.current = true;
          try {
            const response = await fetch('/api/mint-usd', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ userAddress: address }),
            });

            const result = await response.json();
            if (result.success) {
              console.log('Mint de USD:', result.message || 'Processado com sucesso');
              // Aguardar um pouco mais para garantir que a transação foi processada
              setTimeout(() => {
                refetchUsdBalance();
                isMintingRef.current = false;
              }, 5000);
            } else {
              console.error('Erro ao fazer mint de USD:', result.error);
              isMintingRef.current = false;
            }
          } catch (error) {
            console.error('Erro ao chamar API de mint:', error);
            isMintingRef.current = false;
          }
        };

        requestMint();
      }
    }
    
    if (!isConnected) {
      hasCheckedBalanceRef.current = false;
      isMintingRef.current = false;
    }
  }, [isConnected, address, usdBalance, refetchUsdBalance]);

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