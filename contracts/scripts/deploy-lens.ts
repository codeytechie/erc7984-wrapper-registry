import { ethers, network, run } from "hardhat";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

import { REGISTRY, type ChainId } from "../config/addresses";

const DEPLOYMENTS_PATH = join(__dirname, "..", "deployments.json");

interface DeploymentRecord {
  lens?: string;
  registry?: string;
  deployedBlock?: number;
  deployedAt?: string;
}

type Deployments = Record<string, DeploymentRecord>;

function loadDeployments(): Deployments {
  if (!existsSync(DEPLOYMENTS_PATH)) return {};
  return JSON.parse(readFileSync(DEPLOYMENTS_PATH, "utf8")) as Deployments;
}

async function main() {
  const { chainId } = network.config;
  if (!chainId) throw new Error("network.config.chainId is undefined");

  const [deployer] = await ethers.getSigners();
  console.log(`Deploying WrapperRegistryLens to ${network.name} (chainId ${chainId})`);
  console.log(`Deployer: ${deployer.address}`);

  const factory = await ethers.getContractFactory("WrapperRegistryLens");
  const lens = await factory.deploy();
  await lens.waitForDeployment();
  const lensAddr = await lens.getAddress();
  const receipt = await lens.deploymentTransaction()?.wait();
  console.log(`WrapperRegistryLens deployed at: ${lensAddr}`);

  // Sanity check: hit the live registry through the freshly-deployed Lens.
  const registry = REGISTRY[chainId as ChainId];
  if (registry) {
    try {
      const len = await lens.length(registry);
      console.log(`Lens reads registry ${registry}: ${len} pairs`);
    } catch (e) {
      console.warn(`Could not read registry through Lens (ok on local nets): ${(e as Error).message}`);
    }
  }

  const deployments = loadDeployments();
  deployments[String(chainId)] = {
    ...deployments[String(chainId)], // preserve registry / relayerUrl
    lens: lensAddr,
    registry: registry ?? deployments[String(chainId)]?.registry,
    deployedBlock: receipt?.blockNumber,
    deployedAt: new Date().toISOString(),
  };
  writeFileSync(DEPLOYMENTS_PATH, JSON.stringify(deployments, null, 2) + "\n");
  console.log(`Wrote ${DEPLOYMENTS_PATH}`);

  // Best-effort Etherscan verification on public networks.
  if (chainId === 1 || chainId === 11155111) {
    console.log("Waiting for confirmations before verification...");
    await lens.deploymentTransaction()?.wait(5);
    try {
      await run("verify:verify", { address: lensAddr, constructorArguments: [] });
      console.log("Verified on Etherscan");
    } catch (e) {
      console.warn(`Verification skipped/failed: ${(e as Error).message}`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
