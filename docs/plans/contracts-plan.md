# Confidential Wrapper Registry App — Contracts Plan

> Scope of this doc: **contracts only**. Frontend is a separate phase.
> Every address / signature below was verified against official Zama docs, the
> official Zama GitHub (`github.com/zama-ai`), or on-chain reads. Items that are
> *inferred* or *to be confirmed by you* are explicitly tagged `⚠️ CONFIRM`.

---

## 0. The scope reality (read this first)

You are building a product **on top of contracts Zama already deployed**. The
registry, the seven official wrappers, and the Sepolia `ERC20Mock` faucet tokens
are all live. **You do not redeploy any of them, and you cannot register pairs
into the official registry** (registration is owner-only = Protocol DAO).

So "finishing contracts" means exactly three things:

1. **Bind to existing contracts** — pin verified interfaces/ABIs (no deploy).
2. **Write ONE contract worth deploying: `WrapperRegistryLens`** — a stateless
   view-aggregator that turns N+1 RPC round-trips into a single call. This is
   the highest-ROI contract for the *coverage / UX / production-readiness*
   judging axes.
3. **Build a local mock harness** — deploy mock copies of the whole stack under
   the FHEVM Hardhat mock runtime so the full
   `wrap → decrypt → unwrap → finalizeUnwrap` flow is testable in CI without
   spending Sepolia gas or waiting on the relayer.

Optional but strong for the *extensibility* axis:
4. **Your own registry instance + a custom demo pair** — deploy a private
   `ConfidentialTokenWrappersRegistry`, an `ERC20Mock`, and a `ConfidentialWrapper`,
   then register them — proving the full lifecycle end-to-end.

---

## 1. Toolchain

- **Hardhat + `@fhevm/hardhat-plugin`** (scaffold from `zama-ai/fhevm-hardhat-template`).
  This is the documented, stable path; Foundry/`forge-fhevm` exists but Foundry
  support in core FHEVM is still "coming soon", so Hardhat is the safe default.
- **Three runtime modes** (use all three across the test matrix):
  - *Hardhat in-memory* — mock encryption, for fast CI and coverage.
  - *Hardhat node* — mock encryption, persistent state for integration/frontend.
  - *Sepolia* — **real** encryption; the final correctness gate.
- Reference implementations to read, not fork blindly:
  - `zama-ai/protocol-apps` — the real `ConfidentialTokenWrappersRegistry.sol`
    and `ConfidentialWrapper.sol` (+ `mocks/ERC20Mock.sol`).
  - `zama-ai/dapps` (`packages/hardhat`) — ERC-7984 mint/transfer/decrypt examples.
  - `OpenZeppelin/openzeppelin-confidential-contracts` — `ERC7984`,
    `ERC7984ERC20Wrapper`.

Packages:
```
npm i -D hardhat @fhevm/hardhat-plugin @fhevm/mock-utils @nomicfoundation/hardhat-toolbox
npm i @fhevm/solidity @openzeppelin/confidential-contracts @openzeppelin/contracts
```

---

## 2. Verified facts to bind against

### Registry proxy (UUPS — call the proxy)
| Chain | Address |
|---|---|
| Ethereum mainnet (1) | `0xeb5015fF021DB115aCe010f23F55C2591059bBA0` |
| Sepolia (11155111) | `0x2f0750Bbb0A246059d80e94c454586a7F27a128e` |

### Registry read API (verified verbatim from source)
```solidity
function getTokenConfidentialTokenPairsLength() external view returns (uint256);
function getTokenConfidentialTokenPairsSlice(uint256 fromIndex, uint256 toIndex)
    external view returns (TokenWrapperPair[] memory); // fromIndex incl, toIndex EXCL, INCLUDES revoked
function getTokenConfidentialTokenPair(uint256 index) external view returns (TokenWrapperPair memory);
function getConfidentialTokenAddress(address token) external view returns (bool isValid, address confidentialToken);
function getTokenAddress(address confidentialToken) external view returns (bool isValid, address token);
function isConfidentialTokenValid(address confidentialToken) external view returns (bool);

struct TokenWrapperPair { address tokenAddress; address confidentialTokenAddress; bool isValid; }
```
**Gotchas:** the two `get*Address` calls return `(bool, address)` not a bare
address; the slice **includes revoked pairs**, so you must honor `isValid`.
`isValid` is **never published off-chain** — always read it on-chain.

