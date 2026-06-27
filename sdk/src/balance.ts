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
