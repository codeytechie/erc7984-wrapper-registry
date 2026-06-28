"use client";
import { useState } from "react";
import { resumeUnwrap, unwrap, type PairView, type ZamaClient } from "@cwr/sdk";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAsyncAction } from "@/hooks/use-async-action";
import { parseAmount } from "@/lib/format";

export function UnwrapAction({
  client,
  pair,
  onDone,
}: {
  client: ZamaClient;
  pair: PairView;
  onDone?: () => void;
}) {
  const [amount, setAmount] = useState("");
  const base = parseAmount(amount, pair.wrapperDecimals);
  const unwrapAction = useAsyncAction((amt: bigint) => unwrap(client, { wrapper: pair.wrapper, amount: amt }));
  const resumeAction = useAsyncAction(() => resumeUnwrap(client, pair.wrapper));

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
          {unwrapAction.isPending ? "Unwrapping…" : "Unwrap"}
        </Button>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="self-start"
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
        {resumeAction.isPending ? "Resuming…" : "Resume pending"}
      </Button>
    </div>
  );
}
