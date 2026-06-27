import { erc20MockAbi } from "./abi";
import type { ZamaClient } from "./client";
import { FAUCET_MAX_WHOLE_TOKENS } from "./tokens";

export interface FaucetParams {
  underlying: `0x${string}`;
  underlyingDecimals: number;
  // capped at 1,000,000 whole tokens
  wholeTokens: bigint;
  to?: `0x${string}`;
}

export async function faucetMint(client: ZamaClient, params: FaucetParams): Promise<`0x${string}`> {
  if (params.wholeTokens > FAUCET_MAX_WHOLE_TOKENS) {
    throw new Error(`Faucet cap is ${FAUCET_MAX_WHOLE_TOKENS} whole tokens per call.`);
  }
  const to = params.to ?? client.account;
  const amount = params.wholeTokens * 10n ** BigInt(params.underlyingDecimals);

  const hash = await client.walletClient.writeContract({
    address: params.underlying,
    abi: erc20MockAbi,
    functionName: "mint",
    args: [to, amount],
    account: client.account,
    chain: null,
  });
  await client.publicClient.waitForTransactionReceipt({ hash });
  return hash;
}
