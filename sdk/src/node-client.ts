import { ZamaSDK, sepolia as sepoliaFhe, mainnet as mainnetFhe, memoryStorage } from "@zama-fhe/sdk";
import { createConfig } from "@zama-fhe/sdk/viem";
import { node } from "@zama-fhe/sdk/node";
import { createPublicClient, createWalletClient, http, type PublicClient, type WalletClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { mainnet as viemMainnet, sepolia as viemSepolia } from "viem/chains";

import { MAINNET_ID, SEPOLIA_ID, isSupportedChain } from "./chains";
import type { ZamaClient } from "./client";

export interface CreateNodeZamaClientParams {
  chainId: number;
  rpcUrl: string;
  privateKey: `0x${string}`;
}

// Node entry point: uses node() relayer, not web()
export function createNodeZamaClient(params: CreateNodeZamaClientParams): ZamaClient {
  const { chainId, rpcUrl, privateKey } = params;
  if (!isSupportedChain(chainId)) {
    throw new Error(`Unsupported chainId ${chainId}; expected 1 or 11155111.`);
  }

  const account = privateKeyToAccount(privateKey);
  const viemChain = chainId === MAINNET_ID ? viemMainnet : viemSepolia;
  const publicClient = createPublicClient({ chain: viemChain, transport: http(rpcUrl) }) as PublicClient;
  const walletClient = createWalletClient({ account, chain: viemChain, transport: http(rpcUrl) }) as WalletClient;

  const sdk =
    chainId === MAINNET_ID
      ? new ZamaSDK(
          createConfig({
            chains: [{ ...mainnetFhe, network: rpcUrl }],
            relayers: { [MAINNET_ID]: node() },
            publicClient,
            walletClient,
            storage: memoryStorage,
          }),
        )
      : new ZamaSDK(
          createConfig({
            chains: [{ ...sepoliaFhe, network: rpcUrl }],
            relayers: { [SEPOLIA_ID]: node() },
            publicClient,
            walletClient,
            storage: memoryStorage,
          }),
        );

  return { chainId, account: account.address, publicClient, walletClient, sdk };
}
