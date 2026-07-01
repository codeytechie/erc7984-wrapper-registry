"use client";
import { Info } from "lucide-react";
import type { PairView } from "@cwr/sdk";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { fmt } from "@/lib/format";

const shortAddr = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

function Row({ label, value, href }: { label: string; value: string; href?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <span className="text-muted-foreground">{label}</span>
      {href ? (
        <a href={href} target="_blank" rel="noreferrer" className="hover:underline">
          {value}
        </a>
      ) : (
        <span>{value}</span>
      )}
    </div>
  );
}

export function TokenInfo({ pair, explorer }: { pair: PairView; explorer: string }) {
  return (
    <Popover>
      <PopoverTrigger className="text-muted-foreground transition-colors hover:text-foreground" aria-label="Token details">
        <Info className="size-3.5" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 space-y-2">
        <Row label="Wrapper" value={shortAddr(pair.wrapper)} href={`${explorer}/address/${pair.wrapper}`} />
        <Row label="Underlying" value={shortAddr(pair.underlying)} href={`${explorer}/address/${pair.underlying}`} />
        <Row label="Rate" value={pair.rate.toString()} />
        <Row label="Total shielded" value={fmt(pair.inferredTotalSupply, pair.wrapperDecimals)} />
        <Row label="ERC-7984" value={pair.supportsERC7984 ? "yes" : "no"} />
        <div className="pt-1">
          {pair.isValid ? <Badge variant="secondary">valid</Badge> : <Badge variant="destructive">revoked</Badge>}
        </div>
      </PopoverContent>
    </Popover>
  );
}