### ConfidentialWrapper API (verified from docs/source)
```solidity
// Wrap: approve underlying to the wrapper FIRST, then:
function wrap(address to, uint256 amount) external; // rounds down to multiple of rate(), refunds excess

// Unwrap = TWO-STEP ASYNC:
function unwrap(address from, address to, externalEuint64 amount, bytes calldata inputProof) external;
function unwrap(address from, address to, euint64 amount) external; // if caller has ACL on the handle
// -> emits UnwrapRequested(receiver, unwrapRequestId, amount)
function finalizeUnwrap(bytes32 unwrapRequestId, uint64 cleartextAmount, bytes calldata decryptionProof) external;
// -> emits UnwrapFinalized(...)

// Views useful for the Lens / UI:
function rate() external view returns (uint256);          // 10**(underlyingDec - wrapperDec)
function decimals() external view returns (uint8);        // capped at 6
function inferredTotalSupply() external view returns (uint256); // ~ Total Value Shielded
function unwrapRequester(bytes32 id) external view returns (address); // 0x0 if not pending
function unwrapAmount(bytes32 id) external view returns (euint64);
function supportsInterface(bytes4) external view returns (bool); // IERC7984 = 0x4958f2a4
```
**Decimals/rate:** wrapper decimals are capped at **6**. 18-dec underlying →
wrapper 6 dec, `rate = 1e12`. 6-dec underlying → `rate = 1`. Amounts below `rate`
wrap to 0 and fully refund. Non-standard tokens (fee-on-transfer, rebasing,
deflationary) are unsupported.

### Faucet (Sepolia only)
The official Sepolia underlying tokens are `ERC20Mock` with a **permissionless**
mint, cap 1,000,000 whole tokens/call, **no cooldown**. You mint the *underlying*,
then wrap.
```solidity
uint256 public constant MAX_MINT_AMOUNT_TOKENS = 1_000_000;
function mint(address to, uint256 amount) external; // selector 0x40c10f19
```
Underlying mock addresses (decimals): cUSDC/cUSDT/cXAUt = 6 dec; cWETH/cBRON/cZAMA/ctGBP mocks = 18 dec.
(Full address table is in `frontend/src/config/addresses.ts` from the earlier pass — reuse it.)

### FHEVM Solidity config (only if you deploy your own contracts)
Inherit `ZamaEthereumConfig` from `@fhevm/solidity/config/ZamaConfig.sol`; it
resolves host addresses by `block.chainid` (1, 11155111, 31337). The old
`SepoliaConfig` base is removed.

---

## 3. Interfaces to vendor (`contracts/interfaces/`)

Create minimal interfaces so the Lens, tests, and scripts share one source of
truth. Pull the full ABIs from the verified source; the essentials:

- `IConfidentialTokenWrappersRegistry.sol` — the read API in §2.
- `IConfidentialWrapper.sol` — `wrap`, both `unwrap` overloads, `finalizeUnwrap`,
  `rate`, `decimals`, `inferredTotalSupply`, `unwrapRequester`, `unwrapAmount`,
  `confidentialBalanceOf(address) returns (euint64)` `⚠️ CONFIRM` exact name
  against ERC-7984 (OZ uses `confidentialBalanceOf`).
- `IERC20Metadata.sol` — `symbol()`, `name()`, `decimals()` for the underlying.
- `IERC20Mock.sol` — adds `mint(address,uint256)` + `MAX_MINT_AMOUNT_TOKENS()`.

---

## 4. The one contract worth deploying: `WrapperRegistryLens`

**Why:** the registry returns addresses only. To render a usable table you need,
per pair: underlying symbol/decimals, wrapper rate/decimals, TVS, validity, and
ERC-165 confirmation. Done from the client that's N+1 RPC calls and flicker. A
stateless lens collapses it to **one** `eth_call`. It holds no funds, no FHE, no
upgrade surface — pure view aggregation. Cheap to write, easy to audit, and it
reads as production-grade.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IConfidentialTokenWrappersRegistry as IRegistry, TokenWrapperPair}
    from "./interfaces/IConfidentialTokenWrappersRegistry.sol";
import {IConfidentialWrapper} from "./interfaces/IConfidentialWrapper.sol";
import {IERC20Metadata} from "./interfaces/IERC20Metadata.sol";

