import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";
import type { Signer } from "ethers";

import type { ERC20Mock, MockConfidentialWrapper } from "../types";

const URI = "https://example.org/meta";

async function deployToken(name: string, symbol: string, decimals: number): Promise<ERC20Mock> {
  const t = (await (await ethers.getContractFactory("ERC20Mock")).deploy(name, symbol, decimals)) as unknown as ERC20Mock;
  await t.waitForDeployment();
  return t;
}

async function deployWrapper(underlying: string, symbol: string): Promise<MockConfidentialWrapper> {
  const w = (await (await ethers.getContractFactory("MockConfidentialWrapper")).deploy(
    underlying,
    `Confidential ${symbol}`,
    `c${symbol}`,
    URI,
  )) as unknown as MockConfidentialWrapper;
  await w.waitForDeployment();
  return w;
}

/** Decrypt a holder's confidential balance via the mock user-decryption path. */
async function balance(wrapper: MockConfidentialWrapper, holder: Signer): Promise<bigint> {
  const handle = await wrapper.confidentialBalanceOf(await holder.getAddress());
  return fhevm.userDecryptEuint(FhevmType.euint64, handle, await wrapper.getAddress(), holder);
}

describe("ConfidentialWrapper flow (real FHE under the Hardhat mock runtime)", () => {
  let holder: Signer;
  let other: Signer;
  let holderAddr: string;
  let otherAddr: string;

  before(async () => {
    const signers = await ethers.getSigners();
    holder = signers[1];
    other = signers[2];
    holderAddr = await holder.getAddress();
    otherAddr = await other.getAddress();
  });

  describe("Faucet (ERC20Mock.mint)", () => {
    it("mints for an arbitrary caller and rejects above the per-call cap", async () => {
      const usdc = await deployToken("USD Coin Mock", "USDCMock", 6);
      const cap = 1_000_000n * 10n ** 6n;

      await expect(usdc.connect(other).mint(otherAddr, cap)).to.not.be.reverted; // permissionless
      expect(await usdc.balanceOf(otherAddr)).to.equal(cap);

      await expect(usdc.connect(other).mint(otherAddr, cap + 1n)).to.be.revertedWithCustomError(
        usdc,
        "MintAmountExceedsMax",
      );
    });
  });

  describe("Wrap (rate / rounding / refund)", () => {
    it("wraps 1:1 for a 6-decimal underlying (rate = 1)", async () => {
      const usdc = await deployToken("USD Coin Mock", "USDCMock", 6);
      const cUsdc = await deployWrapper(await usdc.getAddress(), "USDCMock");
      const amount = 1_000_000n; // 1 USDC

      await (await usdc.connect(holder).mint(holderAddr, amount)).wait();
      await (await usdc.connect(holder).approve(await cUsdc.getAddress(), amount)).wait();
      await (await cUsdc.connect(holder).wrap(holderAddr, amount)).wait();

      expect(await balance(cUsdc, holder)).to.equal(amount); // rate 1 -> same units
      expect(await usdc.balanceOf(await cUsdc.getAddress())).to.equal(amount);
    });

    it("rounds DOWN to a multiple of rate and leaves the remainder with the user (18-dec, rate 1e12)", async () => {
      const weth = await deployToken("Wrapped Ether Mock", "WETHMock", 18);
      const cWeth = await deployWrapper(await weth.getAddress(), "WETHMock");
      const rate = 10n ** 12n;
      const amount = rate + rate / 2n; // 1.5 * rate -> wraps to 1, half-rate remainder stays

      await (await weth.connect(holder).mint(holderAddr, amount)).wait();
      await (await weth.connect(holder).approve(await cWeth.getAddress(), amount)).wait();
      await (await cWeth.connect(holder).wrap(holderAddr, amount)).wait();

      expect(await balance(cWeth, holder)).to.equal(1n); // amount / rate, rounded down
      expect(await weth.balanceOf(await cWeth.getAddress())).to.equal(rate); // only rounded amount pulled
      expect(await weth.balanceOf(holderAddr)).to.equal(amount - rate); // remainder retained
    });

    it("wraps sub-rate amounts to zero", async () => {
      const weth = await deployToken("Wrapped Ether Mock", "WETHMock", 18);
      const cWeth = await deployWrapper(await weth.getAddress(), "WETHMock");
      const rate = 10n ** 12n;
      const amount = rate / 2n; // below one whole wrapped unit

      await (await weth.connect(holder).mint(holderAddr, amount)).wait();
      await (await weth.connect(holder).approve(await cWeth.getAddress(), amount)).wait();
      await (await cWeth.connect(holder).wrap(holderAddr, amount)).wait();

      expect(await balance(cWeth, holder)).to.equal(0n);
      expect(await weth.balanceOf(await cWeth.getAddress())).to.equal(0n);
      expect(await weth.balanceOf(holderAddr)).to.equal(amount); // nothing pulled
    });
  });

  describe("Unwrap (two-step async: unwrap -> publicDecrypt -> finalizeUnwrap)", () => {
    let usdc: ERC20Mock;
    let cUsdc: MockConfidentialWrapper;
    const wrapped = 1_000_000n;
    const unwrapAmount = 400_000n;

    beforeEach(async () => {
      usdc = await deployToken("USD Coin Mock", "USDCMock", 6);
      cUsdc = await deployWrapper(await usdc.getAddress(), "USDCMock");
      await (await usdc.connect(holder).mint(holderAddr, wrapped)).wait();
      await (await usdc.connect(holder).approve(await cUsdc.getAddress(), wrapped)).wait();
      await (await cUsdc.connect(holder).wrap(holderAddr, wrapped)).wait();
    });

    it("completes the full two-step unwrap and releases the underlying", async () => {
      const before = await usdc.balanceOf(holderAddr);

      // Step 1: request unwrap with an encrypted amount + input proof.
      const enc = await fhevm
        .createEncryptedInput(await cUsdc.getAddress(), holderAddr)
        .add64(unwrapAmount)
        .encrypt();
      await (
        await cUsdc
          .connect(holder)
          ["unwrap(address,address,bytes32,bytes)"](holderAddr, holderAddr, enc.handles[0], enc.inputProof)
      ).wait();

      const ev = (await cUsdc.queryFilter(cUsdc.filters.UnwrapRequested()))[0];
      const unwrapRequestId = ev.args[1];
      const amountHandle = ev.args[2];

      // Pending request is recorded on-chain.
      expect(await cUsdc.unwrapRequester(unwrapRequestId)).to.equal(holderAddr);

      // Step 2: public-decrypt the burned amount, then finalize with the proof.
      const cleartext = await fhevm.publicDecryptEuint(FhevmType.euint64, amountHandle);
      expect(cleartext).to.equal(unwrapAmount);
      const { decryptionProof } = await fhevm.publicDecrypt([amountHandle]);
      await (await cUsdc.connect(holder).finalizeUnwrap(unwrapRequestId, cleartext, decryptionProof)).wait();

      // Request cleared, underlying released, confidential balance reduced.
      expect(await cUsdc.unwrapRequester(unwrapRequestId)).to.equal(ethers.ZeroAddress);
      expect(await usdc.balanceOf(holderAddr)).to.equal(before + unwrapAmount);
      expect(await balance(cUsdc, holder)).to.equal(wrapped - unwrapAmount);
    });

    it("is resumable: a pending request can be finalized after a simulated client crash", async () => {
      const enc = await fhevm
        .createEncryptedInput(await cUsdc.getAddress(), holderAddr)
        .add64(unwrapAmount)
        .encrypt();
      await (
        await cUsdc
          .connect(holder)
          ["unwrap(address,address,bytes32,bytes)"](holderAddr, holderAddr, enc.handles[0], enc.inputProof)
      ).wait();

      // Simulate a crash: we kept NO local state. Recover purely from chain.
      const ev = (await cUsdc.queryFilter(cUsdc.filters.UnwrapRequested()))[0];
      const unwrapRequestId = ev.args[1];
      const amountHandle = ev.args[2];
      expect(await cUsdc.unwrapRequester(unwrapRequestId)).to.equal(holderAddr); // still pending

      const cleartext = await fhevm.publicDecryptEuint(FhevmType.euint64, amountHandle);
      const { decryptionProof } = await fhevm.publicDecrypt([amountHandle]);
      await (await cUsdc.connect(holder).finalizeUnwrap(unwrapRequestId, cleartext, decryptionProof)).wait();
      expect(await cUsdc.unwrapRequester(unwrapRequestId)).to.equal(ethers.ZeroAddress);
    });

    it("reverts finalizeUnwrap for an unknown request id", async () => {
      await expect(cUsdc.connect(holder).finalizeUnwrap(ethers.ZeroHash, 0, "0x")).to.be.revertedWithCustomError(
        cUsdc,
        "InvalidUnwrapRequest",
      );
    });
  });

  describe("Access control", () => {
    let usdc: ERC20Mock;
    let cUsdc: MockConfidentialWrapper;

    before(async () => {
      usdc = await deployToken("USD Coin Mock", "USDCMock", 6);
      cUsdc = await deployWrapper(await usdc.getAddress(), "USDCMock");
      await (await usdc.connect(holder).mint(holderAddr, 1_000_000n)).wait();
      await (await usdc.connect(holder).approve(await cUsdc.getAddress(), 1_000_000n)).wait();
      await (await cUsdc.connect(holder).wrap(holderAddr, 1_000_000n)).wait();
    });

    it("rejects unwrap of a handle the caller has no ACL permission on", async () => {
      const handle = await cUsdc.confidentialBalanceOf(holderAddr); // public handle, readable by anyone
      await expect(
        cUsdc.connect(other)["unwrap(address,address,bytes32)"](holderAddr, otherAddr, handle),
      ).to.be.revertedWithCustomError(cUsdc, "ERC7984UnauthorizedUseOfEncryptedAmount");
    });

    it("rejects unwrap to the zero address", async () => {
      const handle = await cUsdc.confidentialBalanceOf(holderAddr);
      await expect(
        cUsdc.connect(holder)["unwrap(address,address,bytes32)"](holderAddr, ethers.ZeroAddress, handle),
      ).to.be.revertedWithCustomError(cUsdc, "ERC7984InvalidReceiver");
    });
  });
});
