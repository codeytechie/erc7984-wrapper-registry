import { Token } from "@zama-fhe/sdk";
import { erc20Abi } from "./abi";
import type { ZamaClient } from "./client";

// EIP-712 user-decryption, session-cached
export async function decryptBalance(
  client: ZamaClient,
  wrapper: `0x${string}`,
  owner?: `0x${string}`,
): Promise<bigint> {
  const token = client.sdk.createToken(wrapper);
  return token.balanceOf(owner ?? client.account);
}

// reuses one cached signature
export async function decryptBalances(
  client: ZamaClient,
  wrappers: `0x${string}`[],
  owner?: `0x${string}`,
): Promise<Record<string, bigint>> {
  const out: Record<string, bigint> = {};
  for (const w of wrappers) {
    out[w.toLowerCase()] = await decryptBalance(client, w, owner);
  }
  return out;
}

// one signature for all tokens; partial failures kept
export async function decryptBalancesBatch(
  client: ZamaClient,
  wrappers: `0x${string}`[],
): Promise<{ balances: Record<string, bigint>; failed: Record<string, string> }> {
  const tokens = wrappers.map((w) => client.sdk.createToken(w));
  const { results, errors } = await Token.batchBalancesOf(tokens, client.account);
  const balances: Record<string, bigint> = {};
  const failed: Record<string, string> = {};
  results.forEach((v, k) => {
    balances[k.toLowerCase()] = v;
  });
  errors.forEach((e, k) => {
    failed[k.toLowerCase()] = e.code;
  });
  return { balances, failed };
}

export async function publicBalanceOf(
  client: ZamaClient,
  token: `0x${string}`,
  owner?: `0x${string}`,
): Promise<bigint> {
  return client.publicClient.readContract({
    address: token,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [owner ?? client.account],
  });
}
