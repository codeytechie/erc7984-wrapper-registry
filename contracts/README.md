# Confidential Wrapper Registry — Contracts

The on-chain layer for the Confidential Wrapper Registry App: a read-aggregator
(`WrapperRegistryLens`) deployed against Zama's official
`ConfidentialTokenWrappersRegistry`, plus a full FHEVM mock harness that tests
the real wrap → user-decrypt → unwrap → finalize flow locally.

> This app **consumes** Zama's already-deployed contracts (registry, official
> ERC-7984 wrappers, Sepolia `ERC20Mock` faucet tokens). It does **not** redeploy
> them. The only contract meant for production deployment here is the stateless
> `WrapperRegistryLens`.

## What's inside

| Path | Purpose |
|---|---|
| `contracts/WrapperRegistryLens.sol` | Stateless view-aggregator. Collapses a page of the registry + per-pair metadata (symbol, decimals, rate, inferred total supply, ERC-165 check) into **one** `eth_call`. Per-token `try/catch` + `extcodesize` guard so one broken token never bricks a page. Takes the registry as a parameter, so one deployment serves any chain. |
| `contracts/interfaces/` | Verified read interfaces for the registry, wrapper, and ERC-20 metadata. |
| `contracts/mocks/` | `MockConfidentialWrapper` (extends OpenZeppelin `ERC7984ERC20Wrapper` — same base as the official wrapper), `ERC20Mock` (mirrors the permissionless capped faucet), `MockRegistry` (exact slice/tuple/revoke semantics + owner register/revoke for the extensibility demo), `BrokenToken` (proves Lens resilience). |
| `test/` | `WrapperRegistryLens.test.ts` and `ConfidentialWrapperFlow.test.ts` (real FHE under the Hardhat mock runtime). |
| `scripts/deploy-lens.ts` | Deploys the Lens, sanity-reads the live registry through it, writes `deployments.json`, best-effort Etherscan verify. |
| `config/addresses.ts` | Verified registry addresses, `/v2` relayer URLs, and the live-read Sepolia pair list. |

## Verified addresses

**Registry proxy (call the proxy):**

| Chain | Address |
|---|---|
| Ethereum mainnet (1) | `0xeb5015fF021DB115aCe010f23F55C2591059bBA0` |
| Sepolia (11155111) | `0x2f0750Bbb0A246059d80e94c454586a7F27a128e` |

**Faucet:** mint the underlying `ERC20Mock` via `mint(to, amount)` — permissionless,
capped at 1,000,000 whole tokens/call, no cooldown — then wrap it.

## Setup

```bash
npm install
```

Configure secrets (only needed for deploys; tests run with the default Hardhat mnemonic):

```bash
npx hardhat vars set MNEMONIC
npx hardhat vars set SEPOLIA_RPC_URL
npx hardhat vars set ETHERSCAN_API_KEY
```

## Build & test

```bash
npm run compile        # compile + typechain
npm test               # full suite under the FHEVM mock runtime (fast, CI-friendly)
npm run coverage       # solidity-coverage report
npm run test:sepolia   # run the flow against real encryption on Sepolia (gas + funded mnemonic)
```

The suite covers: faucet permissionless mint + per-call cap; wrap rate/rounding/refund
for 6- and 18-decimal tokens; sub-rate wraps to zero; the full two-step async
unwrap (`unwrap → publicDecrypt → finalizeUnwrap`); resumable unwrap recovered
purely from chain after a simulated client crash; `finalizeUnwrap` revert on an
unknown request id; ACL and zero-receiver reverts; and Lens hydration, rate math,
revoked-pair surfacing, `(bool, address)` tuple decoding, broken-token resilience,
`toIndex` clamping, and pagination.

## Deploy the Lens

```bash
npm run deploy:lens:sepolia
npm run deploy:lens:mainnet     # optional
```

This writes the deployed address into `deployments.json`, which the frontend
imports. The Lens needs no constructor args and the same bytecode works on any
chain.

## Key facts baked into the code

- `getConfidentialTokenAddress` / `getTokenAddress` return `(bool isValid, address)` — not a bare address.
- `getTokenConfidentialTokenPairsSlice(from, to)` is `[from, to)` (exclusive) and **includes revoked pairs** — always filter on `isValid`, which is only ever read on-chain.
- Wrapper decimals are capped at 6; `wrap` rounds **down** to a multiple of `rate()` and refunds the remainder.
- Unwrap is a two-step async process; the SDK's `unshield` orchestrates it, but the contracts expose `unwrap` / `finalizeUnwrap` / `unwrapRequester` for manual control and crash recovery.

## Toolchain

Hardhat + `@fhevm/hardhat-plugin` (mock + Sepolia runtimes), OpenZeppelin
`confidential-contracts` v0.5.1, `@fhevm/solidity`, Solidity 0.8.27 (cancun),
TypeChain, gas reporter, coverage, Etherscan verify.

## License

MIT
