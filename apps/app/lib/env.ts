export const WC_PROJECT_ID = process.env.NEXT_PUBLIC_WC_PROJECT_ID ?? "";
export const SEPOLIA_RPC = process.env.NEXT_PUBLIC_SEPOLIA_RPC ?? "https://ethereum-sepolia-rpc.publicnode.com";
export const MAINNET_RPC = process.env.NEXT_PUBLIC_MAINNET_RPC ?? "https://ethereum-rpc.publicnode.com";
export const PRICE_API = process.env.NEXT_PUBLIC_PRICE_API ?? "http://localhost:8787";

// zama relayer api key (exposed in the browser; prefer the relayer proxy below)
export const ZAMA_API_KEY = process.env.NEXT_PUBLIC_ZAMA_API_KEY ?? "";

// server-side relayer proxy base url (keeps the api key off the client)
export const RELAYER_PROXY = process.env.NEXT_PUBLIC_RELAYER_PROXY ?? "";

// private rpc proxy base url; when set, used as the priority rpc
export const RPC_PROXY = process.env.NEXT_PUBLIC_RPC_PROXY ?? "";

// per-chain proxy endpoint, or undefined when no proxy configured
export function proxyRpc(chainId: number): string | undefined {
  return RPC_PROXY ? `${RPC_PROXY.replace(/\/$/, "")}/rpc/${chainId}` : undefined;
}

export function assertEnv(): void {
  if (!WC_PROJECT_ID) {
    throw new Error("Set NEXT_PUBLIC_WC_PROJECT_ID (WalletConnect project id from cloud.reown.com).");
  }
}
