# Confidential Wrapper Registry — Contracts

Contracts for the Confidential Wrapper Registry app, built on Zama's live
Confidential Token protocol. We do **not** redeploy the official registry or
wrappers — we bind to them and ship one high-value helper plus a faithful local
test harness.

## What's here

| Contract | Purpose |
|---|---|
| `WrapperRegistryLens` | The one contract worth deploying. Stateless view-aggregator: collapses N+1 registry round-trips into a single `eth_call`, fully hydrating each pair (symbol/name/decimals, wrapper rate/decimals, inferred TVS, ERC-165 check). Registry address is a parameter, so the same bytecode serves every chain. |
| `mocks/MockConfidentialWrapper` | Concrete ERC-7984 wrapper over OpenZeppelin's `ERC7984ERC20Wrapper` — the same code the official wrapper is built on — so the two-step `wrap → unwrap → finalizeUnwrap` flow is testable locally. |
| `mocks/ERC20Mock` | Faithful copy of the Sepolia faucet token (permissionless `mint`, 1,000,000-whole-token per-call cap, no cooldown). |
| `mocks/MockRegistry` | Local registry with the exact read semantics of the real one (slice includes revoked pairs; `(bool,address)` tuples) plus owner `registerPair`/`revokePair` for the "bring your own pair" demo. |
| `interfaces/*` | Minimal verified interfaces shared by the Lens, tests, and frontend. |

## Verified facts (locked from a live on-chain read, 2026-06-27)

- Registry (UUPS proxy) — mainnet `0xeb5015fF021DB115aCe010f23F55C2591059bBA0`,
  Sepolia `0x2f0750Bbb0A246059d80e94c454586a7F27a128e`.
- Sepolia: **8 registered pairs, all `isValid=true`** (7 faucet mocks + non-mock ctGBP).
- Wrapper decimals capped at 6; 18-dec underlying → `rate = 1e12`, 6-dec → `rate = 1`.
- `isValid` is on-chain-only and the slice includes revoked pairs — honor it.

Full snapshot in [`config/addresses.ts`](config/addresses.ts).

## Develop

```bash
npm install
npm run compile        # solc 0.8.27, typechain ethers-v6
npm test               # 16 tests: Lens reads + full FHE wrap/unwrap under the mock runtime
```

The tests run under `@fhevm/hardhat-plugin`'s mock runtime (chainId 31337) and
exercise real encryption mechanics: encrypted inputs, user-decryption of
balances, and the two-step unwrap with public decryption + `decryptionProof`.

## Deploy the Lens

Needs a funded deployer (set `MNEMONIC` + `SEPOLIA_RPC_URL` via `npx hardhat vars set`).

```bash
npm run deploy:lens:sepolia    # deploys, sanity-reads the live registry, writes deployments.json, verifies
```

`deployments.json` (registry + relayer URL per chain, Lens address filled on
deploy) is the file the frontend imports.

## Test matrix (all green)

- **Lens** — full hydration in one call; revoked pairs surface with `isValid=false`
  (never dropped); `(bool,address)` tuple decode; try/catch + extcodesize survives
  a broken token; rate/decimals for 6- and 18-dec; pagination + `toIndex` clamp.
- **Wrap** — 1:1 at rate 1; round-down + remainder retained at rate 1e12; sub-rate → 0.
- **Unwrap** — full two-step finalize releases underlying; resumable from chain
  after a simulated crash; unknown request id reverts.
- **Access control** — unwrap of an unauthorized handle reverts
  (`ERC7984UnauthorizedUseOfEncryptedAmount`); unwrap to `address(0)` reverts.
- **Faucet** — permissionless mint; rejects above the per-call cap.
