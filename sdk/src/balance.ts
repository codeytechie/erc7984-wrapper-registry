/**
 * Confidential balance via the EIP-712 user-decryption flow. `Token.balanceOf`
 * reads the encrypted on-chain value and decrypts it through the SDK — one
 * EIP-712 signature per session, cached by the SDK (a permit), so repeated reads
 * and multiple tokens reuse the same signature. Returns the cleartext balance in
 * the wrapper's decimals.
 *
 * This is the bounty's headline requirement — keep it on the SDK's
 * user-decryption path, not a raw handle read.
 */
import type { ZamaClient } from "./client";

/**
 * Decrypt the connected account's confidential balance for a wrapper.
 * @param owner - Optional balance owner; defaults to the connected account.
 */
export async function decryptBalance(
  client: ZamaClient,
  wrapper: `0x${string}`,
  owner?: `0x${string}`,
): Promise<bigint> {
  const token = client.sdk.createToken(wrapper);
  return token.balanceOf(owner ?? client.account);
}

/** Decrypt balances for several wrappers, reusing the one cached session signature. */
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
