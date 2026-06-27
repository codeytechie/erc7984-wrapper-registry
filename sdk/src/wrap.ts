import { erc20Abi, wrapperAbi } from "./abi";
import type { ZamaClient } from "./client";

export interface WrapParams {
  wrapper: `0x${string}`;
  underlying: `0x${string}`;
  // underlying base units
  amount: bigint;
  to?: `0x${string}`;
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
      account: client.walletClient.account ?? client.account,
      chain: null,
    });
    await client.publicClient.waitForTransactionReceipt({ hash: approveHash });
  }

  const wrapHash = await client.walletClient.writeContract({
    address: params.wrapper,
    abi: wrapperAbi,
    functionName: "wrap",
    args: [to, params.amount],
    account: client.walletClient.account ?? client.account,
    chain: null,
  });
  await client.publicClient.waitForTransactionReceipt({ hash: wrapHash });
  return wrapHash;
}
