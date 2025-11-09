import { NextRequest, NextResponse } from 'next/server';
import { createWalletClient, createPublicClient, http, parseEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import BaseToken from '@/abi/BaseToken.json';

const USD_TOKEN_ADDRESS = '0x499f88616642d06c69C7e77e057D8cB2aFd68080' as `0x${string}`;

export async function POST(req: NextRequest) {
  try {
    const { userAddress } = await req.json();

    if (!userAddress) {
      return NextResponse.json(
        { success: false, error: 'userAddress é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se a chave privada do owner está configurada
    const ownerPrivateKeyRaw = process.env.OWNER_PRIVATE_KEY;
    if (!ownerPrivateKeyRaw) {
      console.error('OWNER_PRIVATE_KEY não está configurada');
      return NextResponse.json(
        { success: false, error: 'Configuração do servidor incompleta' },
        { status: 500 }
      );
    }

    // Normalizar a chave privada: remover espaços e garantir que comece com 0x
    const ownerPrivateKey = ownerPrivateKeyRaw.trim().startsWith('0x') 
      ? ownerPrivateKeyRaw.trim() 
      : `0x${ownerPrivateKeyRaw.trim()}`;

    // Removida a verificação de saldo - sempre faz mint independente do saldo atual

    // Criar public client para leitura (caso necessário no tratamento de erros)
    const publicClient = createPublicClient({
      chain: sepolia,
      transport: http(process.env.NEXT_PUBLIC_ALCHEMY_URL),
    });

    // Criar wallet client com a chave privada do owner para escrita
    const account = privateKeyToAccount(ownerPrivateKey as `0x${string}`);
    const walletClient = createWalletClient({
      account,
      chain: sepolia,
      transport: http(process.env.NEXT_PUBLIC_ALCHEMY_URL),
    });

    // Fazer mint de 1000 USD
    const mintAmount = parseEther('1000');
    
    try {
      const hash = await walletClient.writeContract({
        address: USD_TOKEN_ADDRESS,
        abi: BaseToken.abi,
        functionName: 'mint',
        args: [userAddress as `0x${string}`, mintAmount],
      });

      return NextResponse.json({
        success: true,
        message: 'Mint de 1000 USD realizado com sucesso',
        transactionHash: hash,
      });
    } catch (writeError: any) {
      // Tratar erro "already known" - transação já foi enviada
      const errorMessage = writeError?.message || '';
      const errorDetails = writeError?.details || '';
      const errorCause = writeError?.cause?.message || '';
      
      if (
        errorMessage.includes('already known') ||
        errorDetails === 'already known' ||
        errorCause.includes('already known') ||
        errorMessage.includes('NonceTooLowError')
      ) {
        // Transação já está na mempool, verificar se foi confirmada
        console.log('Transação já foi enviada, verificando saldo...');
        
        // Aguardar um pouco e verificar o saldo novamente
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const balanceAfterAttempt = await publicClient.readContract({
          address: USD_TOKEN_ADDRESS,
          abi: BaseToken.abi,
          functionName: 'balanceOf',
          args: [userAddress as `0x${string}`],
        }) as bigint;

        if (balanceAfterAttempt && balanceAfterAttempt > BigInt(0)) {
          return NextResponse.json({
            success: true,
            message: 'Mint de USD já foi processado ou está em processamento',
            balance: balanceAfterAttempt.toString(),
          });
        }

        // Se ainda não tem saldo, pode ser que a transação esteja pendente
        return NextResponse.json({
          success: true,
          message: 'Transação de mint já foi enviada e está sendo processada',
          note: 'Aguarde alguns segundos e verifique seu saldo novamente',
        });
      }
      
      // Re-lançar o erro se não for "already known"
      throw writeError;
    }
  } catch (error: any) {
    console.error('Erro ao fazer mint de USD:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erro ao fazer mint de USD',
      },
      { status: 500 }
    );
  }
}

