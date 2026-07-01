"use client";
import { useState } from "react";
import { resumeUnwrap, unwrap, type PairView, type ZamaClient } from "@cwr/sdk";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AmountField } from "./amount-field";
import { symbolOf } from "@/lib/token";
import { useAsyncAction } from "@/hooks/use-async-action";
import { parseAmount } from "@/lib/format";

export function UnwrapAction({ client, pair, onDone }: { client: ZamaClient; pair: PairView; onDone?: () => void }) {
  const [amount, setAmount] = useState("");
  const sym = symbolOf(pair);
  const base = parseAmount(amount, pair.wrapperDecimals);
  const unwrapAction = useAsyncAction((amt: bigint) => unwrap(client, { wrapper: pair.wrapper, amount: amt }));
  const resumeAction = useAsyncAction(() => resumeUnwrap(client, pair.wrapper));

  return (
    <div className="flex flex-col gap-3">
      <AmountField symbol={sym} address={pair.underlying} value={amount} onChange={setAmount} />
      <Button
        variant="outline"
        className="h-11 w-full"
        disabled={resumeAction.isPending}
        onClick={async () => {
          const r = await resumeAction.run();
          if (r) {
            toast.success("Resumed pending unwrap");
            onDone?.();
          } else {
            toast.message("No pending unwrap");
          }
        }}
      >
        {resumeAction.isPending ? "Resuming…" : "Resume pending unwrap"}
      </Button>
      <Button
        className="h-11 w-full"
        disabled={unwrapAction.isPending || base == null || base === 0n}
        onClick={async () => {
          if (base == null) return;
          const r = await unwrapAction.run(base);
          if (r) {
            toast.success("Unwrapped to ERC-20");
            setAmount("");
            onDone?.();
          }
        }}
      >
        {unwrapAction.isPending ? "Unwrapping…" : `Unwrap ${sym}`}
      </Button>
    </div>
  );
}
