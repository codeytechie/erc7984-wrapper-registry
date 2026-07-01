"use client";
import { Input } from "@/components/ui/input";
import { TokenIcon } from "./token-icon";

export function AmountField({
  symbol,
  address,
  value,
  onChange,
  placeholder = "0.0",
}: {
  symbol: string;
  address: `0x${string}`;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
        <TokenIcon symbol={symbol} address={address} size={20} />
      </span>
      <Input
        className="h-11 pl-10"
        inputMode="decimal"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
