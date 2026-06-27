/**
 * Verified Zama Confidential Token addresses.
 *
 * Registry addresses + Sepolia pair list were confirmed by a LIVE on-chain read
 * (cast call against the deployed registry proxy) on 2026-06-27, not copied from
 * docs. `isValid` for every Sepolia pair was `true` at read time; always re-read
 * on-chain before trusting it — it is the only canonical source.
 *
 * Source of truth at runtime is the registry itself (via WrapperRegistryLens).
 * This file is a convenience snapshot for deploy scripts and the frontend.
 */

export type ChainId = 1 | 11155111;

/** ConfidentialTokenWrappersRegistry (UUPS proxy — call the proxy). */
export const REGISTRY: Record<ChainId, `0x${string}`> = {
  1: "0xeb5015fF021DB115aCe010f23F55C2591059bBA0",
  11155111: "0x2f0750Bbb0A246059d80e94c454586a7F27a128e",
};

/** New @zama-fhe/sdk 3.x relayer endpoints (note the /v2 suffix). */
export const RELAYER_URL: Record<ChainId, string> = {
  1: "https://relayer.mainnet.zama.org/v2",
  11155111: "https://relayer.testnet.zama.org/v2",
};

export interface SepoliaToken {
  symbol: string;
  underlying: `0x${string}`;
  wrapper: `0x${string}`;
  decimals: number;
  /** Underlying ERC20Mock has a permissionless, capped faucet `mint`. */
  faucet: boolean;
}

/**
 * Sepolia pairs as read live on 2026-06-27 (8 pairs, all isValid=true).
 * 7 mocks (faucetable underlying) + 1 non-mock ctGBP.
 */
export const SEPOLIA_TOKENS: SepoliaToken[] = [
  { symbol: "cUSDCMock", underlying: "0x9b5Cd13b8eFbB58Dc25A05CF411D8056058aDFfF", wrapper: "0x7c5BF43B851c1dff1a4feE8dB225b87f2C223639", decimals: 6, faucet: true },
  { symbol: "cUSDTMock", underlying: "0xa7dA08FafDC9097Cc0E7D4f113A61e31d7e8e9b0", wrapper: "0x4E7B06D78965594eB5EF5414c357ca21E1554491", decimals: 6, faucet: true },
  { symbol: "cWETHMock", underlying: "0xff54739b16576FA5402F211D0b938469Ab9A5f3F", wrapper: "0x46208622DA27d91db4f0393733C8BA082ed83158", decimals: 18, faucet: true },
  { symbol: "cBRONMock", underlying: "0xFf021fB13cA64e5354c62c954b949a88cfDEb25E", wrapper: "0xaa5612FA27c927a0c7961f5AEFEE5ba3A0F9C891", decimals: 18, faucet: true },
  { symbol: "cZAMAMock", underlying: "0x75355a85c6FB9df5f0C80FF54e8747EEe9a0BF57", wrapper: "0xf2D628d2598aF4eAF94CB76a437Ff86CA78FfbFB", decimals: 18, faucet: true },
  { symbol: "ctGBPMock", underlying: "0x93c931278A2aad1916783F952f94276eA5111442", wrapper: "0xfCE5c7069c5525eF6c8C2b2E35A745bA20a2F7CC", decimals: 18, faucet: true },
  { symbol: "cXAUtMock", underlying: "0x24377AE4AA0C45ecEe71225007f17c5D423dd940", wrapper: "0xe4FcF848739845BC81Dee1d5352cf3844F0a60C7", decimals: 6, faucet: true },
  { symbol: "ctGBP", underlying: "0xf6Ef9ADB61A48E29E36bc873070A46A3D2667ff3", wrapper: "0x167DC962808B32CFFFc7e14B5018c0bE06A3A208", decimals: 18, faucet: false },
];
