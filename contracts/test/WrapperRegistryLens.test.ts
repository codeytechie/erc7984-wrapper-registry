import { expect } from "chai";
import { ethers } from "hardhat";
import type { Signer } from "ethers";

import type { MockRegistry, WrapperRegistryLens, ERC20Mock, MockConfidentialWrapper } from "../types";

const URI = "https://example.org/meta";

async function deployWrapper(underlying: string, name: string, symbol: string): Promise<MockConfidentialWrapper> {
  const f = await ethers.getContractFactory("MockConfidentialWrapper");
  const w = await f.deploy(underlying, name, symbol, URI);
  await w.waitForDeployment();
  return w as unknown as MockConfidentialWrapper;
}

async function deployToken(name: string, symbol: string, decimals: number): Promise<ERC20Mock> {
  const f = await ethers.getContractFactory("ERC20Mock");
  const t = await f.deploy(name, symbol, decimals);
  await t.waitForDeployment();
  return t as unknown as ERC20Mock;
}

describe("WrapperRegistryLens", () => {
  let owner: Signer;
  let registry: MockRegistry;
  let lens: WrapperRegistryLens;
  let usdc: ERC20Mock; // 6-dec
  let weth: ERC20Mock; // 18-dec
  let cUsdc: MockConfidentialWrapper;
  let cWeth: MockConfidentialWrapper;
  let registryAddr: string;
  let lensAddr: string;

  before(async () => {
    [owner] = await ethers.getSigners();
    const ownerAddr = await owner.getAddress();

    registry = (await (await ethers.getContractFactory("MockRegistry")).deploy(ownerAddr)) as unknown as MockRegistry;
    await registry.waitForDeployment();
    registryAddr = await registry.getAddress();

    lens = (await (await ethers.getContractFactory("WrapperRegistryLens")).deploy()) as unknown as WrapperRegistryLens;
    await lens.waitForDeployment();
    lensAddr = await lens.getAddress();

    usdc = await deployToken("USD Coin Mock", "USDCMock", 6);
    weth = await deployToken("Wrapped Ether Mock", "WETHMock", 18);
    cUsdc = await deployWrapper(await usdc.getAddress(), "Confidential USDC", "cUSDCMock");
    cWeth = await deployWrapper(await weth.getAddress(), "Confidential WETH", "cWETHMock");

    await (await registry.registerPair(await usdc.getAddress(), await cUsdc.getAddress())).wait();
    await (await registry.registerPair(await weth.getAddress(), await cWeth.getAddress())).wait();
  });

  it("length reflects the number of registered pairs", async () => {
    expect(await lens.length(registryAddr)).to.equal(2n);
  });

  it("hydrates every pair with full metadata in one call", async () => {
    const pairs = await lens.getAllPairs(registryAddr);
    expect(pairs.length).to.equal(2);

    const usdcView = pairs[0];
    expect(usdcView.underlying).to.equal(await usdc.getAddress());
    expect(usdcView.wrapper).to.equal(await cUsdc.getAddress());
    expect(usdcView.isValid).to.equal(true);
    expect(usdcView.underlyingSymbol).to.equal("USDCMock");
    expect(usdcView.underlyingName).to.equal("USD Coin Mock");
    expect(usdcView.underlyingDecimals).to.equal(6);
    expect(usdcView.wrapperDecimals).to.equal(6); // capped at 6
    expect(usdcView.rate).to.equal(1n); // 6-dec underlying -> rate 1
    expect(usdcView.supportsERC7984).to.equal(true);
  });

  it("computes rate correctly for an 18-decimal underlying (rate = 1e12)", async () => {
    const pairs = await lens.getAllPairs(registryAddr);
    const wethView = pairs[1];
    expect(wethView.underlyingDecimals).to.equal(18);
    expect(wethView.wrapperDecimals).to.equal(6);
    expect(wethView.rate).to.equal(10n ** 12n);
  });

  it("surfaces revoked pairs with isValid=false, never silently dropping them", async () => {
    await (await registry.revokePair(await cWeth.getAddress())).wait();

    const pairs = await lens.getAllPairs(registryAddr);
    expect(pairs.length).to.equal(2); // still present
    expect(pairs[1].isValid).to.equal(false); // but flagged revoked
    expect(pairs[1].wrapper).to.equal(await cWeth.getAddress()); // non-zero address retained

    // registry tuple getters decode (bool, address) with the revoked flag
    const [isValid, conf] = await registry.getConfidentialTokenAddress(await weth.getAddress());
    expect(isValid).to.equal(false);
    expect(conf).to.equal(await cWeth.getAddress());

    await (await registry.reinstatePair(await cWeth.getAddress())).wait(); // restore for later tests
  });

  it("survives a token that reverts on metadata (try/catch resilience)", async () => {
    const broken = await (await ethers.getContractFactory("BrokenToken")).deploy();
    await broken.waitForDeployment();
    // register broken token as an underlying paired with an existing wrapper
    await (await registry.registerPair(await broken.getAddress(), ethers.Wallet.createRandom().address)).wait();

    const pairs = await lens.getAllPairs(registryAddr);
    const brokenView = pairs[2];
    expect(brokenView.underlying).to.equal(await broken.getAddress());
    expect(brokenView.underlyingSymbol).to.equal(""); // defaulted, no revert bubbled
    expect(brokenView.underlyingName).to.equal("");
    expect(brokenView.underlyingDecimals).to.equal(0);
    expect(brokenView.isValid).to.equal(true); // registry flag still honored
  });

  it("clamps toIndex past the end and returns empty for an inverted range", async () => {
    const len = await lens.length(registryAddr);
    const all = await lens.getPairs(registryAddr, 0, ethers.MaxUint256);
    expect(all.length).to.equal(Number(len)); // clamped, no revert
    const empty = await lens.getPairs(registryAddr, 5, 2);
    expect(empty.length).to.equal(0);
  });

  it("paginates: a sub-slice matches the full snapshot", async () => {
    const page = await lens.getPairs(registryAddr, 1, 2);
    expect(page.length).to.equal(1);
    const all = await lens.getAllPairs(registryAddr);
    expect(page[0].wrapper).to.equal(all[1].wrapper);
  });
});
