# Zama Confidential Wrapper Registry — Verification Report

All addresses below come only from official Zama docs (docs.zama.org), the official Zama GitHub (github.com/zama-ai), or on-chain/Etherscan reads. No third-party/airdrop sources were used. Items where official sources disagree are flagged.

---

## 1. Registry deployed address (UUPS proxy)

**ANSWER:** It is an upgradeable proxy (OpenZeppelin `ERC1967Proxy`, the standard front for a UUPS-upgradeable implementation — docs call it UUPS, consistent). Call the **proxy** address:

- **Ethereum mainnet (1):** `0xeb5015fF021DB115aCe010f23F55C2591059bBA0` (impl `0xA989D32d7348e0da8145c6282e839dfc4db8954f`)
- **Sepolia (11155111):** `0x2f0750Bbb0A246059d80e94c454586a7F27a128e` (impl `0x50C271E25ee953dd21e916311db81e228c9Bdb59`)

**SOURCE_URL:**
- https://docs.zama.org/protocol/protocol-apps/addresses/mainnet/ethereum.md
- https://docs.zama.org/protocol/protocol-apps/addresses/testnet/sepolia.md
- https://docs.zama.org/protocol/protocol-apps/confidential-tokens/wrapper-registry.md (UUPS)
- https://etherscan.io/address/0xeb5015fF021DB115aCe010f23F55C2591059bBA0
- https://sepolia.etherscan.io/address/0x2f0750Bbb0A246059d80e94c454586a7F27a128e

**CONFIDENCE:** high

---

## 2. Registry read function signatures

**ANSWER:** All six exist exactly as named in the `.sol` source. Verbatim:

```solidity
function getTokenConfidentialTokenPairsSlice(uint256 fromIndex, uint256 toIndex) public view returns (TokenWrapperPair[] memory)
function getTokenConfidentialTokenPairsLength() public view returns (uint256)
function getTokenConfidentialTokenPair(uint256 index) public view returns (TokenWrapperPair memory)
function getConfidentialTokenAddress(address tokenAddress) public view returns (bool, address)
function getTokenAddress(address confidentialTokenAddress) public view returns (bool, address)
function isConfidentialTokenValid(address confidentialTokenAddress) public view returns (bool)
struct TokenWrapperPair { address tokenAddress; address confidentialTokenAddress; bool isValid; }
```

**Differences to note (signatures match; return shapes are the gotcha):**

- `getConfidentialTokenAddress(address)` returns **`(bool, address)`** — a found-flag + address, NOT a bare `address`. Same for `getTokenAddress(address)`.
- `getTokenConfidentialTokenPairsSlice(fromIndex, toIndex)`: `fromIndex` inclusive, `toIndex` exclusive, and it **includes revoked (isValid=false) pairs**.

**SOURCE_URL:** https://raw.githubusercontent.com/zama-ai/protocol-apps/main/contracts/confidential-token-wrappers-registry/contracts/ConfidentialTokenWrappersRegistry.sol

**CONFIDENCE:** high

---

## 3. Currently registered pairs per chain

> ⚠️ **Caveat:** the docs do NOT publish the live `isValid` flag — the wrapper-registry doc explicitly says to query it on-chain. The `isValid` column below was **not** live-read (no RPC in this run). To get it at runtime call `getTokenConfidentialTokenPairsLength()` then `getTokenConfidentialTokenPairsSlice(0, length)` (each `TokenWrapperPair` carries `isValid`), or `isConfidentialTokenValid(wrapper)` per token.

### Ethereum mainnet (1) — source: addresses/mainnet/ethereum.md

