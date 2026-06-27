// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title ERC20Mock
 * @notice Faithful local copy of Zama's Sepolia faucet token. The on-chain
 *         `mint(address,uint256)` is PERMISSIONLESS (anyone can call), capped at
 *         `MAX_MINT_AMOUNT_TOKENS` whole tokens per call, with NO cooldown.
 *         Decimals are configurable so we can exercise both the 6-dec and 18-dec
 *         rounding paths of the wrapper.
 */
contract ERC20Mock is ERC20 {
    uint256 public constant MAX_MINT_AMOUNT_TOKENS = 1_000_000;

    uint8 private immutable _decimals;

    error MintAmountExceedsMax(uint256 amount, uint256 maxMintAmount);

    constructor(string memory name_, string memory symbol_, uint8 decimals_) ERC20(name_, symbol_) {
        _decimals = decimals_;
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    /// @notice Permissionless faucet mint, capped per call. Mirrors the deployed mock.
    function mint(address to, uint256 amount) external {
        uint256 maxMintAmount = MAX_MINT_AMOUNT_TOKENS * 10 ** decimals();
        if (amount > maxMintAmount) {
            revert MintAmountExceedsMax(amount, maxMintAmount);
        }
        _mint(to, amount);
    }
}
