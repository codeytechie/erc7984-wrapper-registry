"use client";
import { useState } from "react";
import { confidentialTransfer, type PairView, type ZamaClient } from "@cwr/sdk";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AmountField } from "./amount-field";
import { Spinner } from "./spinner";
import { symbolOf } from "@/lib/token";
import { useAsyncAction } from "@/hooks/use-async-action";
import { addressSchema, amountSchema, parseField } from "@/lib/schemas";
import { cn } from "@/lib/utils";

export function TransferAction({ client, pair, onDone }: { client: ZamaClient; pair: PairView; onDone?: () => void }) {
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const sym = symbolOf(pair);
  const { value: recipient, error: toError } = parseField(addressSchema, to);
  const { value: base, error: amtError } = parseField(amountSchema(pair.wrapperDecimals), amount);
  const valid = recipient != null && base != null;

  const { run, isPending } = useAsyncAction((r: `0x${string}`, amt: bigint) =>
    confidentialTransfer(client, { wrapper: pair.wrapper, to: r, amount: amt }),
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Input
          className={cn("h-11", toError && "border-destructive focus-visible:ring-destructive/40")}
          placeholder="Recipient 0x…"
          value={to}
          aria-invalid={!!toError}
          onChange={(e) => setTo(e.target.value)}
        />
        {toError && <p className="text-xs text-destructive">{toError}</p>}
      </div>
      <AmountField symbol={sym} address={pair.underlying} value={amount} onChange={setAmount} error={amtError} />
      <Button
        className="h-11 w-full"
        disabled={isPending || !valid}
        onClick={async () => {
          if (recipient == null || base == null) return;
          const r = await run(recipient, base);
          if (r) {
            toast.success("Confidential transfer sent");
            setTo("");
            setAmount("");
            onDone?.();
          }
        }}
      >
        {isPending ? (
          <>
            <Spinner />
            Sending
          </>
        ) : (
          `Send ${sym}`
        )}
      </Button>
    </div>
  );
}
