import { formatUnits } from "viem";

export function fmt(value: bigint, decimals: number, maxFrac = 4): string {
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