contract WrapperRegistryLens {
    bytes4 internal constant IERC7984_ID = 0x4958f2a4;

    struct PairView {
        address underlying;
        address wrapper;
        bool    isValid;          // straight from the registry (honors revocation)
        string  underlyingSymbol;
        string  underlyingName;
        uint8   underlyingDecimals;
        uint8   wrapperDecimals;
        uint256 rate;
        uint256 inferredTotalSupply; // ~ TVS
        bool    supportsERC7984;     // ERC-165 sanity check
    }

    /// Single-call snapshot of a page of the registry.
    function getPairs(IRegistry registry, uint256 fromIndex, uint256 toIndex)
        external view returns (PairView[] memory out)
    {
        TokenWrapperPair[] memory pairs =
            registry.getTokenConfidentialTokenPairsSlice(fromIndex, toIndex);
        out = new PairView[](pairs.length);
        for (uint256 i; i < pairs.length; ++i) {
            out[i] = _hydrate(pairs[i]);
        }
    }

    function length(IRegistry registry) external view returns (uint256) {
        return registry.getTokenConfidentialTokenPairsLength();
    }

    function _hydrate(TokenWrapperPair memory p) internal view returns (PairView memory v) {
        v.underlying = p.tokenAddress;
        v.wrapper    = p.confidentialTokenAddress;
        v.isValid    = p.isValid;

        // Each external call is wrapped in try/catch so one bad token never
        // bricks the whole page (production-readiness signal).
        try IERC20Metadata(p.tokenAddress).symbol()   returns (string memory s) { v.underlyingSymbol = s; } catch {}
        try IERC20Metadata(p.tokenAddress).name()     returns (string memory n) { v.underlyingName = n; } catch {}
        try IERC20Metadata(p.tokenAddress).decimals() returns (uint8 d)         { v.underlyingDecimals = d; } catch {}
        try IConfidentialWrapper(p.confidentialTokenAddress).decimals() returns (uint8 d) { v.wrapperDecimals = d; } catch {}
        try IConfidentialWrapper(p.confidentialTokenAddress).rate()     returns (uint256 r){ v.rate = r; } catch {}
        try IConfidentialWrapper(p.confidentialTokenAddress).inferredTotalSupply() returns (uint256 t){ v.inferredTotalSupply = t; } catch {}
        try IConfidentialWrapper(p.confidentialTokenAddress).supportsInterface(IERC7984_ID) returns (bool ok){ v.supportsERC7984 = ok; } catch {}
    }
}
```

Notes:
- Keep it **viem/ethers-callable with no deploy dependency on the official
  contracts** — it takes the registry address as a parameter, so the *same*
  deployed Lens works on both mainnet and Sepolia.
- Optional pagination guard: clamp `toIndex` to `length` inside `getPairs` so the
  client can pass `(0, type(uint256).max)` safely. `⚠️ CONFIRM` you'd rather
  clamp than mirror the registry's `FromIndexGreaterOrEqualToIndex` revert.

---

## 5. Local mock harness (`contracts/mocks/` + `test/`)

Goal: exercise the **exact** official flow locally, including the two-step async
unwrap that needs public decryption.

Deploy under the mock runtime:
1. `ERC20Mock` (copy from `zama-ai/protocol-apps/.../mocks/ERC20Mock.sol`) — gives you `mint`.
2. `ConfidentialWrapper` — **use the Zama `protocol-apps` `ConfidentialWrapper`**
   (it has the real two-step `unwrap`/`finalizeUnwrap` + public-decryption path).
   `⚠️ CONFIRM`: OpenZeppelin's base `ERC7984ERC20Wrapper` advertises "free
   conversion in both directions" — verify whether *its* unwrap is one-step or
   matches Zama's two-step before relying on it; prefer the protocol-apps wrapper
   for fidelity.
3. A local `ConfidentialTokenWrappersRegistry` instance; `registerConfidentialToken(underlying, wrapper)` as owner.

Use the plugin's fixtures + named signers + `userDecryptEuint` / debug-decrypt
utilities (mock runtime only) to assert encrypted values.

---

## 6. Test matrix

Registry / Lens:
- [ ] `length` + paginated `getPairs` reconstructs every pair; revoked pairs
      surface with `isValid=false` (do NOT silently drop them).
- [ ] `getConfidentialTokenAddress` unpacks `(bool,address)` correctly; revoked
      returns `isValid=false` with a non-zero address.
- [ ] Lens `try/catch` survives a deliberately-broken token (no `symbol()`).
- [ ] `rate`/`decimals` correct for a 6-dec and an 18-dec underlying.

Wrap:
- [ ] `approve` then `wrap` mints the rounded amount; sub-`rate` amount mints 0
      and refunds; excess refunded on rounding.

Unwrap (the hard path):
- [ ] `unwrap` with `externalEuint64`+proof emits `UnwrapRequested`, burns input,
      transfers no underlying yet.
- [ ] public-decrypt the requested handle → `finalizeUnwrap(id, cleartext, proof)`
      releases underlying and emits `UnwrapFinalized`.
- [ ] `unwrapRequester(id)` is non-zero while pending, and recovery works after a
      simulated client crash (re-read pending and finalize).
- [ ] zero-balance / never-held `from` reverts as documented (`ERC7984ZeroBalance`).
- [ ] missing ACL on the handle reverts (`ERC7984UnauthorizedUseOfEncryptedAmount`).

Faucet:
- [ ] `mint` succeeds for arbitrary caller; reverts above `MAX_MINT_AMOUNT_TOKENS`.

Run the wrap + full unwrap path once on **Sepolia with real encryption** as the
final gate — mock passing is necessary but not sufficient.

---

## 7. Deployment scripts (`scripts/` or `deploy/`)

- `deploy:lens` → deploy `WrapperRegistryLens` to Sepolia **and** mainnet
  (same bytecode, registry passed per call). Record both addresses; verify on
  Etherscan.
- `deploy:demo-pair` *(optional, extensibility)* → on Sepolia only: deploy
  `ERC20Mock` + `ConfidentialWrapper` + your own registry, register the pair, and
  point the app at your registry via env to show a custom token flowing through
  the exact same UI.
- **Never** write a script that deploys to the official registry/wrappers.

---

## 8. Caveats that will bite (all verified)

1. **`isValid` is on-chain only.** A non-zero wrapper can be revoked. Honor it everywhere.
2. **Slice includes revoked pairs.** Filtering is your job, in the UI not the contract.
3. **6-decimal cap / rounding.** Compute display amounts from `rate()`, not assumed 18.
4. **Two-step unwrap is async.** `finalizeUnwrap` needs a public-decrypted amount +
   `decryptionProof`; the SDK's `publicDecrypt(handles)` returns both.
5. **Mainnet self-deploy caution.** The protocol *is* live on mainnet (cUSDT
   transfers, $100M+ shielded), so reading/wrapping/unwrapping the official
   contracts on mainnet works. BUT the FHEVM dev-library config carried a comment
   marking mainnet host addresses as placeholders — so if you deploy *your own*
   FHE contract to mainnet, `⚠️ CONFIRM` the resolved host addresses are the real
   live ones first. For this bounty you only *read* mainnet, so this is moot
   unless you self-deploy there (don't).
6. **Mainnet pair count.** Docs prose says "six" but lists 7 (incl. cXAUt). Trust
   `getTokenConfidentialTokenPairsLength()`.

---

## 9. Milestone checklist (contracts phase)

- [ ] Scaffold Hardhat from `fhevm-hardhat-template`; plugin + 3 runtime modes working.
- [ ] Vendor interfaces (§3) from verified source.
- [ ] Implement + unit-test `WrapperRegistryLens` against the local mock registry.
- [ ] Stand up the local mock harness (ERC20Mock + ConfidentialWrapper + local registry).
- [ ] Pass the full §6 matrix in mock mode (CI green).
- [ ] Re-run wrap + full two-step unwrap on Sepolia with real encryption.
- [ ] Deploy `WrapperRegistryLens` to Sepolia + mainnet; verify on Etherscan.
- [ ] (Optional) deploy + register the custom demo pair on Sepolia.
- [ ] Freeze deployed addresses into a `deployments.json` the frontend will import.

---

## 10. Source references (for your re-verification)

| Topic | Source |
|---|---|
| Registry API + addresses | `docs.zama.org/protocol/protocol-apps/confidential-tokens/wrapper-registry` + `.../addresses/{mainnet/ethereum,testnet/sepolia}`; `ConfidentialTokenWrappersRegistry.sol` |
| Wrapper API (wrap/unwrap/finalize, rate, decimals) | `.../confidential-tokens/confidential-wrapper`; `ConfidentialWrapper.sol` |
| Faucet `mint` + cap | `protocol-apps/.../mocks/ERC20Mock.sol` |
| FHEVM config `ZamaEthereumConfig` | `docs.zama.org/protocol/solidity-guides/.../configure`; `fhevm` `library-solidity/config/ZamaConfig.sol` |
| Hardhat plugin + 3 runtime modes | `docs.zama.org/protocol/solidity-guides/development-guide/hardhat/run_test`; `zama-ai/fhevm-mocks`, `fhevm-hardhat-template` |
| OZ confidential contracts | `docs.openzeppelin.com/confidential-contracts/token` |
| Mainnet liveness | mainnet launch (first cUSDT transfer) + Portfolio app shield/unshield on mainnet |

> The addresses here were sourced from your verification agent's report. Before
> mainnet deploy of the Lens, re-confirm the registry addresses with a fresh
> on-chain read.