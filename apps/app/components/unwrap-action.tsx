"use client";
import { useCallback, useEffect, useState } from "react";
import { getPendingUnwrap, resumeUnwrap, unwrap, type PairView, type ZamaClient } from "@cwr/sdk";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AmountField } from "./amount-field";
import { symbolOf } from "@/lib/token";
import { useAsyncAction } from "@/hooks/use-async-action";
import { amountSchema, parseField } from "@/lib/schemas";

export function UnwrapAction({ client, pair, onDone }: { client: ZamaClient; pair: PairView; onDone?: () => void }) {
  const [amount, setAmount] = useState("");
  const [pending, setPending] = useState<`0x${string}` | null>(null);
  const sym = symbolOf(pair);
  const { value: base, error } = parseField(amountSchema(pair.wrapperDecimals), amount);
  const unwrapAction = useAsyncAction((amt: bigint) => unwrap(client, { wrapper: pair.wrapper, amount: amt }));
  const resumeAction = useAsyncAction(() => resumeUnwrap(client, pair.wrapper));

  const refreshPending = useCallback(() => {
    getPendingUnwrap(client, pair.wrapper)
      .then(setPending)
      .catch(() => setPending(null));
  }, [client, pair.wrapper]);

  // detect an unfinished unwrap for this wrapper
  useEffect(() => {
    refreshPending();
  }, [refreshPending]);

  return (
    <div className="flex flex-col gap-3">
      <AmountField symbol={sym} address={pair.underlying} value={amount} onChange={setAmount} error={error} />
      {pending && (
        <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/40 p-3">
          <p className="text-xs text-muted-foreground">
            You have an unwrap waiting to be finalized. Resume it before starting a new one.
          </p>
          <Button
            variant="outline"
            className="h-11 w-full"
            disabled={resumeAction.isPending}
            onClick={async () => {
              const r = await resumeAction.run();
              if (r) {
                toast.success("Resumed pending unwrap");
                setPending(null);
                onDone?.();
              } else {
                toast.message("No pending unwrap");
                refreshPending();
              }
            }}
          >
            {resumeAction.isPending ? "Resuming…" : "Resume pending unwrap"}
          </Button>
        </div>
      )}
      <Button
        className="h-11 w-full"
        disabled={unwrapAction.isPending || base == null}
        onClick={async () => {
          if (base == null) return;
          const r = await unwrapAction.run(base);
          if (r) {
            toast.success("Unwrapped to ERC-20");
            setAmount("");
            onDone?.();
          }
          refreshPending();
        }}
      >
        {unwrapAction.isPending ? "Unwrapping…" : `Unwrap ${sym}`}
      </Button>
    </div>
  );
}
