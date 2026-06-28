import type { PublicClient } from "viem";
import { CHAINS, type SupportedChainId } from "./chains";
import { registryAbi } from "./abi";
import { fetchPairsDirect } from "./registry";
import type { PairView } from "./types";

const ZERO = "0x0000000000000000000000000000000000000000";

// resolve + validate a pasted address against the registry
export async function resolveImportedToken(
  publicClient: PublicClient,
  chainId: SupportedChainId,
  address: `0x${string}`,
): Promise<PairView | null> {
  const registry = CHAINS[chainId].registry;

  const asUnderlying = await publicClient.readContract({
    address: registry,
    abi: registryAbi,
    functionName: "getConfidentialTokenAddress",
    args: [address],
  });

  let underlying: `0x${string}` | undefined;
  let wrapper: `0x${string}` | undefined;

  if (asUnderlying[0] && asUnderlying[1] !== ZERO) {
    underlying = address;
    wrapper = asUnderlying[1];
  } else {
    const asWrapper = await publicClient.readContract({
      address: registry,
      abi: registryAbi,
      functionName: "getTokenAddress",
      args: [address],
    });
    if (asWrapper[0] && asWrapper[1] !== ZERO) {
      wrapper = address;
      underlying = asWrapper[1];
    }
  }

  if (!underlying || !wrapper) return null;

  const all = await fetchPairsDirect(publicClient, chainId, { includeRevoked: true });
  return all.find((p) => p.wrapper.toLowerCase() === wrapper.toLowerCase()) ?? null;
}
