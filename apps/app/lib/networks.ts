import { mainnet, sepolia } from "wagmi/chains";
import type { Mode } from "@/app/providers";

// supported chains per mode (extend these arrays to add networks)
export const TESTNETS = [sepolia];
export const MAINNETS = [mainnet];

export function chainsForMode(mode: Mode) {
  return mode === "mainnet" ? MAINNETS : TESTNETS;
}

export function activeChain(mode: Mode) {
  return mode === "mainnet" ? mainnet : sepolia;
}

export function isSupported(chainId: number | undefined, mode: Mode): boolean {
  return chainId != null && chainsForMode(mode).some((c) => c.id === chainId);
}

export function explorerUrl(mode: Mode): string {
  return mode === "mainnet" ? "https://etherscan.io" : "https://sepolia.etherscan.io";
}
