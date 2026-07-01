"use client";
import { useState } from "react";
import { isAddress } from "viem";
import { usePublicClient } from "wagmi";
import { resolveImportedToken, type PairView, type SupportedChainId } from "@cwr/sdk";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addImported } from "@/lib/imported";
import { useAsyncAction } from "@/hooks/use-async-action";

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
  const { run, isPending } = useAsyncAction((a: `0x${string}`) => resolveImportedToken(publicClient!, chainId, a));

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import token</DialogTitle>
          <DialogDescription>Paste an ERC-20 or wrapper address registered on this network.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <Input placeholder="0x…" value={addr} onChange={(e) => setAddr(e.target.value)} />
          <Button
            disabled={isPending || !isAddress(addr) || !publicClient}
            onClick={async () => {
              if (!isAddress(addr)) return;
              const pair = await run(addr);
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
