# @cwr/sdk — headless integration layer

Framework-agnostic TypeScript core for the Confidential Wrapper Registry. No UI:
config, ABIs, a Zama-SDK client, and the read / faucet / wrap / decrypt / unwrap
logic as plain functions. The React app imports this.

## Design

- **Direct viem** for non-FHE ops: registry/Lens reads, faucet `mint`, `wrap`.
- **Zama SDK** only for FHE: `decryptBalance` (EIP-712 user-decryption) and
  `unwrap` (`WrappedToken.unshield`, the orchestrated two-step withdraw).

## Install

    npm install

## Usage

```ts
import {
  createZamaClient, fetchPairs, faucetMint,
  approveAndWrap, previewWrap, decryptBalance, unwrap,
} from '@cwr/sdk';

const client = createZamaClient({
  chainId, account, publicClient, walletClient, rpcUrl,
});

const pairs = await fetchPairs(client.publicClient, client.chainId);   // coverage
await faucetMint(client, { underlying, underlyingDecimals: 6, wholeTokens: 1000n });
await approveAndWrap(client, { wrapper, underlying, amount });          // public -> confidential
const bal = await decryptBalance(client, wrapper);                     // EIP-712 user decryption
await unwrap(client, { wrapper, amount });                            // confidential -> public
```

## Notes

- `fetchPairs` uses the deployed Lens; until `CHAINS[chainId].lens` is set it
  transparently falls back to a registry slice + multicall.
- `wrap` amounts are in the underlying's base units; `unwrap` amounts are in the
  wrapper's (6-dec) base units.
- Always treat the registry as the source of truth and read `isValid` on-chain.

## Verified against `@zama-fhe/sdk` 3.2.0 (the two flagged names)

The installed SDK differs slightly from the original spec; the wrappers here are
written to the real API:

- **`sdk.createToken(addr)` → `Token`** exists and exposes `balanceOf(owner)`,
  `confidentialTransfer`, etc. But `balanceOf` **takes the owner address**
  (`decryptBalance` passes the connected account). Shield/unshield are **not** on
  `Token`.
- **`sdk.createWrappedToken(addr)` → `WrappedToken`** is the wrapper-specific
  class carrying `shield`, `unshield`, `unwrap`, `finalizeUnwrap`, and
  `resumeUnshield`. `unwrap()` uses it.
- **`resumeUnshield(unwrapTxHash)` takes the unwrap tx hash** (not zero-arg).
  `resumeUnwrap` reads the persisted tx hash via the SDK's exported
  `loadPendingUnshield(storage, wrapper)` and passes it in, so a reload/crash can
  finalize a pending withdraw.
- The SDK instance is built with `createConfig` from `@zama-fhe/sdk/viem` and the
  `web()` relayer from `@zama-fhe/sdk/web`, off the official `sepolia` / `mainnet`
  FheChain presets (correct ACL/KMS/relayer addresses baked in).
