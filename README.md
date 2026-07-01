# Confidential Wrapper Registry

[![CI](https://github.com/codeytechie/erc7984-wrapper-registry/actions/workflows/ci.yml/badge.svg)](https://github.com/codeytechie/erc7984-wrapper-registry/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

Surfaces **every** ERC-20 ↔ ERC-7984 pair in Zama's official Confidential Token
Wrappers Registry and lets anyone **wrap, unwrap, decrypt (EIP-712), and faucet** —
turning the on-chain registry into a usable product.

> 🔗 **Live app:** `TODO: deployed URL` · 🎥 **Demo (2–3 min):** `TODO: video link`

<!-- TODO: hero screenshot of the portfolio table -> docs/hero.png -->
![Portfolio table](docs/hero.png)
<sub>`TODO:` add `docs/hero.png` (portfolio table screenshot).</sub>

---

## What it does — the 4 required features

- **Surfaces every pair, live from the registry.** Reads all pairs on-chain through the
  deployed [`WrapperRegistryLens`](#6-deployed-addresses) (one call, full metadata) — all
  **8** Sepolia pairs including the non-mock `ctGBP`, revoked pairs surfaced (never
  silently dropped), plus an **import** flow for off-list / mainnet pairs.
- **Wrap / unwrap** any pair — deposit a public ERC-20 to mint its confidential wrapper,
  and the full **two-step asynchronous unwrap** (request → public-decrypt → finalize),
  with resume for an interrupted unwrap.
- **Decrypt** any ERC-7984 balance via the **EIP-712 user-decryption** flow —
  one-signature batch **Decrypt all**, cached for the session.
- **Sepolia faucet** for the official cToken mocks, straight from each row.

---

## How it meets the judging criteria

| Criterion | How this submission addresses it |
|---|---|
| **Coverage** | Live registry read via the on-chain Lens; all **8** Sepolia pairs incl. the non-mock `ctGBP`; 6- and 18-decimal tokens; **revoked pairs surfaced** (`isValid=false`, never dropped); **import** for off-list pairs; **testnet + mainnet** modes (Lens deployed on both). |
| **Correctness** | **29 contract tests, 100% statements / functions / lines** (95% branches); **live end-to-end against the official contracts** (`tools/`, output below); correct two-step unwrap + finalize, `(bool,address)` tuple decoding, and rate rounding/refund. |
| **Extensibility** | Fully **registry-driven** — new official pairs appear with **zero code change**; reusable headless [`@cwr/sdk`](#7-monorepo-layout); the `WrapperRegistryLens` on-chain artifact; the import flow; a "bring your own pair" path via the mock registry harness; config-driven chains. |
| **UX** | RainbowKit connect; one-signature **Decrypt all**; balances **masked until revealed**; per-action dialogs showing the token; **USD totals**; token icons; wrong-network detection + switch; typed, human error messages; light/dark. |
| **Code quality** | Strict TypeScript (no `any` at boundaries); a **typed error taxonomy** mapping `@zama-fhe/sdk` + viem errors to user messages; CI on every push; coverage; clean monorepo separation (contracts / sdk / services / apps). |
| **Production-readiness** | Public deploy (`TODO: URL`); CI gate; graceful **RPC / relayer / price fallbacks**; env validation; **Etherscan-verified** Lens on Sepolia **and** mainnet; server-side proxy so the mainnet relayer key never ships to the browser. |

---

## Architecture

The **official registry is the single source of truth**; everything above it is a thin,
reusable product layer.

```mermaid
flowchart LR
  R["Official Wrappers Registry<br/>(on-chain source of truth)"] --> L["WrapperRegistryLens<br/>(view aggregator, one call)"]
  L --> S["@cwr/sdk<br/>(headless integration layer)"]
  S --> A["apps/app<br/>(portfolio UI)"]
  S --> T["tools<br/>(live e2e)"]
  S -. "FHE ops via @zama-fhe/sdk" .-> Z["Zama relayer<br/>decrypt · wrap · unwrap · transfer"]
```

- **`WrapperRegistryLens`** aggregates the registry's paginated getters + per-token
  metadata (symbol, decimals, rate, validity, inferred supply) into a single call, with
  `try/catch` resilience for tokens that revert on metadata.
- **`@cwr/sdk`** isolates the FHE touchpoints — **balance decrypt** (EIP-712),
  **wrap** (shield), **two-step unwrap** (unshield + finalize), and **confidential
  transfer** — behind `@zama-fhe/sdk`. Everything else (registry reads, public balances,
  faucet, approvals) is plain **viem**.
- The apps are a UI over the SDK; nothing hard-codes the pair list.

---

## 6. Deployed addresses

| Contract | Network | Address |
|---|---|---|
| Registry proxy (official) | Sepolia | [`0x2f0750Bbb0A246059d80e94c454586a7F27a128e`](https://sepolia.etherscan.io/address/0x2f0750Bbb0A246059d80e94c454586a7F27a128e) |
| `WrapperRegistryLens` (verified) | Sepolia | [`0x1B0Cd34931B6f600DeA694ffDb690f3b6d53e940`](https://sepolia.etherscan.io/address/0x1B0Cd34931B6f600DeA694ffDb690f3b6d53e940#code) |
| Registry proxy (official) | Mainnet | [`0xeb5015fF021DB115aCe010f23F55C2591059bBA0`](https://etherscan.io/address/0xeb5015fF021DB115aCe010f23F55C2591059bBA0) |
| `WrapperRegistryLens` (verified) | Mainnet | [`0xaaE82e1872eaF6101B044Bc5dddd7566e688c06d`](https://etherscan.io/address/0xaaE82e1872eaF6101B044Bc5dddd7566e688c06d#code) |

We deploy **only** the Lens; the registry and cTokens are Zama's official contracts.
Mainnet mode surfaces pairs and supports wrap/unwrap; mainnet **decrypt** additionally
needs a Zama mainnet relayer API key (kept server-side, see [Security](#12-security--limitations)).

---

## 7. Monorepo layout

| Package | What |
|---|---|
| `contracts/` | `WrapperRegistryLens` (deployed) + full FHEVM mock harness. Standalone Hardhat project. |
| `sdk/` (`@cwr/sdk`) | Headless integration layer: viem reads + `@zama-fhe/sdk` for the FHE touchpoints. |
| `tools/` (`@cwr/tools`) | Live Sepolia end-to-end verification against the official contracts. |
| `services/price-oracle/` (`@cwr/price-oracle`) | Standalone cached USD price service (zero runtime deps). |
| `services/proxy/` (`@cwr/proxy`) | Server-side proxy for private RPC and the Zama relayer key (origin-allowlisted). |
| `apps/landing/` (`@cwr/landing`) | Branded landing page. |
| `apps/app/` (`@cwr/app`) | Main app: RainbowKit wallet, registry table, faucet, wrap, decrypt, unwrap. |

`sdk`, `tools`, `services/*`, and `apps/*` are npm workspaces; `contracts` stays
standalone (Hardhat deps conflict with hoisting).

---

## 8. Run locally

```bash
npm install            # installs all workspaces
npm run build:sdk      # build @cwr/sdk first (apps import it)
npm run dev:app        # main app on :3001
npm run dev:landing    # landing on :3000
npm run dev:prices     # price oracle on :8787
npm run dev:proxy      # RPC + relayer proxy on :8788 (optional)
```

Env is documented in the committed `.env.example` files
([`apps/app/.env.example`](apps/app/.env.example),
[`services/proxy/.env.example`](services/proxy/.env.example),
[`services/price-oracle/.env.example`](services/price-oracle/.env.example)).
Copy to `.env.local` / `.env` and fill in. The only one you must set for the app:

- `NEXT_PUBLIC_WC_PROJECT_ID` — WalletConnect project id (from cloud.reown.com).
- `NEXT_PUBLIC_SEPOLIA_RPC` — optional; defaults to a public node (or point at the proxy).
- `NEXT_PUBLIC_PRICE_API` — optional; the price-oracle URL for USD totals (default `http://localhost:8787`).

---

## 9. Verify

```bash
cd contracts && npm test         # 29 tests on a mock FHE runtime
cd contracts && npm run coverage # 100% statements / functions / lines (95% branches)
cd tools && npm run e2e:sepolia  # full flow vs the OFFICIAL Sepolia contracts (needs a funded key)
```

**Live e2e output** (run against the official Sepolia registry, Lens, cTokens, and the
testnet relayer):

```
Account: 0xB39E098F5474DE8dcAF1f90E28E0ddf26E719D29

PASS  Read official registry (direct) - 8 pairs
PASS  cUSDCMock present in registry
PASS  Lens read matches direct - 8 pairs
PASS  Faucet mint 1000 cUSDC underlying
PASS  Wrap 100 cUSDC - rate=1 refund=0
PASS  Decrypt confidential balance (EIP-712) - 220 c-units
PASS  Unwrap 40 (two-step finalize)
PASS  Balance decreased after unwrap - 180 c-units

Done. All steps ran against the official Sepolia contracts.
```

This exercises the real registry read, the Lens matching a direct read, faucet, wrap,
EIP-712 decrypt through the relayer, and the two-step unwrap + finalize — end to end.

---

## 10. Extensibility notes

- **Add a chain:** add its ids/addresses to the SDK chain config (`sdk/src/chains.ts`)
  and the supported-chains arrays in the app (`apps/app/lib/networks.ts`). No feature
  code changes.
- **Reuse the SDK:** `@cwr/sdk` is headless — `fetchPairs`, `decryptBalancesBatch`,
  `wrap`, `unwrap`, `confidentialTransfer`, `resolveImportedToken`, etc. work in any
  viem app or Node script (see `tools/` for a Node consumer).
- **Bring your own pair:** the official registry is owner-gated by the Protocol DAO, so
  `contracts/` ships a full mock harness (registry + confidential wrapper + ERC-20). You
  can self-deploy a registry and register a custom ERC-20 ↔ ERC-7984 pair, then point the
  SDK at it — the same UI renders it with zero changes.
- **New official pairs need no code:** the app is entirely registry-driven, so any pair
  the DAO registers shows up automatically.

---

## 11. Tech stack

Next.js · RainbowKit · wagmi / viem · `@zama-fhe/sdk` · Hardhat + `@fhevm/hardhat-plugin`
· OpenZeppelin `confidential-contracts` · shadcn/ui · Tailwind · Zod.

---

## 12. Security & limitations

- **`isValid` is always read on-chain** — revoked pairs are surfaced with a badge, never
  hidden, and the import flow includes revoked pairs so state is honest.
- **Non-standard tokens** (fee-on-transfer, rebasing) are not supported by the wrapper's
  fixed-rate model.
- **Sepolia** tokens are the official faucetable mocks; **mainnet** involves real assets —
  wrap/unwrap carefully.
- **Import resolves only already-registered pairs** — it validates the address against the
  on-chain registry, not arbitrary ERC-20s.
- **Secrets stay server-side** — the mainnet relayer API key and any private RPC live in
  `services/proxy` and are injected server-side; they never reach the browser bundle.

---

## 13. Acknowledgements & license

Built for the **Zama Developer Program (Bounty Track)** on the
[Zama Confidential Blockchain Protocol](https://docs.zama.org/protocol). "Zama" and the
Zama logo are trademarks of Zama; used under their brand guidelines.

Licensed under [MIT](./LICENSE).
