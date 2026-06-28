"use client";
import { useState } from "react";
import { decryptBalance, type PairView, type ZamaClient } from "@cwr/sdk";
import { Button } from "@/components/ui/button";
import { useAsyncAction } from "@/hooks/use-async-action";
import { fmt } from "@/lib/format";

export function DecryptAction({ client, pair }: { client: ZamaClient; pair: PairView }) {
  const [bal, setBal] = useState<bigint | null>(null);
  const { run, isPending } = useAsyncAction(() => decryptBalance(client, pair.wrapper));

  return (
    <div className="flex items-center gap-3">
      <Button
        disabled={isPending}
        onClick={async () => {
          const b = await run();
          if (b != null) setBal(b);
        }}
      >
        {isPending ? "Signing & decrypting…" : "Decrypt balance"}
      </Button>
      {bal != null && (
        <span className="font-mono text-sm">
          {fmt(bal, pair.wrapperDecimals)} <span className="text-muted-foreground">cleartext</span>
        </span>
      )}
    </div>
  );
}
