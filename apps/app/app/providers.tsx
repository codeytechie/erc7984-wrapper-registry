"use client";
import "@rainbow-me/rainbowkit/styles.css";
import { getDefaultConfig, RainbowKitProvider, lightTheme } from "@rainbow-me/rainbowkit";
import { WagmiProvider, useAccount, usePublicClient, useWalletClient } from "wagmi";
import { sepolia } from "wagmi/chains";
import { http } from "viem";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useMemo } from "react";
import { createZamaClient, type ZamaClient } from "@cwr/sdk";
import { SEPOLIA_RPC, WC_PROJECT_ID } from "@/lib/env";
import { shouldRetry } from "@/lib/errors";

const config = getDefaultConfig({
  appName: "Confidential Wrapper Registry",
  projectId: WC_PROJECT_ID || "PLACEHOLDER_WC_PROJECT_ID",
  chains: [sepolia],
  transports: { [sepolia.id]: http(SEPOLIA_RPC) },
  ssr: true,
});

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: shouldRetry, staleTime: 30_000 } },
});

const zamaTheme = lightTheme({ accentColor: "#FFD208", accentColorForeground: "#000000", borderRadius: "medium" });

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={zamaTheme}>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

// builds the SDK client from the connected wallet
export function useZamaClient(): ZamaClient | null {
  const { address } = useAccount();
  const publicClient = usePublicClient({ chainId: sepolia.id });
  const { data: walletClient } = useWalletClient();
  return useMemo(() => {
    if (!address || !publicClient || !walletClient) return null;
    return createZamaClient({
      chainId: sepolia.id,
      account: address,
      publicClient,
      walletClient,
      rpcUrl: SEPOLIA_RPC,
    });
  }, [address, publicClient, walletClient]);
}
