export const WC_PROJECT_ID = process.env.NEXT_PUBLIC_WC_PROJECT_ID ?? "";
export const SEPOLIA_RPC = process.env.NEXT_PUBLIC_SEPOLIA_RPC ?? "https://ethereum-sepolia-rpc.publicnode.com";
export const MAINNET_RPC = process.env.NEXT_PUBLIC_MAINNET_RPC ?? "https://ethereum-rpc.publicnode.com";

export function assertEnv(): void {
  if (!WC_PROJECT_ID) {
    throw new Error("Set NEXT_PUBLIC_WC_PROJECT_ID (WalletConnect project id from cloud.reown.com).");
  }
}
