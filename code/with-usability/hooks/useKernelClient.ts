"use client";

import { useEffect, useState, useCallback } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { signerToEcdsaValidator } from "@zerodev/ecdsa-validator";
import { KERNEL_V3_1, getEntryPoint } from "@zerodev/sdk/constants";
import { createPublicClient, http, createWalletClient, custom } from "viem";
import { sepolia } from "viem/chains";
import {
  createKernelAccount,
  createKernelAccountClient,
  createZeroDevPaymasterClient,
  type KernelAccountClient,
} from "@zerodev/sdk";

export function useKernelClient() {
  const { ready } = usePrivy();
  const { wallets } = useWallets();

  const [kernelAccount, setKernelAccount] = useState<KernelAccountClient | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const init = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!ready) {
        console.log("🕒 Waiting for Privy to be ready...");
        return;
      }
      
      if (!wallets || wallets.length === 0) {
        console.log("🕒 Waiting for wallets to be available...");
        return;
      }

      const embeddedWallet = wallets.find(
        (wallet) => wallet.walletClientType === "privy"
      );

      if (!embeddedWallet) {
        console.log("User does not have an embedded wallet");
        return;
      }

      console.log("✅ Using embedded wallet:", embeddedWallet);

      const privyProvider = await embeddedWallet.getEthereumProvider();

      const publicClient = createPublicClient({
        transport: http("https://eth-sepolia.g.alchemy.com/v2/SOY9-KZJZSwEMSNA9uJKU"),
        chain: sepolia,
      });

      const walletClient = createWalletClient({
        account: embeddedWallet.address as `0x${string}`,
        chain: sepolia,
        transport: custom(privyProvider),
      });

      const ecdsaValidator = await signerToEcdsaValidator(publicClient, {
        signer: walletClient,
        entryPoint: getEntryPoint("0.7"),
        kernelVersion: KERNEL_V3_1,
      });

      const account = await createKernelAccount(publicClient, {
        plugins: { sudo: ecdsaValidator },
        entryPoint: getEntryPoint("0.7"),
        kernelVersion: KERNEL_V3_1,
      });

      const zerodevPaymaster = createZeroDevPaymasterClient({
        chain: sepolia,
        transport: http(
          "https://rpc.zerodev.app/api/v3/0a544074-24fc-4ab9-8502-36024aac0496/chain/11155111?selfFunded=true"
        ),
      });

      const kernelClient = createKernelAccountClient({
        account,
        chain: sepolia,
        bundlerTransport: http(
          "https://rpc.zerodev.app/api/v3/0a544074-24fc-4ab9-8502-36024aac0496/chain/11155111?selfFunded=true"
        ),
        client: publicClient,
        paymaster: {
          getPaymasterData(userOperation) {
            return zerodevPaymaster.sponsorUserOperation({ userOperation });
          },
        },
      });

      console.log("✅ Kernel client ready:", kernelClient);
      setKernelAccount(kernelClient);
    } catch (err) {
      console.error(err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [ready, wallets]);

  // 🔁 Só roda quando o Privy e as wallets estiverem prontos
  useEffect(() => {
    if (ready && wallets && wallets.length > 0) {
      init();
    }
  }, [ready, wallets, init]);

  return { kernelAccount, loading, error };
}