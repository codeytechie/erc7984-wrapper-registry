import { BaseError, ContractFunctionRevertedError, UserRejectedRequestError } from "viem";
import { ZamaError } from "@cwr/sdk";

export type AppErrorKind =
  | "user_rejected"
  | "wrong_network"
  | "insufficient_erc20"
  | "insufficient_confidential"
  | "relayer"
  | "decryption"
  | "encryption"
  | "reverted"
  | "no_ciphertext"
  | "keypair_expired"
  | "wallet"
  | "config"
  | "unknown";

export interface AppError {
  kind: AppErrorKind;
  title: string;
  message: string;
  retryable: boolean;
  cause?: unknown;
}

const ZAMA_MAP: Record<string, Omit<AppError, "cause">> = {
  SIGNING_REJECTED: { kind: "user_rejected", title: "Signature declined", message: "Approve the request in your wallet.", retryable: true },
  TRANSACTION_REVERTED: { kind: "reverted", title: "Transaction reverted", message: "The transaction failed on-chain.", retryable: false },
  RELAYER_REQUEST_FAILED: { kind: "relayer", title: "Relayer unavailable", message: "The relayer didn't respond. Try again.", retryable: true },
  DECRYPTION_FAILED: { kind: "decryption", title: "Decryption failed", message: "Could not decrypt. Re-sign and retry.", retryable: true },
  ENCRYPTION_FAILED: { kind: "encryption", title: "Encryption failed", message: "Could not encrypt the amount.", retryable: true },
  INSUFFICIENT_CONFIDENTIAL_BALANCE: { kind: "insufficient_confidential", title: "Insufficient balance", message: "Confidential balance is too low.", retryable: false },
  INSUFFICIENT_ERC20_BALANCE: { kind: "insufficient_erc20", title: "Insufficient balance", message: "Token balance is too low. Use the faucet.", retryable: false },
  NO_CIPHERTEXT: { kind: "no_ciphertext", title: "Nothing to decrypt", message: "No confidential balance yet.", retryable: false },
  KEYPAIR_EXPIRED: { kind: "keypair_expired", title: "Session expired", message: "Sign again to refresh your session.", retryable: true },
  CHAIN_MISMATCH: { kind: "wrong_network", title: "Wrong network", message: "Switch to Sepolia.", retryable: false },
  WALLET_NOT_CONNECTED: { kind: "wallet", title: "Wallet not connected", message: "Connect your wallet first.", retryable: false },
  WALLET_ACCOUNT_NOT_READY: { kind: "wallet", title: "Wallet loading", message: "Wallet is still connecting.", retryable: true },
  ACL_PAUSED: { kind: "config", title: "Temporarily paused", message: "Decryption is paused on-chain.", retryable: true },
  CONFIGURATION: { kind: "config", title: "Configuration error", message: "Unsupported chain or token.", retryable: false },
};

const UNKNOWN: AppError = { kind: "unknown", title: "Something went wrong", message: "Unexpected error. Please retry.", retryable: true };

export function toAppError(err: unknown): AppError {
  if (err instanceof ZamaError) {
    const mapped = ZAMA_MAP[err.code];
    return mapped ? { ...mapped, cause: err } : { ...UNKNOWN, cause: err };
  }
  if (err instanceof BaseError) {
    if (err.walk((e) => e instanceof UserRejectedRequestError)) {
      return { kind: "user_rejected", title: "Request declined", message: "You rejected the request.", retryable: true, cause: err };
    }
    if (err.walk((e) => e instanceof ContractFunctionRevertedError)) {
      return { kind: "reverted", title: "Transaction reverted", message: err.shortMessage ?? "Reverted on-chain.", retryable: false, cause: err };
    }
    return { ...UNKNOWN, message: err.shortMessage ?? UNKNOWN.message, cause: err };
  }
  return { ...UNKNOWN, cause: err };
}

// react-query retry: skip terminal errors
export function shouldRetry(failureCount: number, err: unknown): boolean {
  return toAppError(err).retryable && failureCount < 2;
}
