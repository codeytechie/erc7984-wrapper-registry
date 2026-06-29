import { formatUnits } from "viem";

export function usdValue(base: bigint, decimals: number, price?: number): number | null {
  if (price == null) return null;
  return Number(formatUnits(base, decimals)) * price;
}

export function fmtUsd(v: number): string {
  return v.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
}