| Symbol | Underlying ERC-20 | ERC-7984 wrapper | isValid |
|---|---|---|---|
| cUSDC | `0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48` | `0xe978F22157048E5DB8E5d07971376e86671672B2` | query on-chain |
| cUSDT | `0xdAC17F958D2ee523a2206206994597C13D831ec7` | `0xAe0207C757Aa2B4019Ad96edD0092ddc63EF0c50` | query on-chain |
| cWETH | `0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2` | `0xda9396b82634Ea99243cE51258B6A5Ae512D4893` | query on-chain |
| cBRON | `0xBA2C598E11eD093079cC324FCa5BbbA99F616E83` | `0x85dE671c3bec1aDeD752c3Cea943521181C826bc` | query on-chain |
| cZAMA | `0xA12CC123ba206d4031D1c7f6223D1C2Ec249f4f3` | `0x80CB147Fd86dC6dEe3Eee7e4Cee33d1397d98071` | query on-chain |
| ctGBP | `0x27f6c8289550fce67f6b50bed1f519966afe5287` | `0xa873750ccBafD5ec7Dd13bfD5237d7129832eDD9` | query on-chain |
| cXAUt | `0x68749665FF8D2d112Fa859AA293F07A622782F38` | `0x73cc9aF9d6BEFdb3c3fAf8a5E8c05Cb95FdaEEf1` | query on-chain |

> 🚩 **Docs internal disagreement:** the mainnet page's prose says "six" wrappers but its table lists **7** (the 7th is cXAUt / Tether Gold). Confirm the true count via `getTokenConfidentialTokenPairsLength()` on-chain.

### Sepolia (11155111) — source: addresses/testnet/sepolia.md

| Symbol | Underlying ERC-20 | ERC-7984 wrapper | isValid |
|---|---|---|---|
| cUSDCMock | `0x9b5Cd13b8eFbB58Dc25A05CF411D8056058aDFfF` | `0x7c5BF43B851c1dff1a4feE8dB225b87f2C223639` | query on-chain |
| cUSDTMock | `0xa7dA08FafDC9097Cc0E7D4f113A61e31d7e8e9b0` | `0x4E7B06D78965594eB5EF5414c357ca21E1554491` | query on-chain |
| cWETHMock | `0xff54739b16576FA5402F211D0b938469Ab9A5f3F` | `0x46208622DA27d91db4f0393733C8BA082ed83158` | query on-chain |
| cBRONMock | `0xFf021fB13cA64e5354c62c954b949a88cfDEb25E` | `0xaa5612FA27c927a0c7961f5AEFEE5ba3A0F9C891` | query on-chain |
| cZAMAMock | `0x75355a85c6FB9df5f0C80FF54e8747EEe9a0BF57` | `0xf2D628d2598aF4eAF94CB76a437Ff86CA78FfbFB` | query on-chain |
| ctGBPMock | `0x93c931278A2aad1916783F952f94276eA5111442` | `0xfCE5c7069c5525eF6c8C2b2E35A745bA20a2F7CC` | query on-chain |
| cXAUtMock | `0x24377AE4AA0C45ecEe71225007f17c5D423dd940` | `0xe4FcF848739845BC81Dee1d5352cf3844F0a60C7` | query on-chain |
| ctGBP (non-mock) | `0xf6Ef9ADB61A48E29E36bc873070A46A3D2667ff3` | `0x167DC962808B32CFFFc7e14B5018c0bE06A3A208` | query on-chain |

**SOURCE_URL:**
- https://docs.zama.org/protocol/protocol-apps/addresses/mainnet/ethereum.md
- https://docs.zama.org/protocol/protocol-apps/addresses/testnet/sepolia.md
- https://docs.zama.org/protocol/protocol-apps/confidential-tokens/wrapper-registry.md

**CONFIDENCE:** high (addresses) / unverified (isValid — not published, not live-read)

---

## 4. Sepolia testnet mock tokens

