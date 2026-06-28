"use client";
import { useState } from "react";
import { decryptBalance, type ZamaClient } from "@cwr/sdk";
import { Button } from "@/components/ui/button";
import { fmt } from "@/lib/format";
import { useAsyncAction } from "@/hooks/use-async-action";

export function ConfidentialBalanceCell({
  client,
  wrapper,
  decimals,
  batchValue,
  failedCode,
}: {
  client: ZamaClient | null;
  wrapper: `0x${string}`;
  decimals: number;
  batchValue?: bigint;
  failedCode?: string;
}) {
  const [local, setLocal] = useState<bigint | null>(null);
  const { run, isPending } = useAsyncAction(() => decryptBalance(client!, wrapper));
  const value = batchValue ?? local;

  if (value != null) return <span className="font-mono">{fmt(value, decimals)}</span>;
  if (!client) return <span className="text-muted-foreground">—</span>;

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={isPending}
      onClick={async () => {
        const b = await run();
        if (b != null) setLocal(b);
      }}
    >
      {isPending ? "…" : failedCode ? "Retry" : "Reveal"}
    </Button>
  );
}
