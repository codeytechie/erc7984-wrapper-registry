/** Shared domain types for the headless layer. */

/** A fully-hydrated registry pair, mirroring `WrapperRegistryLens.PairView`. */
export interface PairView {
  underlying: `0x${string}`;
  wrapper: `0x${string}`;
  /** On-chain revocation flag from the registry. Honor it; never assume true. */
  isValid: boolean;
  underlyingSymbol: string;
  underlyingName: string;
  underlyingDecimals: number;
  wrapperDecimals: number;
  /** 10**(underlyingDecimals - wrapperDecimals); 1 when underlying <= 6 dec. */
  rate: bigint;
  /** underlyingBalance / rate — an upper bound on total value shielded. */
  inferredTotalSupply: bigint;
  supportsERC7984: boolean;
}

export interface FetchPairsOptions {
  /** Include revoked (isValid=false) pairs in the result. Default: true (the
   *  registry slice includes them; filtering is a UI concern). */
  includeRevoked?: boolean;
}

/** Lifecycle of the two-step unwrap, surfaced honestly in the UI. */
export type UnwrapStatus = "requested" | "finalizing" | "done" | "failed";

/** A pending unwrap, persisted so a reload/crash can resume it. */
export interface PendingUnwrap {
  wrapper: `0x${string}`;
  /** Tx hash of the original unwrap call (the resume anchor). */
  unwrapTxHash?: `0x${string}`;
  /** Request id from the `UnwrapRequested` event, when known. */
  unwrapRequestId?: `0x${string}`;
  /** Confidential amount requested, in wrapper decimals, when known. */
  amount?: bigint;
  status: UnwrapStatus;
}
