"use client";
import { decryptBalance, type ZamaClient } from "@cwr/sdk";
import { Button } from "@/components/ui/button";
import { fmt } from "@/lib/format";
import { fmtUsd, usdValue } from "@/lib/usd";
import { useAsyncAction } from "@/hooks/use-async-action";

export function ConfidentialBalanceCell({
  client,
  wrapper,
  decimals,
  rate,
  underlyingDecimals,
  price,
  value,
  failed,
  onRevealed,
}: {
  client: ZamaClient | null;
  wrapper: `0x${string}`;
  decimals: number;
  rate: bigint;
  underlyingDecimals: number;
  price?: number;
  value?: bigint;
  failed?: string;
  onRevealed: (v: bigint) => void;
}) {
  const { run, isPending } = useAsyncAction(() => decryptBalance(client!, wrapper));

  if (value != null) {
    const dollars = usdValue(value * rate, underlyingDecimals, price);
    return (
      <span className="font-mono">
        {fmt(value, decimals)}
        {dollars != null && <span className="ml-1 text-xs text-muted-foreground">{fmtUsd(dollars)}</span>}
      </span>
    );
  }
  if (!client) return <span className="font-mono text-muted-foreground">****</span>;

  return (
    <span className="flex items-center gap-2">
      <span className="font-mono text-muted-foreground">****</span>
      <Button
        size="sm"
        variant="outline"
        disabled={isPending}
        onClick={async () => {
          const b = await run();
          if (b != null) onRevealed(b);
        }}
      >
        {isPending ? "…" : failed ? "Retry" : "Reveal"}
      </Button>
    </span>
  );
}
