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
  // optional network override
  rpcUrl?: string;
}

export function createZamaClient(params: CreateZamaClientParams): ZamaClient {
  const { chainId, account, publicClient, walletClient, rpcUrl } = params;
  if (!isSupportedChain(chainId)) {
    throw new Error(`Unsupported chainId ${chainId}; expected 1 or 11155111.`);
  }

  // per-chain branch keeps the id literal
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
