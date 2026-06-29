# ERC-7984 Confidential Wrapper Registry

![CI](https://github.com/codeytechie/erc7984-wrapper-registry/actions/workflows/ci.yml/badge.svg)

Browse every ERC-20 to ERC-7984 pair on Zama's Confidential Token protocol, then
wrap, decrypt your balance via EIP-712, and unwrap, against live Sepolia.

## Layout

| Package | What |
|---|---|
| `contracts/` | `WrapperRegistryLens` (deployed) + FHEVM mock harness. Standalone Hardhat project. |
| `sdk/` (`@cwr/sdk`) | Headless integration layer: viem reads + Zama SDK for the FHE touchpoints. |
| `tools/` (`@cwr/tools`) | Live Sepolia end-to-end verification against the official contracts. |
| `services/price-oracle/` (`@cwr/price-oracle`) | Standalone cached USD price service for known tokens. |
| `apps/landing/` (`@cwr/landing`) | Branded landing page. |
| `apps/app/` (`@cwr/app`) | Main app: RainbowKit wallet, registry table, faucet, wrap, decrypt, unwrap. |

`sdk`, `tools`, and `apps/*` are npm workspaces; `contracts` stays standalone
(Hardhat deps conflict with hoisting).

## Live deployments (Sepolia)

- Registry proxy: `0x2f0750Bbb0A246059d80e94c454586a7F27a128e`
- `WrapperRegistryLens`: `0x1B0Cd34931B6f600DeA694ffDb690f3b6d53e940`

## Run

```bash
npm install            # installs all workspaces
npm run build:sdk      # build @cwr/sdk first (apps import it)
npm run dev:app        # main app on :3001
npm run dev:landing    # landing on :3000
npm run dev:prices     # price oracle on :8787
```

App env (`apps/app/.env.local`): `NEXT_PUBLIC_WC_PROJECT_ID` (WalletConnect, from
cloud.reown.com) and `NEXT_PUBLIC_SEPOLIA_RPC`.

## Verify

```bash
cd contracts && npm test          # 29 tests, mock FHE runtime
cd tools && npm run e2e:sepolia   # full flow vs official contracts (needs funded key)
```
