import type { TransactionResult } from "@zama-fhe/sdk";
import type { ZamaClient } from "./client";

export interface TransferParams {
  wrapper: `0x${string}`;
  to: `0x${string}`;
  amount: bigint;
}

// FHE-encrypts the amount internally
export async function confidentialTransfer(client: ZamaClient, p: TransferParams): Promise<TransactionResult> {
  const token = client.sdk.createToken(p.wrapper);
  return token.confidentialTransfer(p.to, p.amount);
}
