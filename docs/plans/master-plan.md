# Confidential Wrapper Registry App — Master Plan (Sepolia)

> Goal: a production-ready app that (1) surfaces **every** ERC-20 ↔ ERC-7984
> pair on Sepolia, (2) wraps/unwraps any pair, (3) decrypts any ERC-7984 balance
> via the **EIP-712 user-decryption** flow, (4) has a Sepolia faucet for the
> official mocks.
>
> Scope note: this bounty version is **Sepolia-only**. Mainnet is no longer
> required — treat a read-only mainnet view as an optional bonus for the
> *coverage / extensibility* axes, not a must.

---

## A. The four hard requirements (must all work end-to-end)

| # | Requirement | How (verified) | Done when |
|---|---|---|---|
| 1 | Surface **every** pair | `registry.getTokenConfidentialTokenPairsLength()` + `getTokenConfidentialTokenPairsSlice(0,len)`, read **live** (not hardcoded), via the `WrapperRegistryLens` for one-call hydration | All 8 Sepolia pairs render incl. the non-mock ctGBP; revoked pairs are shown-as-revoked or filtered, never silently dropped |
| 2 | Wrap / unwrap any pair | Wrap = `approve(underlying)` → `wrapper.wrap(to,amount)`; Unwrap = SDK `token.unshield(amount)` (auto unwrap→publicDecrypt→finalize) | Round-trip works on Sepolia with real encryption for a 6-dec and an 18-dec token |
| 3 | Decrypt any balance via EIP-712 | SDK `token.balanceOf()` (convenience) **and** explicit `useUserDecrypt`+`useAllow` so the EIP-712 signature step is visible | A revealed cleartext balance after one signature; session cached for further decrypts |
| 4 | Sepolia faucet | `mint(to, amount)` on the underlying `ERC20Mock` (permissionless, cap 1,000,000 whole tokens, no cooldown) | One-click mint → balance increases → wrap works |

---

## B. Definition of Done, per judging criterion

### Coverage
- [ ] Pairs read **live from the registry**, not a static list — new official pairs appear with zero code change. (This is the whole point of the bounty.)
- [ ] All token decimals handled (6-dec USDC/USDT/XAUt and 18-dec WETH/BRON/ZAMA/tGBP).
- [ ] Revoked (`isValid=false`) pairs handled explicitly (badge + filter toggle).
- [ ] Per-pair metadata surfaced: underlying symbol/decimals, wrapper rate/decimals, inferred total supply (TVS).
- [ ] *(Bonus)* read-only mainnet tab using the same Lens.

### Correctness
- [ ] `getConfidentialTokenAddress` / `getTokenAddress` decoded as `(bool, address)` tuples.
- [ ] Slice is known to include revoked pairs → validity filtering is explicit.
- [ ] Wrap amount math: round **down** to a multiple of `rate()`, show the user the actual received amount and any refund; sub-`rate` amounts wrap to 0.
- [ ] Two-step unwrap fully completes, including `finalizeUnwrap` with the public-decrypted amount + proof (the SDK does this inside `unshield`).
- [ ] User-decrypt returns the correct cleartext (assert against a known wrapped amount in tests).
- [ ] Faucet rejects > 1,000,000 whole tokens.
- [ ] **Full flow validated on Sepolia with real encryption**, not just mock.

### Extensibility
- [ ] Addresses + chains in one config module; adding a chain (e.g. mainnet) is a config change, not a rewrite.
- [ ] `WrapperRegistryLens` deployed so any consumer gets one-call pair data.
- [ ] Registry-driven everywhere (no per-token special-casing).
- [ ] *(Strong)* "Bring your own pair" demo: deploy your own registry + `ERC20Mock` + `ConfidentialWrapper`, register it, point the app at it via env — proves the product generalizes.
- [ ] Typed ABIs (`as const`) and exported hooks others can reuse.
- [ ] A short "How to extend" section in the README.

### UX
- [ ] Wallet connect + Sepolia network detection/switch prompt.
- [ ] **One-signature decrypt session** (cached) — not a signature per balance.
- [ ] Async states modeled honestly: wrap pending, unwrap *requested* → *finalizing* → *done*; persist a pending unwrap so a refresh can resume (re-read `unwrapRequester(id)`).
- [ ] Clear empty/loading/error states; relayer-timeout and ACL errors get human messages, not raw reverts.
- [ ] Faucet, wrap, unwrap, and reveal are obvious and reachable in ≤2 clicks from a pair.
- [ ] Rounding/refund explained inline at wrap time.
- [ ] Responsive to mobile; visible keyboard focus; reduced-motion respected.

