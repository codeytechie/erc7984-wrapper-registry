// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

/**
 * @title IConfidentialWrapper
 * @notice The NON-confidential view surface of an ERC-7984 ConfidentialWrapper
 *         that the Lens reads to hydrate a pair. FHE-typed functions (balances,
 *         wrap/unwrap) are intentionally excluded — the Lens never touches
 *         encrypted values, it only aggregates public metadata.
 */
interface IConfidentialWrapper {
    /// @notice Wrapper decimals — capped at 6 by the protocol.
    function decimals() external view returns (uint8);

    /// @notice 10**(underlyingDecimals - wrapperDecimals); 1 when underlying <= 6 dec.
    function rate() external view returns (uint256);

    /// @notice underlyingBalance / rate — an upper bound on total value shielded.
    function inferredTotalSupply() external view returns (uint256);

    /// @notice The wrapped ERC-20.
    function underlying() external view returns (address);

    /// @notice ERC-165; IERC7984 interface id is 0x4958f2a4.
    function supportsInterface(bytes4 interfaceId) external view returns (bool);
}
