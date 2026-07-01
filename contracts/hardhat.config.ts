import "@fhevm/hardhat-plugin";
import "@nomicfoundation/hardhat-chai-matchers";
import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-verify";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";

import type { HardhatUserConfig } from "hardhat/config";
import { vars } from "hardhat/config";

const MNEMONIC = vars.get("MNEMONIC", "test test test test test test test test test test test junk");

const SEPOLIA_RPC_URL = vars.get("SEPOLIA_RPC_URL", process.env.SEPOLIA_RPC_URL ?? "https://ethereum-sepolia-rpc.publicnode.com");
const MAINNET_RPC_URL = vars.get("MAINNET_RPC_URL", process.env.MAINNET_RPC_URL ?? "https://ethereum-rpc.publicnode.com");
const ETHERSCAN_API_KEY = vars.get("ETHERSCAN_API_KEY", process.env.ETHERSCAN_API_KEY ?? "");

const PRIVATE_KEY = process.env.PRIVATE_KEY ?? "";
const liveAccounts = PRIVATE_KEY
  ? [PRIVATE_KEY.startsWith("0x") ? PRIVATE_KEY : `0x${PRIVATE_KEY}`]
  : { mnemonic: MNEMONIC, path: "m/44'/60'/0'/0/", count: 10 };

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  solidity: {
    version: "0.8.27",
    settings: {
      metadata: { bytecodeHash: "none" },
      optimizer: { enabled: true, runs: 800 },
      evmVersion: "cancun",
    },
  },
  networks: {
    hardhat: {
      accounts: { mnemonic: MNEMONIC },
      chainId: 31337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    sepolia: {
      accounts: liveAccounts,
      chainId: 11155111,
      url: SEPOLIA_RPC_URL,
    },
    mainnet: {
      accounts: liveAccounts,
      chainId: 1,
      url: MAINNET_RPC_URL,
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS ? true : false,
    currency: "USD",
  },
  typechain: {
    outDir: "types",
    target: "ethers-v6",
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

export default config;
