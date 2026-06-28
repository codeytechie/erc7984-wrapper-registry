"use client";
import { decryptBalance, type ZamaClient } from "@cwr/sdk";
import { Button } from "@/components/ui/button";
import { fmt } from "@/lib/format";
import { useAsyncAction } from "@/hooks/use-async-action";

export function ConfidentialBalanceCell({
  client,
  wrapper,
  decimals,
  value,
  failed,
  onRevealed,
}: {
  client: ZamaClient | null;
  wrapper: `0x${string}`;
  decimals: number;
  value?: bigint;
  failed?: string;
  onRevealed: (v: bigint) => void;
}) {
  const { run, isPending } = useAsyncAction(() => decryptBalance(client!, wrapper));

  if (value != null) return <span className="font-mono">{fmt(value, decimals)}</span>;
  if (!client) return <span className="font-mono text-muted-foreground">****</span>;

  return (
    <span className="flex items-center gap-2">
      <span className="font-mono text-muted-foreground">****</span>
      <Button
        size="sm"
        variant="outline"
        disabled={isPending}
        onClick={async () => {
          const b = await run();
          if (b != null) onRevealed(b);
        }}
      >
        {isPending ? "…" : failed ? "Retry" : "Reveal"}
      </Button>
    </span>
  );
}
