export interface PairView {
  underlying: `0x${string}`;
  wrapper: `0x${string}`;
  // honor it; never assume true
  isValid: boolean;
  underlyingSymbol: string;
  underlyingName: string;
  underlyingDecimals: number;
  wrapperDecimals: number;
  // 10**(underlyingDec - wrapperDec)
  rate: bigint;
  // upper bound on shielded supply
  inferredTotalSupply: bigint;
  supportsERC7984: boolean;
}

export interface FetchPairsOptions {
  // include revoked pairs; default true
  includeRevoked?: boolean;
}

export type UnwrapStatus = "requested" | "finalizing" | "done" | "failed";

export interface PendingUnwrap {
  wrapper: `0x${string}`;
  // resume anchor
  unwrapTxHash?: `0x${string}`;
  // from UnwrapRequested event
  unwrapRequestId?: `0x${string}`;
  amount?: bigint;
  status: UnwrapStatus;
}
