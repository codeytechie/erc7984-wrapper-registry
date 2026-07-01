import { formatUnits } from "viem";

const UNITS: [number, string][] = [
  [1e12, "t"],
  [1e9, "b"],
  [1e6, "m"],
  [1e3, "k"],
];

// 10000 -> "10k", 11140 -> "11.14k", 1_200_000 -> "1.2m"
export function compactNum(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  for (const [v, s] of UNITS) {
    if (abs >= v) return sign + (Math.round((abs / v) * 100) / 100).toString() + s;
  }
  return (Math.round(n * 100) / 100).toString();
}

export function fmt(value: bigint, decimals: number, maxFrac = 4): string {
  const n = Number(formatUnits(value, decimals));
  if (Math.abs(n) >= 10000) return compactNum(n);
  const s = formatUnits(value, decimals);
  if (!s.includes(".")) return s;
  const [whole = "0", frac = ""] = s.split(".");
  const trimmed = frac.slice(0, maxFrac).replace(/0+$/, "");
  return trimmed ? `${whole}.${trimmed}` : whole;
}

export function shortAddr(a: string): string {
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

export function parseAmount(input: string, decimals: number): bigint | null {
  const t = input.trim();
  if (!t || !/^\d*\.?\d*$/.test(t)) return null;
  const [whole = "0", frac = ""] = t.split(".");
  if (frac.length > decimals) return null;
  const padded = frac.padEnd(decimals, "0");
  try {
    return BigInt(whole || "0") * 10n ** BigInt(decimals) + BigInt(padded || "0");
  } catch {
    return null;
  }
}
