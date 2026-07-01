import type { TransactionResult } from "@zama-fhe/sdk";
import { wrapperAbi } from "./abi";
import type { ZamaClient } from "./client";

export interface WrapParams {
  wrapper: `0x${string}`;
  // underlying base units
  amount: bigint;
  to?: `0x${string}`;
  // kept for call-site compatibility; the wrapper knows its underlying
  underlying?: `0x${string}`;
}

export interface WrapPreview {
  wrapped: bigint;
  refund: bigint;
  confidentialAmount: bigint;
  rate: bigint;
}

// rounds down to a multiple of rate
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

// SDK shield: validates balance, picks erc1363/approve+wrap, handles fhe gas
export async function wrap(client: ZamaClient, params: WrapParams): Promise<TransactionResult> {
  const token = client.sdk.createWrappedToken(params.wrapper);
  return token.shield(params.amount, params.to ? { to: params.to } : undefined);
}
