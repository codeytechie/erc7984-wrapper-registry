# @cwr/tools — live Sepolia end-to-end

Proves the full product flow against the **official, already-deployed** Zama
contracts on Sepolia (live registry + a live official wrapper + the live faucet)
through `@cwr/sdk` — not Hardhat mocks, not freshly-deployed test contracts.

## How it differs from the contract tests

- `contracts/test/*` — local Hardhat mocks (unit correctness, never the official contracts).
- `contracts` `test:sepolia` — deploys FRESH mocks to Sepolia (real FHE, still not official).
- **this** — official registry + official wrapper + official faucet, end to end.

## Prerequisites

1. Build the SDK once: `cd ../sdk && npm install && npm run build`.
2. `npm install` here (links `@cwr/sdk` via `file:../sdk`).
3. Copy `.env.example` to `.env` and set:
   - `PRIVATE_KEY` — a funded Sepolia account (test ETH for gas).
   - `SEPOLIA_RPC_URL` — a Sepolia RPC.
   - `LENS_ADDRESS` — optional; set to also check the Lens one-call read path.

## Run

```bash
npm run e2e:sepolia
```

Steps: read the official registry (>=8 pairs) -> faucet-mint the real underlying
-> wrap into the official wrapper -> decrypt the balance via EIP-712 through the
real relayer -> two-step unwrap -> re-decrypt and confirm the drop. Each step
prints PASS/FAIL.

## Node relayer (not web)

`@cwr/sdk`'s `createZamaClient` uses the browser `web()` relayer. This script
uses `createNodeZamaClient` from `@cwr/sdk/node`, which builds the SDK with the
`node()` relayer and a local-key signer — the Node analogue.

## Notes

- Uses cUSDCMock (6-dec, rate 1) by default; the same flow works for cWETHMock
  (18-dec, rate 1e12) to exercise rounding.
- Reads (registry hydration) need no funds; writes (faucet/wrap/unwrap) do.
- No mock contracts are deployed by this script.
