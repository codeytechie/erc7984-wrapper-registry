"use client";
import { useState } from "react";
import type { PairView } from "@cwr/sdk";
import { Badge } from "@/components/ui/badge";
import { fmt } from "@/lib/format";

function Row({ label, value, href }: { label: string; value: string; href?: string }) {
  return (
    <p className="break-all">
      <span className="text-muted-foreground">{label}: </span>
      {value}
      {href && (
        <a className="ml-1 underline" href={href} target="_blank" rel="noreferrer">
          ↗
        </a>
      )}
    </p>
  );
}

export function TokenInfo({ pair, explorer }: { pair: PairView; explorer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-block">
      <button onClick={() => setOpen((o) => !o)} aria-label="Token details" className="ml-1 text-xs text-muted-foreground">
        ⓘ
      </button>
      {open && (
        <div className="absolute left-0 z-20 mt-1 w-72 space-y-1 rounded-md border bg-card p-3 text-xs shadow-lg">
          <Row label="Wrapper" value={pair.wrapper} href={`${explorer}/address/${pair.wrapper}`} />
          <Row label="Underlying" value={pair.underlying} href={`${explorer}/address/${pair.underlying}`} />
          <Row label="Rate" value={pair.rate.toString()} />
          <Row label="Total shielded" value={fmt(pair.inferredTotalSupply, pair.wrapperDecimals)} />
          <Row label="ERC-7984" value={pair.supportsERC7984 ? "yes" : "no"} />
          <div>{pair.isValid ? <Badge>valid</Badge> : <Badge variant="destructive">revoked</Badge>}</div>
        </div>
      )}
    </span>
  );
}
