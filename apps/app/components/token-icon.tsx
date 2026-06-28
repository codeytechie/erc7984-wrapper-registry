"use client";
import { useState } from "react";
import { getAddress } from "viem";

// strip leading c + trailing Mock: cUSDCMock -> USDC
const norm = (s: string) => s.replace(/^c/, "").replace(/Mock$/, "");

function localSrc(symbol: string): string {
  const n = norm(symbol);
  return n === "ZAMA" ? "/tokens/ZAMA.svg" : `/tokens/${n}.png`;
}

function trustSrc(address: string): string | null {
  try {
    return `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${getAddress(address)}/logo.png`;
  } catch {
    return null;
  }
}

function LetterAvatar({ symbol, size }: { symbol: string; size: number }) {
  const letters = norm(symbol).slice(0, 2).toUpperCase() || "?";
  return (
    <span
      style={{ width: size, height: size }}
      className="inline-flex items-center justify-center rounded-full bg-primary/20 text-[10px] font-semibold text-foreground"
    >
      {letters}
    </span>
  );
}

export function TokenIcon({ symbol, address, size = 22 }: { symbol: string; address: `0x${string}`; size?: number }) {
  const tiers = [localSrc(symbol), trustSrc(address)].filter((s): s is string => !!s);
  const [tier, setTier] = useState(0);
  const src = tiers[tier];

  if (!src) return <LetterAvatar symbol={symbol} size={size} />;
  return (
    // local first, then TrustWallet, then letter avatar via onError
    <img
      src={src}
      alt={symbol}
      width={size}
      height={size}
      className="rounded-full"
      onError={() => setTier((t) => t + 1)}
    />
  );
}
