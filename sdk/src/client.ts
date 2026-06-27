/**
 * The `ZamaClient` bundles the viem clients with a configured `ZamaSDK` instance
 * so every exported function runs unchanged in React, Node, or a script.
 *
 * The Zama SDK is built from the official `sepolia` / `mainnet` FheChain presets
 * (which already carry the correct ACL/KMS/relayer addresses), wired to the
 * `web()` relayer transport via the viem `createConfig`.
 */
import { ZamaSDK, sepolia as sepoliaFhe, mainnet as mainnetFhe } from "@zama-fhe/sdk";
import { createConfig } from "@zama-fhe/sdk/viem";
import { web } from "@zama-fhe/sdk/web";
import type { Address, PublicClient, WalletClient } from "viem";

import { MAINNET_ID, SEPOLIA_ID, type SupportedChainId, isSupportedChain } from "./chains";

export interface ZamaClient {
  chainId: SupportedChainId;
  account: Address;
  publicClient: PublicClient;
  walletClient: WalletClient;
  sdk: ZamaSDK;
}

export interface CreateZamaClientParams {
  chainId: number;
  account: Address;
  publicClient: PublicClient;
  walletClient: WalletClient;
  /** Optional RPC URL override for the SDK's `network` (relayer input checks). */
  rpcUrl?: string;
}

export function createZamaClient(params: CreateZamaClientParams): ZamaClient {
  const { chainId, account, publicClient, walletClient, rpcUrl } = params;
  if (!isSupportedChain(chainId)) {
    throw new Error(`Unsupported chainId ${chainId}; expected 1 or 11155111.`);
  }

  // Branch per chain so each createConfig sees a single concrete FheChain (its
  // `id` stays a literal), keeping the `relayers` map to exactly that one key.
  const sdk =
    chainId === MAINNET_ID
      ? new ZamaSDK(
          createConfig({
            chains: [rpcUrl ? { ...mainnetFhe, network: rpcUrl } : mainnetFhe],
            relayers: { [MAINNET_ID]: web() },
            publicClient,
            walletClient,
          }),
        )
      : new ZamaSDK(
          createConfig({
            chains: [rpcUrl ? { ...sepoliaFhe, network: rpcUrl } : sepoliaFhe],
            relayers: { [SEPOLIA_ID]: web() },
            publicClient,
            walletClient,
          }),
        );

  return { chainId, account, publicClient, walletClient, sdk };
}
