"use client";
import { useState } from "react";
import { isAddress } from "viem";
import { confidentialTransfer, type PairView, type ZamaClient } from "@cwr/sdk";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAsyncAction } from "@/hooks/use-async-action";
import { parseAmount } from "@/lib/format";

export function TransferAction({
  client,
  pair,
  onDone,
}: {
  client: ZamaClient;
  pair: PairView;
  onDone?: () => void;
}) {
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const base = parseAmount(amount, pair.wrapperDecimals);
  const valid = isAddress(to) && base != null && base > 0n;

  const { run, isPending } = useAsyncAction((recipient: `0x${string}`, amt: bigint) =>
    confidentialTransfer(client, { wrapper: pair.wrapper, to: recipient, amount: amt }),
  );

  return (
    <div className="flex flex-col gap-2">
      <Input placeholder="recipient 0x…" value={to} onChange={(e) => setTo(e.target.value)} />
      <div className="flex gap-2">
        <Input placeholder="amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <Button
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
          {isPending ? "Sending…" : "Send"}
        </Button>
      </div>
    </div>
  );
}
