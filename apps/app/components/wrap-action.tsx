"use client";
import { useState } from "react";
import { approveAndWrap, previewWrap, type PairView, type ZamaClient } from "@cwr/sdk";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAsyncAction } from "@/hooks/use-async-action";
import { fmt, parseAmount } from "@/lib/format";

export function WrapAction({
  client,
  pair,
  onDone,
}: {
  client: ZamaClient;
  pair: PairView;
  onDone?: () => void;
}) {
  const [amount, setAmount] = useState("");
  const base = parseAmount(amount, pair.underlyingDecimals);
  const estimate = base != null && pair.rate > 0n ? base / pair.rate : null;

  const { run, isPending } = useAsyncAction(async (amt: bigint) => {
    const preview = await previewWrap(client, pair.wrapper, amt);
    await approveAndWrap(client, { wrapper: pair.wrapper, underlying: pair.underlying, amount: amt });
    return preview;
  });

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Input
          placeholder="amount"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <Button
          disabled={isPending || base == null || base === 0n}
          onClick={async () => {
            if (base == null) return;
            const r = await run(base);
            if (r) {
              toast.success(`Wrapped (refund ${fmt(r.refund, pair.underlyingDecimals)})`);
              setAmount("");
              onDone?.();
            }
          }}
        >
          {isPending ? "Wrapping…" : "Wrap"}
        </Button>
      </div>
      {estimate != null && <p className="text-xs text-muted-foreground">≈ {estimate.toString()} confidential units</p>}
    </div>
  );
}
