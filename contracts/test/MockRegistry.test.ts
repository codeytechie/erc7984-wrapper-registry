import { expect } from "chai";
import { ethers } from "hardhat";
import type { Signer } from "ethers";

import type { MockRegistry, WrapperRegistryLens } from "../types";

// Exercises the registry read/revoke semantics the Lens and frontend rely on,
// plus the Lens's empty-registry path. No FHE needed — pure view/state logic.
describe("MockRegistry semantics + Lens edge cases", () => {
  let owner: Signer;
  let stranger: Signer;
  let registry: MockRegistry;
  let lens: WrapperRegistryLens;
  let registryAddr: string;

  const tokenA = "0x1111111111111111111111111111111111111111";
  const wrapperA = "0x2222222222222222222222222222222222222222";
  const tokenB = "0x3333333333333333333333333333333333333333";
  const wrapperB = "0x4444444444444444444444444444444444444444";

  beforeEach(async () => {
    [owner, stranger] = await ethers.getSigners();
    registry = (await (
      await ethers.getContractFactory("MockRegistry")
    ).deploy(await owner.getAddress())) as unknown as MockRegistry;
    await registry.waitForDeployment();
    registryAddr = await registry.getAddress();
    lens = (await (await ethers.getContractFactory("WrapperRegistryLens")).deploy()) as unknown as WrapperRegistryLens;
    await lens.waitForDeployment();
  });

  describe("Lens against an empty registry", () => {
    it("returns an empty array from getAllPairs and getPairs", async () => {
      expect(await lens.length(registryAddr)).to.equal(0n);
      expect((await lens.getAllPairs(registryAddr)).length).to.equal(0);
      expect((await lens.getPairs(registryAddr, 0, ethers.MaxUint256)).length).to.equal(0);
    });
  });

  describe("registerPair", () => {
    it("only the owner can register", async () => {
      await expect(registry.connect(stranger).registerPair(tokenA, wrapperA)).to.be.revertedWithCustomError(
        registry,
        "OwnableUnauthorizedAccount",
      );
    });

    it("rejects zero addresses", async () => {
      await expect(registry.registerPair(ethers.ZeroAddress, wrapperA)).to.be.revertedWithCustomError(
        registry,
        "ZeroAddress",
      );
      await expect(registry.registerPair(tokenA, ethers.ZeroAddress)).to.be.revertedWithCustomError(
        registry,
        "ZeroAddress",
      );
    });

    it("rejects duplicate underlying or wrapper", async () => {
      await registry.registerPair(tokenA, wrapperA);
      await expect(registry.registerPair(tokenA, wrapperB)).to.be.revertedWithCustomError(
        registry,
        "TokenAlreadyRegistered",
      );
      await expect(registry.registerPair(tokenB, wrapperA)).to.be.revertedWithCustomError(
        registry,
        "ConfidentialTokenAlreadyRegistered",
      );
    });

    it("emits PairRegistered with the index", async () => {
      await expect(registry.registerPair(tokenA, wrapperA)).to.emit(registry, "PairRegistered").withArgs(tokenA, wrapperA, 0);
    });
  });

  describe("tuple getters", () => {
    beforeEach(async () => {
      await registry.registerPair(tokenA, wrapperA);
    });

    it("getConfidentialTokenAddress returns (isValid, address); (false, 0) when unknown", async () => {
      expect(await registry.getConfidentialTokenAddress(tokenA)).to.deep.equal([true, wrapperA]);
      expect(await registry.getConfidentialTokenAddress(tokenB)).to.deep.equal([false, ethers.ZeroAddress]);
    });

    it("getTokenAddress returns (isValid, address); (false, 0) when unknown", async () => {
      expect(await registry.getTokenAddress(wrapperA)).to.deep.equal([true, tokenA]);
      expect(await registry.getTokenAddress(wrapperB)).to.deep.equal([false, ethers.ZeroAddress]);
    });

    it("isConfidentialTokenValid reflects validity and is false for unknown", async () => {
      expect(await registry.isConfidentialTokenValid(wrapperA)).to.equal(true);
      expect(await registry.isConfidentialTokenValid(wrapperB)).to.equal(false);
    });

    it("revoked pair keeps a non-zero address but flips isValid to false", async () => {
      await registry.revokePair(wrapperA);
      expect(await registry.getConfidentialTokenAddress(tokenA)).to.deep.equal([false, wrapperA]);
      expect(await registry.isConfidentialTokenValid(wrapperA)).to.equal(false);
      await registry.reinstatePair(wrapperA);
      expect(await registry.isConfidentialTokenValid(wrapperA)).to.equal(true);
    });
  });

  describe("revoke / reinstate guards", () => {
    it("revoke and reinstate require a known wrapper and the owner", async () => {
      await expect(registry.revokePair(wrapperA)).to.be.revertedWithCustomError(registry, "UnknownConfidentialToken");
      await registry.registerPair(tokenA, wrapperA);
      await expect(registry.connect(stranger).revokePair(wrapperA)).to.be.revertedWithCustomError(
        registry,
        "OwnableUnauthorizedAccount",
      );
    });
  });

  describe("slice / index bounds", () => {
    beforeEach(async () => {
      await registry.registerPair(tokenA, wrapperA);
      await registry.registerPair(tokenB, wrapperB);
    });

    it("getTokenConfidentialTokenPair reverts past the end", async () => {
      const p = await registry.getTokenConfidentialTokenPair(1);
      expect(p.tokenAddress).to.equal(tokenB);
      await expect(registry.getTokenConfidentialTokenPair(2)).to.be.revertedWithCustomError(
        registry,
        "IndexOutOfBounds",
      );
    });

    it("slice reverts on inverted range and out-of-bounds toIndex", async () => {
      await expect(registry.getTokenConfidentialTokenPairsSlice(1, 1)).to.be.revertedWithCustomError(
        registry,
        "FromIndexGreaterOrEqualToIndex",
      );
      await expect(registry.getTokenConfidentialTokenPairsSlice(0, 3)).to.be.revertedWithCustomError(
        registry,
        "ToIndexOutOfBounds",
      );
    });

    it("slice returns the exact [from, to) window", async () => {
      const slice = await registry.getTokenConfidentialTokenPairsSlice(0, 2);
      expect(slice.length).to.equal(2);
      expect(slice[0].tokenAddress).to.equal(tokenA);
      expect(slice[1].confidentialTokenAddress).to.equal(wrapperB);
    });
  });
});
