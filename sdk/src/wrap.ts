/**
 * Wrap public ERC-20 into its confidential ERC-7984 wrapper. The wrapper's
 * `wrap(to, amount)` takes a PUBLIC amount, so this is plain viem: ensure
 * allowance, then wrap. No FHE involved.
 *
 * The wrapper rounds `amount` DOWN to a multiple of `rate()` and refunds the
 * remainder, so `previewWrap` tells the user what they'll actually receive.
 */
import { erc20Abi, wrapperAbi } from "./abi";
import type { ZamaClient } from "./client";

export interface WrapParams {
  wrapper: `0x${string}`;
  underlying: `0x${string}`;
  /** Amount in the UNDERLYING token's base units. */
  amount: bigint;
  /** Recipient of the confidential balance; defaults to the connected account. */
  to?: `0x${string}`;
}

export interface WrapPreview {
  /** Underlying base units actually pulled (a multiple of rate). */
  wrapped: bigint;
  /** Underlying base units refunded (amount - wrapped). */
  refund: bigint;
  /** Confidential units credited (wrapped / rate), in wrapper decimals. */
  confidentialAmount: bigint;
  rate: bigint;
}

/** Pure preview of the round-down + refund, given the wrapper's rate. */
export async function previewWrap(client: ZamaClient, wrapper: `0x${string}`, amount: bigint): Promise<WrapPreview> {
  const rate = await client.publicClient.readContract({
    address: wrapper,
    abi: wrapperAbi,
    functionName: "rate",
  });
  const confidentialAmount = amount / rate;
  const wrapped = confidentialAmount * rate;
  return { wrapped, refund: amount - wrapped, confidentialAmount, rate };
}

/** Ensure allowance (approve if short), then wrap. Returns the wrap tx hash. */
export async function approveAndWrap(client: ZamaClient, params: WrapParams): Promise<`0x${string}`> {
  const to = params.to ?? client.account;

  const allowance = await client.publicClient.readContract({
    address: params.underlying,
    abi: erc20Abi,
    functionName: "allowance",
    args: [client.account, params.wrapper],
  });

  if (allowance < params.amount) {
    const approveHash = await client.walletClient.writeContract({
      address: params.underlying,
      abi: erc20Abi,
      functionName: "approve",
      args: [params.wrapper, params.amount],
      account: client.account,
      chain: null,
    });
    await client.publicClient.waitForTransactionReceipt({ hash: approveHash });
  }

  const wrapHash = await client.walletClient.writeContract({
    address: params.wrapper,
    abi: wrapperAbi,
    functionName: "wrap",
    args: [to, params.amount],
    account: client.account,
    chain: null,
  });
  await client.publicClient.waitForTransactionReceipt({ hash: wrapHash });
  return wrapHash;
}
