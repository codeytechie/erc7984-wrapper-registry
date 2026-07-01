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
  // relayer api key (required by the mainnet relayer)
  apiKey?: string;
  // override the relayer base url (e.g. a server-side proxy that injects the key)
  relayerUrl?: string;
}

export function createZamaClient(params: CreateZamaClientParams): ZamaClient {
  const { chainId, account, publicClient, walletClient, rpcUrl, apiKey, relayerUrl } = params;
  if (!isSupportedChain(chainId)) {
    throw new Error(`Unsupported chainId ${chainId}; expected 1 or 11155111.`);
  }

  const auth = apiKey ? ({ __type: "ApiKeyHeader", value: apiKey } as const) : undefined;
  const chainCfg = <T extends object>(base: T) => ({
    ...base,
    ...(rpcUrl ? { network: rpcUrl } : {}),
    ...(relayerUrl ? { relayerUrl } : {}),
    ...(auth ? { auth } : {}),
  });

  // per-chain branch keeps the id literal
  const sdk =
    chainId === MAINNET_ID
      ? new ZamaSDK(
          createConfig({
            chains: [chainCfg(mainnetFhe)],
            relayers: { [MAINNET_ID]: web() },
            publicClient,
            walletClient,
          }),
        )
      : new ZamaSDK(
          createConfig({
            chains: [chainCfg(sepoliaFhe)],
            relayers: { [SEPOLIA_ID]: web() },
            publicClient,
            walletClient,
          }),
        );

  return { chainId, account, publicClient, walletClient, sdk };
}
