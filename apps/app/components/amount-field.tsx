"use client";
import { Input } from "@/components/ui/input";
import { TokenIcon } from "./token-icon";
import { cn } from "@/lib/utils";

export function AmountField({
  symbol,
  address,
  value,
  onChange,
  placeholder = "0.0",
  error,
}: {
  symbol: string;
  address: `0x${string}`;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string | null;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
          <TokenIcon symbol={symbol} address={address} size={20} />
        </span>
        <Input
          className={cn("h-11 pl-10", error && "border-destructive focus-visible:ring-destructive/40")}
          inputMode="decimal"
          placeholder={placeholder}
          value={value}
          aria-invalid={!!error}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
