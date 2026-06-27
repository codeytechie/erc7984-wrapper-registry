// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

/**
 * @title BrokenToken
 * @notice A contract that reverts on every metadata call. Registered as a pair
 *         underlying to prove the Lens never lets one misbehaving token brick a
 *         whole page — its fields just come back as defaults.
 */
contract BrokenToken {
    error Nope();

    function name() external pure returns (string memory) {
        revert Nope();
    }

    function symbol() external pure returns (string memory) {
        revert Nope();
    }

    function decimals() external pure returns (uint8) {
        revert Nope();
    }
}
