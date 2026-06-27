// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {
    IConfidentialTokenWrappersRegistry,
    TokenWrapperPair
} from "../interfaces/IConfidentialTokenWrappersRegistry.sol";

/**
 * @title MockRegistry
 * @notice Local stand-in for Zama's ConfidentialTokenWrappersRegistry. It
 *         reproduces the exact read semantics the Lens and frontend depend on:
 *           - the slice is [fromIndex, toIndex) and INCLUDES revoked pairs;
 *           - `get*Address` return `(bool isValid, address)` tuples;
 *           - revoked entries keep a non-zero address but flip `isValid=false`.
 *
 *         It also exposes owner-gated `registerPair` / `revokePair` so the
 *         "bring your own pair" extensibility demo can add/revoke a pair and
 *         watch the UI update with no redeploy.
 */
contract MockRegistry is IConfidentialTokenWrappersRegistry, Ownable {
    TokenWrapperPair[] private _pairs;
    mapping(address token => uint256 indexPlus1) private _tokenIndex;
    mapping(address confidentialToken => uint256 indexPlus1) private _confidentialIndex;

    event PairRegistered(address indexed token, address indexed confidentialToken, uint256 index);
    event PairRevoked(address indexed confidentialToken, uint256 index);
    event PairReinstated(address indexed confidentialToken, uint256 index);

    error ZeroAddress();
    error TokenAlreadyRegistered(address token);
    error ConfidentialTokenAlreadyRegistered(address confidentialToken);
    error UnknownConfidentialToken(address confidentialToken);
    error FromIndexGreaterOrEqualToIndex(uint256 fromIndex, uint256 toIndex);
    error ToIndexOutOfBounds(uint256 toIndex, uint256 length);
    error IndexOutOfBounds(uint256 index, uint256 length);

    constructor(address owner_) Ownable(owner_) {}

    // ----------------------------- Write (owner) -----------------------------

    function registerPair(address token, address confidentialToken) external onlyOwner returns (uint256 index) {
        if (token == address(0) || confidentialToken == address(0)) revert ZeroAddress();
        if (_tokenIndex[token] != 0) revert TokenAlreadyRegistered(token);
        if (_confidentialIndex[confidentialToken] != 0) {
            revert ConfidentialTokenAlreadyRegistered(confidentialToken);
        }

        index = _pairs.length;
        _pairs.push(TokenWrapperPair({tokenAddress: token, confidentialTokenAddress: confidentialToken, isValid: true}));
        _tokenIndex[token] = index + 1;
        _confidentialIndex[confidentialToken] = index + 1;

        emit PairRegistered(token, confidentialToken, index);
    }

    function revokePair(address confidentialToken) external onlyOwner {
        uint256 idx = _requireConfidential(confidentialToken);
        _pairs[idx].isValid = false;
        emit PairRevoked(confidentialToken, idx);
    }

    function reinstatePair(address confidentialToken) external onlyOwner {
        uint256 idx = _requireConfidential(confidentialToken);
        _pairs[idx].isValid = true;
        emit PairReinstated(confidentialToken, idx);
    }

    // ------------------------------- Read API --------------------------------

    function getTokenConfidentialTokenPairsLength() external view returns (uint256) {
        return _pairs.length;
    }

    /// @dev [fromIndex, toIndex) — toIndex EXCLUSIVE. Returns revoked pairs too.
    function getTokenConfidentialTokenPairsSlice(
        uint256 fromIndex,
        uint256 toIndex
    ) external view returns (TokenWrapperPair[] memory slice) {
        if (fromIndex >= toIndex) revert FromIndexGreaterOrEqualToIndex(fromIndex, toIndex);
        if (toIndex > _pairs.length) revert ToIndexOutOfBounds(toIndex, _pairs.length);

        slice = new TokenWrapperPair[](toIndex - fromIndex);
        for (uint256 i = fromIndex; i < toIndex; ++i) {
            slice[i - fromIndex] = _pairs[i];
        }
    }

    function getTokenConfidentialTokenPair(uint256 index) external view returns (TokenWrapperPair memory) {
        if (index >= _pairs.length) revert IndexOutOfBounds(index, _pairs.length);
        return _pairs[index];
    }

    function getConfidentialTokenAddress(
        address token
    ) external view returns (bool isValid, address confidentialToken) {
        uint256 idxPlus1 = _tokenIndex[token];
        if (idxPlus1 == 0) return (false, address(0));
        TokenWrapperPair memory p = _pairs[idxPlus1 - 1];
        return (p.isValid, p.confidentialTokenAddress);
    }

    function getTokenAddress(address confidentialToken) external view returns (bool isValid, address token) {
        uint256 idxPlus1 = _confidentialIndex[confidentialToken];
        if (idxPlus1 == 0) return (false, address(0));
        TokenWrapperPair memory p = _pairs[idxPlus1 - 1];
        return (p.isValid, p.tokenAddress);
    }

    function isConfidentialTokenValid(address confidentialToken) external view returns (bool) {
        uint256 idxPlus1 = _confidentialIndex[confidentialToken];
        if (idxPlus1 == 0) return false;
        return _pairs[idxPlus1 - 1].isValid;
    }

    // ------------------------------- Internal --------------------------------

    function _requireConfidential(address confidentialToken) private view returns (uint256 idx) {
        uint256 idxPlus1 = _confidentialIndex[confidentialToken];
        if (idxPlus1 == 0) revert UnknownConfidentialToken(confidentialToken);
        return idxPlus1 - 1;
    }
}
