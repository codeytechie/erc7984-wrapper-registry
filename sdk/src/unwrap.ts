/**
 * Unwrap (unshield): confidential ERC-7984 -> public ERC-20. A two-step async
 * on-chain process (unwrap -> public-decrypt the burned amount -> finalizeUnwrap)
 * that the SDK's `WrappedToken.unshield()` orchestrates in one call.
 *
 * Crash recovery: the SDK persists the pending unwrap (its tx hash) to storage on
 * the unwrap step. `resumeUnwrap` reloads it and finalizes; `isUnwrapPending`
 * confirms against chain state via `unwrapRequester(id)`.
 */
import { loadPendingUnshield } from "@zama-fhe/sdk";
import type { TransactionResult } from "@zama-fhe/sdk";

import { wrapperAbi } from "./abi";
import type { ZamaClient } from "./client";

const ZERO = "0x0000000000000000000000000000000000000000";

export interface UnwrapParams {
  wrapper: `0x${string}`;
  /** Amount in the WRAPPER's (confidential) base units — capped at 6 decimals. */
  amount: bigint;
}

/** Full two-step unwrap in one call. Resolves once the underlying is released. */
export async function unwrap(client: ZamaClient, params: UnwrapParams): Promise<TransactionResult> {
  const token = client.sdk.createWrappedToken(params.wrapper);
  return token.unshield(params.amount);
}

/**
 * Resume a pending unwrap after a reload/crash. Reads the persisted unwrap tx
 * hash from SDK storage and finalizes it. Returns `null` if nothing is pending.
 */
export async function resumeUnwrap(
  client: ZamaClient,
  wrapper: `0x${string}`,
): Promise<TransactionResult | null> {
  const unwrapTxHash = await loadPendingUnshield(client.sdk.storage, wrapper);
  if (!unwrapTxHash) return null;
  const token = client.sdk.createWrappedToken(wrapper);
  return token.resumeUnshield(unwrapTxHash);
}

/** True if `unwrapRequestId` is still awaiting finalization (on-chain check). */
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