**ANSWER:** Note: the docs term is "Confidential Token Wrappers (Mock)" (symbols `cXxxMock`), not literally "cTokenMock". Two layers exist: faucetable **underlying** `ERC20Mock` tokens, and their **confidential wrappers**. Decimals were read on-chain (docs don't publish them).

| Wrapper | Wrapper addr | Underlying ERC-20 mock | Decimals |
|---|---|---|---|
| cUSDCMock | `0x7c5BF43B851c1dff1a4feE8dB225b87f2C223639` | `0x9b5Cd13b8eFbB58Dc25A05CF411D8056058aDFfF` | 6 |
| cUSDTMock | `0x4E7B06D78965594eB5EF5414c357ca21E1554491` | `0xa7dA08FafDC9097Cc0E7D4f113A61e31d7e8e9b0` | 6 |
| cWETHMock | `0x46208622DA27d91db4f0393733C8BA082ed83158` | `0xff54739b16576FA5402F211D0b938469Ab9A5f3F` | 18 |
| cBRONMock | `0xaa5612FA27c927a0c7961f5AEFEE5ba3A0F9C891` | `0xFf021fB13cA64e5354c62c954b949a88cfDEb25E` | 18 |
| cZAMAMock | `0xf2D628d2598aF4eAF94CB76a437Ff86CA78FfbFB` | `0x75355a85c6FB9df5f0C80FF54e8747EEe9a0BF57` | 18 |
| ctGBPMock | `0xfCE5c7069c5525eF6c8C2b2E35A745bA20a2F7CC` | `0x93c931278A2aad1916783F952f94276eA5111442` | 18 |
| cXAUtMock | `0xe4FcF848739845BC81Dee1d5352cf3844F0a60C7` | `0x24377AE4AA0C45ecEe71225007f17c5D423dd940` | 6 |

There is also a **non-mock** confidential wrapper on Sepolia: **ctGBP** `0x167DC962808B32CFFFc7e14B5018c0bE06A3A208`, underlying `0xf6Ef9ADB61A48E29E36bc873070A46A3D2667ff3`.

**SOURCE_URL:** https://docs.zama.org/protocol/protocol-apps/addresses/testnet/sepolia.md (addresses) + on-chain `decimals()`/`symbol()` reads via Sepolia RPC

**CONFIDENCE:** high (addresses + decimals); terminology "cTokenMock" is your label, docs say "Confidential Token Wrappers (Mock)"

---

## 5. Faucet mechanism

**ANSWER:** On-chain **`mint(address to, uint256 amount)`** (selector `0x40c10f19`) on the **underlying** `ERC20Mock` contracts. **No web faucet URL.** It is `external` with **no access modifier — fully permissionless** (anyone can call). **Per-call cap = `MAX_MINT_AMOUNT_TOKENS * 10**decimals()` = 1,000,000 whole tokens per call.** **No time-based cooldown/rate limit** in the contract. It is `mint`, not `drip`. (Wrappers themselves aren't faucet-minted — you mint the underlying, then wrap.)

```solidity
uint256 public constant MAX_MINT_AMOUNT_TOKENS = 1_000_000;
function mint(address to, uint256 amount) external {
    uint256 maxMintAmount = MAX_MINT_AMOUNT_TOKENS * 10 ** decimals();
    if (amount > maxMintAmount) revert MintAmountExceedsMax(amount, maxMintAmount);
    _mint(to, amount);
}
```

On-chain confirm: `MAX_MINT_AMOUNT_TOKENS()` on `0x9b5Cd13b8eFbB58Dc25A05CF411D8056058aDFfF` returns `0xf4240` = 1,000,000.

**SOURCE_URL:** https://raw.githubusercontent.com/zama-ai/protocol-apps/main/contracts/confidential-token-wrappers-registry/contracts/mocks/ERC20Mock.sol + Sepolia RPC read

**CONFIDENCE:** high

---

## 6. Official ConfidentialWrapper addresses (Sepolia + mainnet)

**ANSWER:** The wrapper addresses **come from the registry** (they are the ERC-7984 addresses in item 3's pairs). The docs publish them as a **static convenience mirror**, but the on-chain WrappersRegistry is the authoritative source — the ConfidentialWrapper doc page itself has no static list and points you to the registry. Look up via `getConfidentialTokenAddress(erc20)` → `(isValid, wrapper)` and always check `isValid` before use. Mainnet wrappers: cUSDC/cUSDT/cWETH/cBRON/cZAMA/ctGBP/cXAUt per item 3. Sepolia: the mock wrappers + non-mock ctGBP `0x167DC962808B32CFFFc7e14B5018c0bE06A3A208` per item 3.

**SOURCE_URL:**
- https://docs.zama.org/protocol/protocol-apps/confidential-tokens/confidential-wrapper.md
- https://docs.zama.org/protocol/protocol-apps/confidential-tokens/wrapper-registry.md
- https://docs.zama.org/protocol/protocol-apps/addresses/mainnet/ethereum.md
- https://docs.zama.org/protocol/protocol-apps/addresses/testnet/sepolia.md

**CONFIDENCE:** high

---

## 7. SDK package versions + networks

**ANSWER:** Correct scope is `@zama-fhe/`:

- `@zama-fhe/sdk` — latest = **3.0.1** (a `3.1.0-alpha.9` pre-release exists, not `latest`)
- `@zama-fhe/react-sdk` — latest = **3.0.1** (same alpha note)

Both support **mainnet (1)** and **Sepolia (11155111)**: the SDK ships network presets `MainnetConfig` (chainId 1) and `SepoliaConfig` (11155111) plus `HardhatConfig` — confirmed in source (`packages/sdk/src/relayer/relayer-utils.ts`).

**SOURCE_URL:**
- https://registry.npmjs.org/@zama-fhe/sdk
- https://registry.npmjs.org/@zama-fhe/react-sdk
- https://github.com/zama-ai/sdk/blob/main/packages/sdk/src/relayer/relayer-utils.ts

**CONFIDENCE:** high (versions, package names, network presets)

---

## 8. CRITICAL — does `unshield()` auto-orchestrate the two-step unwrap?

**ANSWER: YES — the SDK does it internally; the developer does NOT orchestrate manually.** The high-level `Token` class exposes **`shield` / `unshield` / `balanceOf` / `confidentialTransfer`**. `unshield(amount)` internally: submits `unwrap()` → waits for the `UnwrapRequested` event → calls relayer `publicDecrypt()` to get the cleartext + `decryptionProof` → submits `finalizeUnwrap(...)`. Low-level `unwrap()` / `finalizeUnwrap()` / `resumeUnshield()` are exposed for manual control if wanted.

Verbatim from docs: *"unshield — Withdraws confidential tokens back to public ERC-20. Orchestrates the two-step on-chain process (unwrap + finalize) in a single call."*

Verbatim from source (`packages/sdk/src/token/token.ts`):

```ts
// Unshield a specific amount and finalize in one call.
// Orchestrates: unshield → wait for receipt → parse event → finalize.
async unshield(amount, options?) {
  const unwrapResult = await this.unwrap(amount);
  ...
  return this.#waitAndFinalizeUnshield(...);
}
async finalizeUnwrap(burnAmountHandle) {
  const result = await this.sdk.publicDecrypt([burnAmountHandle]);
  ...
  finalizeUnwrapContract(this.wrapper, burnAmountHandle, clearValue, result.decryptionProof);
}
```

> ⚠️ Caveat: the **`sdk.createToken(addr)` factory name is not verbatim-confirmed** — docs call it the `Token`/`ReadonlyToken` class. The shield/unshield behavior is fully confirmed; treat the exact factory name as low confidence.

**SOURCE_URL:**
- https://docs.zama.org/protocol/sdk/api-references/sdk/token.md
- https://raw.githubusercontent.com/zama-ai/sdk/main/packages/sdk/src/token/token.ts
- https://docs.zama.org/protocol/protocol-apps/confidential-tokens/confidential-wrapper.md

**CONFIDENCE:** high (behavior) / low (the literal `createToken` name)

---

## 9. USER decryption API (EIP-712)

**ANSWER:**

- **Core SDK:** `instance.generateKeypair()` → `instance.createEIP712(publicKey, contractAddresses, startTimeStamp, durationDays)` → sign with `signer.signTypedData(...)` → `instance.userDecrypt(handleContractPairs, privateKey, publicKey, signature, contractAddresses, signerAddress, startTimeStamp, durationDays)`. High-level form: `userDecrypt(handles) → Promise<Record<Handle, ClearValue>>`.
- **React SDK hook:** **`useUserDecrypt(config, options?)`**, EIP-712 via the prerequisite **`useAllow`** hook.
- **EIP-712:** YES (`createEIP712` builds the typed data). **Session caching:** YES — grant is time-bounded by `startTimeStamp`+`durationDays`; React SDK caches credentials after first `allow()` (default `keypairTTL` 30 days, persisted across reloads, scoped by signer/contract/handle) → one signature reused across decrypts in the window.

**SOURCE_URL:**
- https://docs.zama.org/protocol/sdk/api-references/react/useuserdecrypt.md
- https://docs.zama.org/protocol/sdk/api-references/sdk.md
- https://docs.zama.org/protocol/solidity-guides/v0.10/docs/sdk-guides/user-decryption.md

**CONFIDENCE:** high (hook name, EIP-712, caching) / medium (exact core-SDK argument order in the newest 3.x package — corroborated from the v0.10 guide)

---

## 10. PUBLIC decryption API

**ANSWER:** **`instance.publicDecrypt(handles)`** → `Promise<PublicDecryptResults>`; input = array of ciphertext handles (hex), output = handle→cleartext map. In the SDK source, `Token.finalizeUnwrap` calls `sdk.publicDecrypt([handle])` and reads `result.clearValues[handle]` **and `result.decryptionProof`** — so the SDK's `publicDecrypt` result does carry the `decryptionProof` consumed by `finalizeUnwrap`.

> ⚠️ The public-decryption **docs pages** describe only the cleartext map and don't verbatim document the returned `decryptionProof` field; the proof's presence is confirmed from the **token.ts source** (item 8), not the public-decryption doc page. Also: `RelayerCleartext` (local/dev) supports `publicDecrypt` but throws on ZK-proof verification — production proofs require `RelayerWeb`/`RelayerNode` on a real network.

**SOURCE_URL:**
- https://docs.zama.org/protocol/sdk/api-references/sdk.md
- https://raw.githubusercontent.com/zama-ai/sdk/main/packages/sdk/src/token/token.ts (`result.decryptionProof`)
- https://docs.zama.org/protocol/sdk/api-references/sdk/relayercleartext.md

**CONFIDENCE:** high (method name/signature + that the result feeds `finalizeUnwrap`'s proof) / docs-page-only proof description is medium

---

## 11. Public relayer endpoints (`relayerUrl`)

**ANSWER (from canonical SDK source `relayer-utils.ts`):**

- **Mainnet (1):** `relayerUrl: "https://relayer.mainnet.zama.org/v2"`, `gatewayChainId: 261131`, ACL `0xcA2E8f1F656CD25C01F05d0b243Ab1ecd4a8ffb6`, KMS `0x77627828a55156b04Ac0DC0eb30467f1a552BB03`
- **Sepolia (11155111):** `relayerUrl: "https://relayer.testnet.zama.org/v2"`, `gatewayChainId: 10901`, ACL `0xf0Ffdc93b7E186bC2f8CB3dAA75D86d1930A433D`, KMS `0xbE0E383937d564D7FF0BC3b46c51f0bF8d5C311A`

You supply your own host RPC (e.g. an Ethereum/Sepolia provider); the SDK abstracts the Gateway chain. Easiest: `import { RelayerWeb, MainnetConfig, SepoliaConfig } from "@zama-fhe/sdk"`.

> 🚩 **Docs vs source disagreement:** the docs page shows `https://relayer.testnet.zama.org` (no suffix); the **shipped SDK source uses the `/v2` suffix** (`relayer.testnet.zama.org/v2`, `relayer.mainnet.zama.org/v2`). Use the source value with `@zama-fhe/sdk` 3.x. Also note the **legacy** `@zama-fhe/relayer-sdk` uses a different host `relayer.testnet.zama.cloud` + gatewayChainId `55815` — do **not** mix it with the new SDK.

**SOURCE_URL:**
- https://github.com/zama-ai/sdk/blob/main/packages/sdk/src/relayer/relayer-utils.ts (canonical)
- https://docs.zama.org/protocol/sdk/guides/configuration.md
- https://docs.zama.org/protocol/solidity-guides/copy-of-v0.12/smart-contract/configure/contract_addresses.md (Sepolia only; no mainnet URL on docs page)

**CONFIDENCE:** high (both URLs from shipped source; mainnet was NOT in docs — resolved from source)

---

## 12. FHEVM host-chain config (ZamaConfig / ZamaEthereumConfig)

**ANSWER:** Current inheritable config is **`ZamaEthereumConfig`** (from `@fhevm/solidity/config/ZamaConfig.sol`), which resolves addresses by `block.chainid` (1 → mainnet, 11155111 → Sepolia, 31337 → local). Inherit it: `contract MyERC20 is ZamaEthereumConfig`. The on-chain `CoprocessorConfig` struct carries only 3 addresses (ACL, Coprocessor=FHEVMExecutor, KMSVerifier); InputVerifier and DecryptionOracle are not in the inheritable struct and appear only on the docs reference page.

| Component | Sepolia (11155111) | Mainnet (1) |
|---|---|---|
| FHEVMExecutor / Coprocessor | `0x92C920834Ec8941d2C77D188936E1f7A6f49c127` | `0xD82385dADa1ae3E969447f20A3164F6213100e75` |
| ACL | `0xf0Ffdc93b7E186bC2f8CB3dAA75D86d1930A433D` | `0xcA2E8f1F656CD25C01F05d0b243Ab1ecd4a8ffb6` |
| KMSVerifier | `0xbE0E383937d564D7FF0BC3b46c51f0bF8d5C311A` | `0x77627828a55156b04Ac0DC0eb30467f1a552BB03` |
| DecryptionOracle | `0x5D8BD78e2ea6bbE41f26dFe9fdaEAa349e077478` | NOT FOUND (not listed for mainnet) |
| InputVerifier | `0xBBC1fFCdc7C316aAAd72E807D9b0272BE8F84DA0` | NOT FOUND (not listed for mainnet) |

> 🚩 **Flags:**
> 1. `ZamaConfig.sol`'s `_getEthereumConfig()` carries a verbatim comment that the **mainnet addresses are placeholders** ("to be replaced with actual addresses once deployed on the Ethereum mainnet") — treat mainnet liveness as **low** confidence.
> 2. "SepoliaConfig" as the old inheritable base is **gone from the current `library-solidity` config** (replaced by `ZamaConfig` + `ZamaEthereumConfig`), but a differently-shaped `SepoliaConfig` *library* still exists under `sdk/js-sdk/contracts/src/`. The docs show `ZamaEthereumConfig` as the example but contain **no explicit "SepoliaConfig deprecated" notice** — so "SepoliaConfig is removed" is medium confidence, inferred from source structure.

**SOURCE_URL:**
- https://github.com/zama-ai/fhevm/blob/main/library-solidity/config/ZamaConfig.sol
- https://docs.zama.org/protocol/solidity-guides/copy-of-v0.12/smart-contract/configure.md
- https://docs.zama.org/protocol/solidity-guides/copy-of-v0.12/smart-contract/configure/contract_addresses.md

**CONFIDENCE:** high (3 core addresses match source + docs) / low (mainnet liveness — source says placeholder) / medium (SepoliaConfig removal — no explicit deprecation notice)

---

## Cross-source disagreements flagged

1. **Item 3** — mainnet docs prose says "six" wrappers; its own table lists **7** (incl. cXAUt). Verify count on-chain via `getTokenConfidentialTokenPairsLength()`.
2. **Item 11** — docs show `relayer.testnet.zama.org` (no path); shipped SDK source uses **`/v2`** suffix and gives mainnet `relayer.mainnet.zama.org/v2`. Trust the source for `@zama-fhe/sdk` 3.x.
3. **Item 12** — `ZamaConfig.sol` marks mainnet FHEVM addresses as **placeholders**; verify before any mainnet deploy.
4. **Item 3 `isValid`** — never published in docs; must be read on-chain (not verified live here).
5. **Item 12 mainnet DecryptionOracle/InputVerifier** — NOT FOUND in official sources.
