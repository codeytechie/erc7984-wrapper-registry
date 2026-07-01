"use client";
import { decryptBalance, type ZamaClient } from "@cwr/sdk";
import { Button } from "@/components/ui/button";
import { Spinner } from "./spinner";
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
      <div className="flex flex-col leading-tight">
        <span>{fmt(value, decimals)}</span>
        {dollars != null && <span className="text-xs text-muted-foreground">{fmtUsd(dollars)}</span>}
      </div>
    );
  }
  if (!client) return <span className="text-muted-foreground">****</span>;

  return (
    <span className="flex items-center gap-2">
      <span className="text-muted-foreground">****</span>
      <Button
        size="sm"
        variant="outline"
        disabled={isPending}
        onClick={async () => {
          const b = await run();
          if (b != null) onRevealed(b);
        }}
      >
        {isPending ? <Spinner /> : failed ? "Retry" : "Reveal"}
      </Button>
    </span>
  );
}
