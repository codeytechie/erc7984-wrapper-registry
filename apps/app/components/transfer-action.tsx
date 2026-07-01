"use client";
import { useState } from "react";
import { isAddress } from "viem";
import { confidentialTransfer, type PairView, type ZamaClient } from "@cwr/sdk";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AmountField } from "./amount-field";
import { symbolOf } from "@/lib/token";
import { useAsyncAction } from "@/hooks/use-async-action";
import { parseAmount } from "@/lib/format";

export function TransferAction({ client, pair, onDone }: { client: ZamaClient; pair: PairView; onDone?: () => void }) {
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const sym = symbolOf(pair);
  const base = parseAmount(amount, pair.wrapperDecimals);
  const valid = isAddress(to) && base != null && base > 0n;

  const { run, isPending } = useAsyncAction((recipient: `0x${string}`, amt: bigint) =>
    confidentialTransfer(client, { wrapper: pair.wrapper, to: recipient, amount: amt }),
  );

  return (
    <div className="flex flex-col gap-3">
      <Input
        className="h-11"
        placeholder="Recipient 0x…"
        value={to}
        onChange={(e) => setTo(e.target.value)}
      />
      <AmountField symbol={sym} address={pair.underlying} value={amount} onChange={setAmount} />
      <Button
        className="h-11 w-full"
        disabled={isPending || !valid}
        onClick={async () => {
          if (!isAddress(to) || base == null) return;
          const r = await run(to, base);
          if (r) {
            toast.success("Confidential transfer sent");
            setTo("");
            setAmount("");
            onDone?.();
          }
        }}
      >
        {isPending ? "Sending…" : `Send ${sym}`}
      </Button>
    </div>
  );
}
