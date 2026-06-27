// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

/**
 * @dev A registered (ERC-20, ERC-7984 wrapper) pair.
 *
 * NOTE: `isValid` is the canonical, on-chain revocation flag. It is NEVER
 * published off-chain — always read it here. The slice getter below returns
 * revoked pairs too, so consumers must honor this flag themselves.
 */
struct TokenWrapperPair {
    address tokenAddress;
    address confidentialTokenAddress;
    bool isValid;
}

/**
 * @title IConfidentialTokenWrappersRegistry
 * @notice Read surface of Zama's official ConfidentialTokenWrappersRegistry
 *         (a UUPS proxy). Verified verbatim against the deployed source.
 *
 * Gotchas baked into this interface:
 *  - `getConfidentialTokenAddress` / `getTokenAddress` return `(bool, address)`
 *    tuples (found-flag + address), not a bare address.
 *  - `getTokenConfidentialTokenPairsSlice` is `[fromIndex, toIndex)` (toIndex
 *    EXCLUSIVE) and INCLUDES revoked pairs.
 */
interface IConfidentialTokenWrappersRegistry {
    function getTokenConfidentialTokenPairsLength() external view returns (uint256);

    function getTokenConfidentialTokenPairsSlice(
        uint256 fromIndex,
        uint256 toIndex
    ) external view returns (TokenWrapperPair[] memory);

    function getTokenConfidentialTokenPair(uint256 index) external view returns (TokenWrapperPair memory);

    function getConfidentialTokenAddress(address token) external view returns (bool isValid, address confidentialToken);

    function getTokenAddress(address confidentialToken) external view returns (bool isValid, address token);

    function isConfidentialTokenValid(address confidentialToken) external view returns (bool);
}
