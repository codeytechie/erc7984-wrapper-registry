"use client";
import { useState } from "react";
import { usePublicClient } from "wagmi";
import { resolveImportedToken, type PairView, type SupportedChainId } from "@cwr/sdk";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addImported } from "@/lib/imported";
import { useAsyncAction } from "@/hooks/use-async-action";
import { addressSchema, parseField } from "@/lib/schemas";
import { cn } from "@/lib/utils";

export function ImportDialog({
  open,
  onClose,
  chainId,
  onImported,
}: {
  open: boolean;
  onClose: () => void;
  chainId: SupportedChainId;
  onImported: (p: PairView) => void;
}) {
  const [addr, setAddr] = useState("");
  const publicClient = usePublicClient({ chainId });
  const { value: parsed, error } = parseField(addressSchema, addr);
  const { run, isPending } = useAsyncAction((a: `0x${string}`) => resolveImportedToken(publicClient!, chainId, a));

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import token</DialogTitle>
          <DialogDescription>Paste an ERC-20 or wrapper address registered on this network.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Input
              className={cn("h-11", error && "border-destructive focus-visible:ring-destructive/40")}
              placeholder="0x…"
              value={addr}
              aria-invalid={!!error}
              onChange={(e) => setAddr(e.target.value)}
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
          <Button
            className="h-11 w-full"
            disabled={isPending || parsed == null || !publicClient}
            onClick={async () => {
              if (parsed == null) return;
              const pair = await run(parsed);
              if (!pair) {
                toast.error("Not a valid registry token on this network.");
                return;
              }
              addImported(chainId, { underlying: pair.underlying, wrapper: pair.wrapper });
              onImported(pair);
              toast.success("Token imported");
              setAddr("");
              onClose();
            }}
          >
            {isPending ? "Resolving…" : "Import"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
