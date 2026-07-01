import { MAINNET_ID, SEPOLIA_ID, type SupportedChainId } from "./chains";

export const DEFAULT_RPC_URLS: Record<SupportedChainId, string[]> = {
  [MAINNET_ID]: [
    "https://ethereum-rpc.publicnode.com",
    "https://eth.drpc.org",
    "https://1rpc.io/eth",
    "https://cloudflare-eth.com",
  ],
  [SEPOLIA_ID]: [
    "https://ethereum-sepolia-rpc.publicnode.com",
    "https://sepolia.drpc.org",
    "https://1rpc.io/sepolia",
    "https://sepolia.gateway.tenderly.co",
  ],
};

// overrides first, then defaults, deduped
export function rpcUrls(chainId: SupportedChainId, ...overrides: (string | undefined)[]): [string, ...string[]] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const u of [...overrides, ...DEFAULT_RPC_URLS[chainId]]) {
    if (u && !seen.has(u)) {
      seen.add(u);
      out.push(u);
    }
  }
  // defaults guarantee at least one entry
  return out as [string, ...string[]];
}
