import "dotenv/config";
import { formatUnits } from "viem";
import { createNodeZamaClient } from "@cwr/sdk/node";
import {
  fetchPairs,
  fetchPairsDirect,
  faucetMint,
  previewWrap,
  wrap,
  decryptBalance,
  unwrap,
  SEPOLIA_ID,
  CHAINS,
} from "@cwr/sdk";

const RPC = process.env.SEPOLIA_RPC_URL;
const KEY = process.env.PRIVATE_KEY as `0x${string}` | undefined;
const LENS = process.env.LENS_ADDRESS as `0x${string}` | undefined;

// cUSDCMock: 6-dec, rate 1 (simplest)
const UNDERLYING = "0x9b5Cd13b8eFbB58Dc25A05CF411D8056058aDFfF" as const;
const WRAPPER = "0x7c5BF43B851c1dff1a4feE8dB225b87f2C223639" as const;
const DECIMALS = 6;

function log(step: string, ok: boolean, extra = ""): void {
  console.log(`${ok ? "PASS" : "FAIL"}  ${step}${extra ? " - " + extra : ""}`);
}

async function main(): Promise<void> {
  if (!RPC || !KEY) throw new Error("Set SEPOLIA_RPC_URL and PRIVATE_KEY");

  // Node SDK (node() relayer) built inside @cwr/sdk to keep one SDK instance.
  const client = createNodeZamaClient({ chainId: SEPOLIA_ID, rpcUrl: RPC, privateKey: KEY });
  if (LENS) CHAINS[SEPOLIA_ID].lens = LENS;

  console.log(`\nAccount: ${client.account}\n`);

  // 1) Read the REAL registry
  const direct = await fetchPairsDirect(client.publicClient, SEPOLIA_ID);
  log("Read official registry (direct)", direct.length >= 8, `${direct.length} pairs`);
  const hasUsdc = direct.some((p) => p.wrapper.toLowerCase() === WRAPPER.toLowerCase());
  log("cUSDCMock present in registry", hasUsdc);

  // 1b) Lens one-call read must match the direct read
  if (LENS) {
    const viaLens = await fetchPairs(client.publicClient, SEPOLIA_ID);
    log("Lens read matches direct", viaLens.length === direct.length, `${viaLens.length} pairs`);
  }

  // 2) Faucet the REAL underlying mock
  await faucetMint(client, { underlying: UNDERLYING, underlyingDecimals: DECIMALS, wholeTokens: 1000n });
  log("Faucet mint 1000 cUSDC underlying", true);

  // 3) Wrap into the REAL official wrapper
  const amount = 100n * 10n ** BigInt(DECIMALS);
  const preview = await previewWrap(client, WRAPPER, amount);
  await wrap(client, { wrapper: WRAPPER, underlying: UNDERLYING, amount });
  log("Wrap 100 cUSDC", true, `rate=${preview.rate} refund=${preview.refund}`);

  // 4) Decrypt balance via EIP-712 through the REAL relayer (the headline)
  const bal1 = await decryptBalance(client, WRAPPER);
  log("Decrypt confidential balance (EIP-712)", bal1 >= amount, `${formatUnits(bal1, DECIMALS)} c-units`);

  // 5) Unwrap (two-step unshield) through the REAL relayer
  const unwrapAmt = 40n * 10n ** BigInt(DECIMALS);
  await unwrap(client, { wrapper: WRAPPER, amount: unwrapAmt });
  log("Unwrap 40 (two-step finalize)", true);

  const bal2 = await decryptBalance(client, WRAPPER);
  log("Balance decreased after unwrap", bal2 === bal1 - unwrapAmt, `${formatUnits(bal2, DECIMALS)} c-units`);

  console.log("\nDone. All steps ran against the official Sepolia contracts.\n");
  client.sdk.terminate();
}

main().catch((e) => {
  console.error("FAILED:", e);
  process.exit(1);
});
