"use client";
import { useState } from "react";
import { approveAndWrap, previewWrap, type PairView, type ZamaClient } from "@cwr/sdk";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AmountField } from "./amount-field";
import { Spinner } from "./spinner";
import { symbolOf } from "@/lib/token";
import { useAsyncAction } from "@/hooks/use-async-action";
import { fmt } from "@/lib/format";
import { amountSchema, parseField } from "@/lib/schemas";

export function WrapAction({ client, pair, onDone }: { client: ZamaClient; pair: PairView; onDone?: () => void }) {
  const [amount, setAmount] = useState("");
  const sym = symbolOf(pair);
  const { value: base, error } = parseField(amountSchema(pair.underlyingDecimals), amount);
  const estimate = base != null && pair.rate > 0n ? base / pair.rate : null;

  const { run, isPending } = useAsyncAction(async (amt: bigint) => {
    const preview = await previewWrap(client, pair.wrapper, amt);
    await approveAndWrap(client, { wrapper: pair.wrapper, underlying: pair.underlying, amount: amt });
    return preview;
  });

  return (
    <div className="flex flex-col gap-3">
      <AmountField symbol={sym} address={pair.underlying} value={amount} onChange={setAmount} error={error} />
      {estimate != null && (
        <p className="text-xs text-muted-foreground">
          You receive ≈ {estimate.toString()} {sym}
        </p>
      )}
      <Button
        className="h-11 w-full"
        disabled={isPending || base == null}
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
        {isPending ? (
          <>
            <Spinner />
            Wrapping
          </>
        ) : (
          `Wrap ${sym}`
        )}
      </Button>
    </div>
  );
}
