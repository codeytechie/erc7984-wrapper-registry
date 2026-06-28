export const MAINNET_ID = 1 as const;
export const SEPOLIA_ID = 11155111 as const;

export type SupportedChainId = typeof MAINNET_ID | typeof SEPOLIA_ID;

export interface ChainConfig {
  id: SupportedChainId;
  name: string;
  registry: `0x${string}`;
  relayerUrl: string;
  // unset -> fall back to direct reads
  lens?: `0x${string}`;
}

export const CHAINS: Record<SupportedChainId, ChainConfig> = {
  [MAINNET_ID]: {
    id: MAINNET_ID,
    name: "Ethereum",
    registry: "0xeb5015fF021DB115aCe010f23F55C2591059bBA0",
    relayerUrl: "https://relayer.mainnet.zama.org/v2",
    lens: undefined,
  },
  [SEPOLIA_ID]: {
    id: SEPOLIA_ID,
    name: "Sepolia",
    registry: "0x2f0750Bbb0A246059d80e94c454586a7F27a128e",
    relayerUrl: "https://relayer.testnet.zama.org/v2",
    lens: "0x1B0Cd34931B6f600DeA694ffDb690f3b6d53e940",
  },
};

export function isSupportedChain(id: number): id is SupportedChainId {
  return id === MAINNET_ID || id === SEPOLIA_ID;
}
