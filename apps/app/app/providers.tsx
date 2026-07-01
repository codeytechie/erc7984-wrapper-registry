"use client";
import "@rainbow-me/rainbowkit/styles.css";
import {
  getDefaultConfig,
  RainbowKitProvider,
  darkTheme,
} from "@rainbow-me/rainbowkit";
import {
  WagmiProvider,
  useAccount,
  usePublicClient,
  useWalletClient,
} from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import { fallback, http } from "viem";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  createZamaClient,
  rpcUrls,
  MAINNET_ID,
  SEPOLIA_ID,
  type SupportedChainId,
  type ZamaClient,
} from "@cwr/sdk";
import { MAINNET_RPC, proxyRpc, RELAYER_PROXY, SEPOLIA_RPC, WC_PROJECT_ID, ZAMA_API_KEY } from "@/lib/env";
import { shouldRetry } from "@/lib/errors";

const config = getDefaultConfig({
  appName: "Confidential Wrapper Registry",
  projectId: WC_PROJECT_ID || "PLACEHOLDER_WC_PROJECT_ID",
  chains: [sepolia, mainnet],
  transports: {
    [sepolia.id]: fallback(
      rpcUrls(SEPOLIA_ID, proxyRpc(SEPOLIA_ID), SEPOLIA_RPC).map((u) =>
        http(u),
      ),
    ),
    [mainnet.id]: fallback(
      rpcUrls(MAINNET_ID, proxyRpc(MAINNET_ID), MAINNET_RPC).map((u) =>
        http(u),
      ),
    ),
  },
  ssr: true,
});

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: shouldRetry, staleTime: 30_000 } },
});

const zamaTheme = darkTheme({
  accentColor: "#FFD208",
  accentColorForeground: "#000000",
  borderRadius: "medium",
});

export type Mode = "testnet" | "mainnet";

interface ModeCtx {
  mode: Mode;
  chainId: SupportedChainId;
  setMode: (m: Mode) => void;
}

const ModeContext = createContext<ModeCtx | null>(null);
const MODE_KEY = "cwr:mode";

function ModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<Mode>("testnet");

  useEffect(() => {
    const saved =
      typeof window !== "undefined"
        ? window.localStorage.getItem(MODE_KEY)
        : null;
    if (saved === "mainnet" || saved === "testnet") setModeState(saved);
  }, []);

  const setMode = (m: Mode) => {
    setModeState(m);
    if (typeof window !== "undefined") window.localStorage.setItem(MODE_KEY, m);
  };

  const value = useMemo<ModeCtx>(
    () => ({
      mode,
      chainId: mode === "mainnet" ? mainnet.id : sepolia.id,
      setMode,
    }),
    [mode],
  );
  return <ModeContext.Provider value={value}>{children}</ModeContext.Provider>;
}

export function useMode(): ModeCtx {
  const ctx = useContext(ModeContext);
  if (!ctx) throw new Error("useMode must be used inside Providers");
  return ctx;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={zamaTheme}>
          <ModeProvider>{children}</ModeProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

// builds the SDK client for the active (mode) chain
export function useZamaClient(): ZamaClient | null {
  const { chainId } = useMode();
  const { address } = useAccount();
  const publicClient = usePublicClient({ chainId });
  const { data: walletClient } = useWalletClient();
  const rpcUrl = proxyRpc(chainId) ?? (chainId === mainnet.id ? MAINNET_RPC : SEPOLIA_RPC);
  // mainnet relayer needs auth: prefer the server-side proxy, else the exposed key
  const isMainnet = chainId === mainnet.id;
  const relayerUrl = isMainnet && RELAYER_PROXY ? RELAYER_PROXY : undefined;
  const apiKey = isMainnet && !RELAYER_PROXY ? ZAMA_API_KEY || undefined : undefined;
  return useMemo(() => {
    if (!address || !publicClient || !walletClient) return null;
    return createZamaClient({
      chainId,
      account: address,
      publicClient,
      walletClient,
      rpcUrl,
      relayerUrl,
      apiKey,
    });
  }, [address, publicClient, walletClient, chainId, rpcUrl, relayerUrl, apiKey]);
}