### Code quality
- [ ] TypeScript strict; no `any` on contract boundaries.
- [ ] FHE touchpoints isolated in a thin client/hooks layer (rest is plain wagmi/viem).
- [ ] Contract tests (registry reads incl. revoked, wrap rounding, two-step unwrap, ACL revert, faucet cap) — see CONTRACTS_PLAN §6.
- [ ] Lint + format + CI green; no secrets committed; env via `.env.example`.
- [ ] Comments only where the gotcha is non-obvious (tuple returns, slice-includes-revoked, 6-dec cap).

### Production-readiness
- [ ] Deployed, working public URL (Vercel/Netlify/etc.).
- [ ] RelayerWeb WASM bundling working under Vite (the #1 setup failure — budget time).
- [ ] Graceful relayer failure: retry + clear fallback messaging.
- [ ] No console errors; error boundary around the FHE surface.
- [ ] README with setup/run/deploy + architecture diagram; 2–3 min demo video.
- [ ] `deployments.json` with your Lens address(es), imported by the frontend.

---

## C. Build sequence (do in this order)

**Phase 0 — Lock inputs (½ day).**
Run the live read your agent offered: `getTokenConfidentialTokenPairsLength()` +
`getTokenConfidentialTokenPairsSlice(0,len)` on Sepolia to capture current
`isValid` and exact count. Freeze the verified addresses into config.

**Phase 1 — Contracts (per CONTRACTS_PLAN.md).**
Hardhat + `@fhevm/hardhat-plugin` → `WrapperRegistryLens` + local mock harness +
test matrix green in mock mode → validate wrap + full unwrap on Sepolia (real
encryption) → deploy Lens to Sepolia → write `deployments.json`.

**Phase 2 — Frontend scaffold.**
Vite + React + TS + wagmi + viem + `@zama-fhe/react-sdk` + `@tanstack/react-query`.
Wire `ZamaProvider` + `RelayerWeb` (Sepolia transport, `relayer.testnet.zama.org/v2`).
Confirm a trivial decrypt works before building features.

**Phase 3 — Registry browser** → satisfies *coverage*. Read via Lens; render all
pairs with metadata + validity.

**Phase 4 — Faucet** → satisfies requirement 4. `mint` underlying, then refresh balance.

**Phase 5 — Wrap** → `approve` + `wrap`, with rounding/refund UX.

**Phase 6 — Balance decrypt** → the headline. `useAllow` + `useUserDecrypt`
(EIP-712), one-signature session, reveal with loading state.

**Phase 7 — Unwrap** → `token.unshield()`; model requested→finalizing→done;
persist + resume pending requests.

**Phase 8 — Polish** → error states, mobile, network guard, empty states.

**Phase 9 — Ship** → deploy, README + diagram, demo video, final Sepolia run-through.

---

## D. What actually wins (it's a quality contest, not a checklist)

Three or fewer winners, judged on quality. Differentiators that separate 1st from "it works":

1. **Registry-as-source-of-truth, provably.** Demonstrate that revoking/adding a
   pair in *your own* registry instance updates the UI with no redeploy. That's
   the literal thesis of the bounty.
2. **The unwrap UX nobody else nails.** The two-step async finalize is where most
   entries will feel broken. A resumable, clearly-stated pending flow stands out.
3. **One-signature decryption** with cached session — feels like a product, not a demo.
4. **The Lens contract + clean extension story** — signals you built a *template*
   for the ecosystem, which is exactly what "Create templates and resources" asks.
5. **A real README + video.** Judges scoring six axes across many entries reward
   the submission they can evaluate in 5 minutes.

---

## E. Known traps (all verified earlier)

- WASM/relayer bundling under Vite — lose a day here, plan for it.
- ACL before decrypt — unauthorized handle = hanging promise.
- `(bool, address)` tuple returns from the registry getters.
- Slice includes revoked pairs — filter on `isValid`.
- 6-decimal cap + round-to-`rate` — don't assume 18 decimals.
- Use `@zama-fhe/sdk` 3.x relayer URLs **with `/v2`**; don't mix with legacy `relayer-sdk`.