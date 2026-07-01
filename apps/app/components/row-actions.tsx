"use client";
import { useState } from "react";
import { Lock, Unlock, Send, Droplets } from "lucide-react";
import { faucetMint, knownTokenByWrapper, type PairView, type ZamaClient } from "@cwr/sdk";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { TokenIcon } from "./token-icon";
import { WrapAction } from "./wrap-action";
import { UnwrapAction } from "./unwrap-action";
import { TransferAction } from "./transfer-action";
import { symbolOf } from "@/lib/token";
import { useAsyncAction } from "@/hooks/use-async-action";

type Kind = "wrap" | "unwrap" | "transfer";

const COPY: Record<Kind, { title: string; desc: string }> = {
  wrap: { title: "Wrap", desc: "Deposit the public token and mint its confidential wrapper." },
  unwrap: { title: "Unwrap", desc: "Burn the confidential wrapper and withdraw the public token." },
  transfer: { title: "Confidential transfer", desc: "Send an encrypted amount — the chain never sees how much." },
};

function IconBtn({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8" aria-label={label} onClick={onClick} disabled={disabled}>
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
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
  const [kind, setKind] = useState<Kind | null>(null);
  const faucetable = (knownTokenByWrapper(pair.wrapper)?.faucet ?? false) && showFaucet;
  const faucet = useAsyncAction(() =>
    faucetMint(client!, { underlying: pair.underlying, underlyingDecimals: pair.underlyingDecimals, wholeTokens: 1000n }),
  );
  const done = () => {
    onDone();
    setKind(null);
  };

  if (!client) return <span className="text-xs text-muted-foreground">—</span>;

  const symbol = symbolOf(pair);

  return (
    <div className="flex items-center justify-end gap-1">
      {faucetable && (
        <IconBtn
          label="Faucet 1,000"
          disabled={faucet.isPending}
          onClick={async () => {
            const ok = await faucet.run();
            if (ok) {
              toast.success(`Minted 1,000 ${symbol.replace(/^c/, "")}`);
              onDone();
            }
          }}
        >
          <Droplets className="size-4" />
        </IconBtn>
      )}
      <IconBtn label="Wrap" onClick={() => setKind("wrap")}>
        <Lock className="size-4" />
      </IconBtn>
      <IconBtn label="Unwrap" onClick={() => setKind("unwrap")}>
        <Unlock className="size-4" />
      </IconBtn>
      <IconBtn label="Confidential send" onClick={() => setKind("transfer")}>
        <Send className="size-4" />
      </IconBtn>

      <Dialog open={kind !== null} onOpenChange={(o) => !o && setKind(null)}>
        <DialogContent className="sm:max-w-md">
          {kind && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <TokenIcon symbol={symbol} address={pair.underlying} size={36} />
                  <div className="text-left">
                    <DialogTitle>
                      {COPY[kind].title} · {symbol}
                    </DialogTitle>
                    <DialogDescription>{COPY[kind].desc}</DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              {kind === "wrap" && <WrapAction client={client} pair={pair} onDone={done} />}
              {kind === "unwrap" && <UnwrapAction client={client} pair={pair} onDone={done} />}
              {kind === "transfer" && <TransferAction client={client} pair={pair} onDone={done} />}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
