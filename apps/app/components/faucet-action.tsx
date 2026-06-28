"use client";
import { faucetMint, knownTokenByWrapper, type PairView, type ZamaClient } from "@cwr/sdk";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAsyncAction } from "@/hooks/use-async-action";

export function FaucetAction({
  client,
  pair,
  onDone,
}: {
  client: ZamaClient;
  pair: PairView;
  onDone?: () => void;
}) {
  const faucetable = knownTokenByWrapper(pair.wrapper)?.faucet ?? false;
  const { run, isPending } = useAsyncAction(() =>
    faucetMint(client, {
      underlying: pair.underlying,
      underlyingDecimals: pair.underlyingDecimals,
      wholeTokens: 1000n,
    }),
  );

  if (!faucetable) return <p className="text-xs text-muted-foreground">No faucet for this token.</p>;

  return (
    <Button
      variant="outline"
      disabled={isPending}
      onClick={async () => {
        const ok = await run();
        if (ok) {
          toast.success("Minted 1000 tokens");
          onDone?.();
        }
      }}
    >
      {isPending ? "Minting…" : "Faucet 1000"}
    </Button>
  );
}
