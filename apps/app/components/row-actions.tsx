"use client";
import { useState } from "react";
import { Lock, Unlock, Send, Droplets } from "lucide-react";
import { faucetMint, knownTokenByWrapper, type PairView, type ZamaClient } from "@cwr/sdk";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { WrapAction } from "./wrap-action";
import { UnwrapAction } from "./unwrap-action";
import { TransferAction } from "./transfer-action";
import { useAsyncAction } from "@/hooks/use-async-action";

type Dialog = null | "wrap" | "unwrap" | "transfer";

function IconBtn({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <Button variant="ghost" size="icon" className="h-8 w-8" title={label} aria-label={label} onClick={onClick} disabled={disabled}>
      {children}
    </Button>
  );
}

export function RowActions({
  client,
  pair,
  showFaucet,
  onDone,
}: {
  client: ZamaClient | null;
  pair: PairView;
  showFaucet: boolean;
  onDone: () => void;
}) {
  const [dialog, setDialog] = useState<Dialog>(null);
  const faucetable = (knownTokenByWrapper(pair.wrapper)?.faucet ?? false) && showFaucet;
  const faucet = useAsyncAction(() =>
    faucetMint(client!, { underlying: pair.underlying, underlyingDecimals: pair.underlyingDecimals, wholeTokens: 1000n }),
  );
  const done = () => {
    onDone();
    setDialog(null);
  };

  if (!client) return <span className="text-xs text-muted-foreground">—</span>;

  return (
    <div className="flex items-center justify-end gap-1">
      {faucetable && (
        <IconBtn
          label="Faucet 1000"
          disabled={faucet.isPending}
          onClick={async () => {
            const ok = await faucet.run();
            if (ok) {
              toast.success("Minted 1000 tokens");
              onDone();
            }
          }}
        >
          <Droplets size={16} />
        </IconBtn>
      )}
      <IconBtn label="Wrap" onClick={() => setDialog("wrap")}>
        <Lock size={16} />
      </IconBtn>
      <IconBtn label="Unwrap" onClick={() => setDialog("unwrap")}>
        <Unlock size={16} />
      </IconBtn>
      <IconBtn label="Confidential send" onClick={() => setDialog("transfer")}>
        <Send size={16} />
      </IconBtn>

      <Modal open={dialog === "wrap"} onClose={() => setDialog(null)} title="Wrap to confidential">
        <WrapAction client={client} pair={pair} onDone={done} />
      </Modal>
      <Modal open={dialog === "unwrap"} onClose={() => setDialog(null)} title="Unwrap to ERC-20">
        <UnwrapAction client={client} pair={pair} onDone={done} />
      </Modal>
      <Modal open={dialog === "transfer"} onClose={() => setDialog(null)} title="Confidential transfer">
        <TransferAction client={client} pair={pair} onDone={done} />
      </Modal>
    </div>
  );
}
