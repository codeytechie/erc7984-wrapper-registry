import { loadPendingUnshield } from "@zama-fhe/sdk";
import type { TransactionResult } from "@zama-fhe/sdk";

import { wrapperAbi } from "./abi";
import type { ZamaClient } from "./client";

const ZERO = "0x0000000000000000000000000000000000000000";

export interface UnwrapParams {
  wrapper: `0x${string}`;
  // wrapper base units (6-dec)
  amount: bigint;
}

// two-step unshield in one call
export async function unwrap(client: ZamaClient, params: UnwrapParams): Promise<TransactionResult> {
  const token = client.sdk.createWrappedToken(params.wrapper);
  return token.unshield(params.amount);
}

// pending unwrap tx hash from storage, or null
export async function getPendingUnwrap(
  client: ZamaClient,
  wrapper: `0x${string}`,
): Promise<`0x${string}` | null> {
  return loadPendingUnshield(client.sdk.storage, wrapper);
}

// resume pending unwrap from storage
export async function resumeUnwrap(
  client: ZamaClient,
  wrapper: `0x${string}`,
): Promise<TransactionResult | null> {
  const unwrapTxHash = await loadPendingUnshield(client.sdk.storage, wrapper);
  if (!unwrapTxHash) return null;
  const token = client.sdk.createWrappedToken(wrapper);
  return token.resumeUnshield(unwrapTxHash);
}

export async function isUnwrapPending(
  client: ZamaClient,
  wrapper: `0x${string}`,
  unwrapRequestId: `0x${string}`,
): Promise<boolean> {
  const requester = await client.publicClient.readContract({
    address: wrapper,
    abi: wrapperAbi,
    functionName: "unwrapRequester",
    args: [unwrapRequestId],
  });
  return requester.toLowerCase() !== ZERO;
}
