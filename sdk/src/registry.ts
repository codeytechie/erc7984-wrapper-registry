import type { PublicClient } from "viem";

import { erc20Abi, lensAbi, registryAbi, wrapperAbi } from "./abi";
import { CHAINS, type SupportedChainId } from "./chains";
import type { FetchPairsOptions, PairView } from "./types";

const IERC7984_ID = "0x4958f2a4";

function applyOptions(pairs: PairView[], options?: FetchPairsOptions): PairView[] {
  if (options?.includeRevoked === false) return pairs.filter((p) => p.isValid);
  return pairs;
}

// Lens-first; falls back to direct reads
export async function fetchPairs(
  publicClient: PublicClient,
  chainId: SupportedChainId,
  options?: FetchPairsOptions,
): Promise<PairView[]> {
  const chain = CHAINS[chainId];
  if (chain.lens) {
    const rows = await publicClient.readContract({
      address: chain.lens,
      abi: lensAbi,
      functionName: "getAllPairs",
      args: [chain.registry],
    });
    const pairs = rows.map(
      (r): PairView => ({
        underlying: r.underlying,
        wrapper: r.wrapper,
        isValid: r.isValid,
        underlyingSymbol: r.underlyingSymbol,
        underlyingName: r.underlyingName,
        underlyingDecimals: r.underlyingDecimals,
        wrapperDecimals: r.wrapperDecimals,
        rate: r.rate,
        inferredTotalSupply: r.inferredTotalSupply,
        supportsERC7984: r.supportsERC7984,
      }),
    );
    return applyOptions(pairs, options);
  }
  return applyOptions(await fetchPairsDirect(publicClient, chainId), options);
}

export async function fetchPairsDirect(
  publicClient: PublicClient,
  chainId: SupportedChainId,
): Promise<PairView[]> {
  const registry = CHAINS[chainId].registry;

  const length = await publicClient.readContract({
    address: registry,
    abi: registryAbi,
    functionName: "getTokenConfidentialTokenPairsLength",
  });
  if (length === 0n) return [];

  const slice = await publicClient.readContract({
    address: registry,
    abi: registryAbi,
    functionName: "getTokenConfidentialTokenPairsSlice",
    args: [0n, length],
  });

  const calls = slice.flatMap((p) => [
    { address: p.tokenAddress, abi: erc20Abi, functionName: "symbol" } as const,
    { address: p.tokenAddress, abi: erc20Abi, functionName: "name" } as const,
    { address: p.tokenAddress, abi: erc20Abi, functionName: "decimals" } as const,
    { address: p.confidentialTokenAddress, abi: wrapperAbi, functionName: "decimals" } as const,
    { address: p.confidentialTokenAddress, abi: wrapperAbi, functionName: "rate" } as const,
    { address: p.confidentialTokenAddress, abi: wrapperAbi, functionName: "inferredTotalSupply" } as const,
    {
      address: p.confidentialTokenAddress,
      abi: wrapperAbi,
      functionName: "supportsInterface",
      args: [IERC7984_ID],
    } as const,
  ]);

  // allowFailure: broken token -> defaults
  const results = await publicClient.multicall({ contracts: calls, allowFailure: true });

  const ok = <T>(i: number, fallback: T): T => {
    const r = results[i];
    return r && r.status === "success" ? (r.result as T) : fallback;
  };

  return slice.map((p, idx): PairView => {
    const b = idx * 7;
    return {
      underlying: p.tokenAddress,
      wrapper: p.confidentialTokenAddress,
      isValid: p.isValid,
      underlyingSymbol: ok<string>(b, ""),
      underlyingName: ok<string>(b + 1, ""),
      underlyingDecimals: ok<number>(b + 2, 0),
      wrapperDecimals: ok<number>(b + 3, 0),
      rate: ok<bigint>(b + 4, 0n),
      inferredTotalSupply: ok<bigint>(b + 5, 0n),
      supportsERC7984: ok<boolean>(b + 6, false),
    };
  });
}
