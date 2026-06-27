// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {
    IConfidentialTokenWrappersRegistry as IRegistry,
    TokenWrapperPair
} from "./interfaces/IConfidentialTokenWrappersRegistry.sol";
import {IConfidentialWrapper} from "./interfaces/IConfidentialWrapper.sol";
import {IERC20Metadata} from "./interfaces/IERC20Metadata.sol";

/**
 * @title WrapperRegistryLens
 * @notice Stateless view-aggregator over a ConfidentialTokenWrappersRegistry.
 *
 * The registry stores only addresses + a validity flag. Rendering a usable table
 * needs, per pair: underlying symbol/name/decimals, wrapper rate/decimals,
 * inferred total supply, and an ERC-165 sanity check. Done client-side that is
 * N+1 RPC round-trips and UI flicker. This Lens collapses a whole page into ONE
 * `eth_call`.
 *
 * Design notes:
 *  - Holds no funds, no FHE, no upgrade surface — pure view aggregation.
 *  - The registry address is a parameter, so the SAME deployed Lens works on any
 *    chain (Sepolia, mainnet, your own registry instance).
 *  - Every external call is wrapped in try/catch so one misbehaving token can
 *    never brick a whole page.
 */
contract WrapperRegistryLens {
    /// @dev IERC7984 interface id.
    bytes4 internal constant IERC7984_ID = 0x4958f2a4;

    struct PairView {
        address underlying;
        address wrapper;
        bool isValid; // straight from the registry — honors revocation
        string underlyingSymbol;
        string underlyingName;
        uint8 underlyingDecimals;
        uint8 wrapperDecimals;
        uint256 rate;
        uint256 inferredTotalSupply; // ~ total value shielded
        bool supportsERC7984; // ERC-165 sanity check
    }

    /// @notice Total number of pairs (valid + revoked) in the registry.
    function length(IRegistry registry) external view returns (uint256) {
        return registry.getTokenConfidentialTokenPairsLength();
    }

    /**
     * @notice Single-call, fully-hydrated snapshot of a page of the registry.
     * @dev `toIndex` is clamped to the registry length, so a client can safely
     *      pass `(0, type(uint256).max)` to fetch everything without first
     *      reading the length or hitting the registry's bounds revert.
     */
    function getPairs(
        IRegistry registry,
        uint256 fromIndex,
        uint256 toIndex
    ) external view returns (PairView[] memory out) {
        uint256 len = registry.getTokenConfidentialTokenPairsLength();
        if (toIndex > len) toIndex = len;
        if (fromIndex >= toIndex) return new PairView[](0);

        TokenWrapperPair[] memory pairs = registry.getTokenConfidentialTokenPairsSlice(fromIndex, toIndex);
        out = new PairView[](pairs.length);
        for (uint256 i; i < pairs.length; ++i) {
            out[i] = _hydrate(pairs[i]);
        }
    }

    /// @notice Convenience: hydrate the entire registry in one call.
    function getAllPairs(IRegistry registry) external view returns (PairView[] memory out) {
        uint256 len = registry.getTokenConfidentialTokenPairsLength();
        if (len == 0) return new PairView[](0);
        TokenWrapperPair[] memory pairs = registry.getTokenConfidentialTokenPairsSlice(0, len);
        out = new PairView[](pairs.length);
        for (uint256 i; i < pairs.length; ++i) {
            out[i] = _hydrate(pairs[i]);
        }
    }

    function _hydrate(TokenWrapperPair memory p) internal view returns (PairView memory v) {
        v.underlying = p.tokenAddress;
        v.wrapper = p.confidentialTokenAddress;
        v.isValid = p.isValid;

        // try/catch only catches *reverts* — it does NOT catch the "unexpected
        // return data" decode error that a call to a code-less address produces
        // (a code-less call succeeds with empty returndata). So we guard on
        // extcodesize first, then let try/catch handle contracts that revert.
        if (p.tokenAddress.code.length > 0) {
            try IERC20Metadata(p.tokenAddress).symbol() returns (string memory s) {
                v.underlyingSymbol = s;
            } catch {}
            try IERC20Metadata(p.tokenAddress).name() returns (string memory n) {
                v.underlyingName = n;
            } catch {}
            try IERC20Metadata(p.tokenAddress).decimals() returns (uint8 d) {
                v.underlyingDecimals = d;
            } catch {}
        }

        if (p.confidentialTokenAddress.code.length > 0) {
            try IConfidentialWrapper(p.confidentialTokenAddress).decimals() returns (uint8 d) {
                v.wrapperDecimals = d;
            } catch {}
            try IConfidentialWrapper(p.confidentialTokenAddress).rate() returns (uint256 r) {
                v.rate = r;
            } catch {}
            try IConfidentialWrapper(p.confidentialTokenAddress).inferredTotalSupply() returns (uint256 t) {
                v.inferredTotalSupply = t;
            } catch {}
            try IConfidentialWrapper(p.confidentialTokenAddress).supportsInterface(IERC7984_ID) returns (bool ok) {
                v.supportsERC7984 = ok;
            } catch {}
        }
    }
}
