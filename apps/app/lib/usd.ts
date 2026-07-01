import { formatUnits } from "viem";
import { compactNum } from "./format";

export function usdValue(base: bigint, decimals: number, price?: number): number | null {
  if (price == null) return null;
  return Number(formatUnits(base, decimals)) * price;
}

export function fmtUsd(v: number): string {
  if (Math.abs(v) >= 10000) return `$${compactNum(v)}`;
  return v.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
}
