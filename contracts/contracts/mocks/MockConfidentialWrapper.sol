// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {ERC7984ERC20Wrapper} from "@openzeppelin/confidential-contracts/token/ERC7984/extensions/ERC7984ERC20Wrapper.sol";
import {ERC7984} from "@openzeppelin/confidential-contracts/token/ERC7984/ERC7984.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";

/**
 * @title MockConfidentialWrapper
 * @notice A concrete, non-upgradeable ERC-7984 wrapper for the local test
 *         harness. It extends OpenZeppelin's `ERC7984ERC20Wrapper` — the SAME
 *         code the official protocol-apps `ConfidentialWrapper` is built on — so
 *         the two-step `wrap -> unwrap -> finalizeUnwrap` flow exercised here is
 *         the identical mechanic the production wrappers (and our frontend) use.
 *
 *         We skip the official wrapper's UUPS/denylist/ERC-1363 ceremony on
 *         purpose: those are orthogonal to the wrap/unwrap correctness we test.
 *         `ZamaEthereumConfig` wires the FHEVM coprocessor/ACL/KMS by chainid,
 *         resolving to the Hardhat mock host contracts on chain 31337.
 */
contract MockConfidentialWrapper is ERC7984ERC20Wrapper, ZamaEthereumConfig {
    constructor(
        IERC20 underlying_,
        string memory name_,
        string memory symbol_,
        string memory uri_
    ) ERC7984ERC20Wrapper(underlying_) ERC7984(name_, symbol_, uri_) {}
}
