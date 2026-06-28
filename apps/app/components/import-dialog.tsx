"use client";
import { useState } from "react";
import { isAddress } from "viem";
import { usePublicClient } from "wagmi";
import { resolveImportedToken, type PairView, type SupportedChainId } from "@cwr/sdk";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
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
    <Modal open={open} onClose={onClose} title="Import token">
      <div className="flex flex-col gap-3">
        <Input placeholder="token or wrapper 0x…" value={addr} onChange={(e) => setAddr(e.target.value)} />
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
    </Modal>
  );
}
