import { ZamaSDK, sepolia as sepoliaFhe, mainnet as mainnetFhe, memoryStorage } from "@zama-fhe/sdk";
import { createConfig } from "@zama-fhe/sdk/viem";
import { node } from "@zama-fhe/sdk/node";
import { createPublicClient, createWalletClient, fallback, http, type PublicClient, type WalletClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { mainnet as viemMainnet, sepolia as viemSepolia } from "viem/chains";

import { MAINNET_ID, SEPOLIA_ID, isSupportedChain } from "./chains";
import { rpcUrls } from "./rpc";
import type { ZamaClient } from "./client";

export interface CreateNodeZamaClientParams {
  chainId: number;
  // primary rpc, tried before public fallbacks
  rpcUrl?: string;
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
  const urls = rpcUrls(chainId, rpcUrl);
  const transport = fallback(urls.map((u) => http(u)));
  const publicClient = createPublicClient({ chain: viemChain, transport }) as PublicClient;
  const walletClient = createWalletClient({ account, chain: viemChain, transport }) as WalletClient;

  const sdk =
    chainId === MAINNET_ID
      ? new ZamaSDK(
          createConfig({
            chains: [{ ...mainnetFhe, network: urls[0] }],
            relayers: { [MAINNET_ID]: node() },
            publicClient,
            walletClient,
            storage: memoryStorage,
          }),
        )
      : new ZamaSDK(
          createConfig({
            chains: [{ ...sepoliaFhe, network: urls[0] }],
            relayers: { [SEPOLIA_ID]: node() },
            publicClient,
            walletClient,
            storage: memoryStorage,
          }),
        );

  return { chainId, account: account.address, publicClient, walletClient, sdk };
}
