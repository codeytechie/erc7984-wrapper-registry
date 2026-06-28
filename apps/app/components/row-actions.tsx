"use client";
import { useState } from "react";
import type { PairView, ZamaClient } from "@cwr/sdk";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { FaucetAction } from "./faucet-action";
import { WrapAction } from "./wrap-action";
import { UnwrapAction } from "./unwrap-action";
import { TransferAction } from "./transfer-action";

type Dialog = null | "wrap" | "unwrap" | "transfer";

function MenuItem({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className="block w-full rounded px-2 py-1.5 text-left text-sm hover:bg-muted">
      {children}
    </button>
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
  const [open, setOpen] = useState(false);
  const [dialog, setDialog] = useState<Dialog>(null);
  const done = () => {
    onDone();
    setDialog(null);
  };

  if (!client) return <span className="text-xs text-muted-foreground">—</span>;

  return (
    <div className="relative inline-block text-left">
      <Button size="sm" variant="outline" onClick={() => setOpen((o) => !o)}>
        Actions ▾
      </Button>
      {open && (
        <div
          className="absolute right-0 z-20 mt-1 w-40 space-y-1 rounded-md border bg-card p-1 shadow-lg"
          onMouseLeave={() => setOpen(false)}
        >
          {showFaucet && (
            <div className="px-1 py-1">
              <FaucetAction
                client={client}
                pair={pair}
                onDone={() => {
                  onDone();
                  setOpen(false);
                }}
              />
            </div>
          )}
          <MenuItem onClick={() => { setDialog("wrap"); setOpen(false); }}>Wrap</MenuItem>
          <MenuItem onClick={() => { setDialog("unwrap"); setOpen(false); }}>Unwrap</MenuItem>
          <MenuItem onClick={() => { setDialog("transfer"); setOpen(false); }}>Send</MenuItem>
        </div>
      )}

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
