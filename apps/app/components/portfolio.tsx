"use client";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useAccount, usePublicClient, useSwitchChain } from "wagmi";
import { TriangleAlert } from "lucide-react";
import { abi, decryptBalancesBatch, fetchPairs, resolveImportedToken, type PairView } from "@cwr/sdk";
import { useMode, useZamaClient } from "@/app/providers";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfidentialBalanceCell } from "./confidential-balance-cell";
import { TokenInfo } from "./token-info";
import { TokenIcon } from "./token-icon";
import { RowActions } from "./row-actions";
import { ImportDialog } from "./import-dialog";
import { Spinner } from "./spinner";
import { normalizeSymbol, symbolOf } from "@/lib/token";
import { getImported, removeImported } from "@/lib/imported";
import { fmt } from "@/lib/format";
import { fmtUsd, usdValue } from "@/lib/usd";
import { activeChain, explorerUrl, isSupported } from "@/lib/networks";
import { useAsyncAction } from "@/hooks/use-async-action";
import { usePrices } from "@/hooks/use-prices";

const mask = (revealed: boolean, formatted: string) => (revealed ? formatted : "****");

// renders the fractional part dimmer than the whole part
function HeroUsd({ value }: { value: number | null }) {
  if (value == null) return <span>****</span>;
  const s = fmtUsd(value);
  const dot = s.indexOf(".");
  if (dot === -1 || /[kmbt]$/i.test(s)) return <span>{s}</span>;
  return (
    <span>
      {s.slice(0, dot)}
      <span className="text-muted-foreground">{s.slice(dot)}</span>
    </span>
  );
}

export function Portfolio() {
  const client = useZamaClient();
  const { chainId, mode } = useMode();
  const publicClient = usePublicClient({ chainId });
  const { address, isConnected, chainId: walletChainId } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { switchChain, isPending: switching } = useSwitchChain();
  const qc = useQueryClient();
  const { data: prices } = usePrices();

  const [imported, setImported] = useState<PairView[]>([]);
  const [conf, setConf] = useState<{ balances: Record<string, bigint>; failed: Record<string, string> }>({
    balances: {},
    failed: {},
  });
  const [importOpen, setImportOpen] = useState(false);

  const explorer = explorerUrl(mode);
  const wrongNetwork = isConnected && !isSupported(walletChainId, mode);

  useEffect(() => {
    setConf({ balances: {}, failed: {} });
  }, [address]);

  const { data: registryPairs, isLoading } = useQuery({
    queryKey: ["pairs", chainId],
    queryFn: () => fetchPairs(publicClient!, chainId),
    enabled: !!publicClient && isConnected,
  });

  useEffect(() => {
    let active = true;
    const refs = getImported(chainId);
    if (!publicClient || refs.length === 0) {
      setImported([]);
      return;
    }
    Promise.all(refs.map((r) => resolveImportedToken(publicClient, chainId, r.wrapper).catch(() => null))).then((res) => {
      if (active) setImported(res.filter((p): p is PairView => p !== null));
    });
    return () => {
      active = false;
    };
  }, [chainId, publicClient]);

  const importedSet = useMemo(() => new Set(imported.map((p) => p.wrapper.toLowerCase())), [imported]);

  const rows = useMemo(() => {
    const seen = new Set((registryPairs ?? []).map((p) => p.wrapper.toLowerCase()));
    const combined = [...(registryPairs ?? []), ...imported.filter((p) => !seen.has(p.wrapper.toLowerCase()))];
    // pin ZAMA to the top
    return combined.sort((a, b) => {
      const rank = (p: PairView) => (normalizeSymbol(symbolOf(p)) === "ZAMA" ? 0 : 1);
      return rank(a) - rank(b);
    });
  }, [registryPairs, imported]);

  const wrappersKey = rows.map((r) => r.wrapper).join(",");

  const { data: pub } = useQuery({
    queryKey: ["pub", chainId, address, wrappersKey],
    enabled: !!publicClient && !!address && rows.length > 0,
    queryFn: async () => {
      const calls = rows.map(
        (r) => ({ address: r.underlying, abi: abi.erc20Abi, functionName: "balanceOf", args: [address!] }) as const,
      );
      const res = await publicClient!.multicall({ contracts: calls, allowFailure: true });
      const out: Record<string, bigint> = {};
      rows.forEach((r, i) => {
        const x = res[i];
        out[r.wrapper.toLowerCase()] = x && x.status === "success" ? x.result : 0n;
      });
      return out;
    },
  });

  const decryptAll = useAsyncAction(() => decryptBalancesBatch(client!, rows.map((r) => r.wrapper)));

  const refresh = (pair: PairView) => {
    void qc.invalidateQueries({ queryKey: ["pub", chainId, address] });
    void qc.invalidateQueries({ queryKey: ["pairs", chainId] });
    setConf((prev) => {
      const balances = { ...prev.balances };
      delete balances[pair.wrapper.toLowerCase()];
      return { balances, failed: prev.failed };
    });
  };

  const priceOf = (p: PairView) => prices?.[normalizeSymbol(symbolOf(p))];
  const totalBase = (p: PairView): bigint =>
    (pub?.[p.wrapper.toLowerCase()] ?? 0n) + (conf.balances[p.wrapper.toLowerCase()] ?? 0n) * p.rate;
  const isRevealed = (p: PairView) => conf.balances[p.wrapper.toLowerCase()] != null;
  const allRevealed = rows.length > 0 && rows.every(isRevealed) && !!pub;

  // null when nothing revealed OR the price oracle is unreachable (avoids a misleading $0)
  const overallUsd =
    allRevealed && prices
      ? rows.reduce((sum, p) => {
          const u = usdValue(totalBase(p), p.underlyingDecimals, priceOf(p));
          return u != null ? sum + u : sum;
        }, 0)
      : null;

  if (!isConnected) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
          <p className="text-sm text-muted-foreground">Connect your wallet to view balances and manage tokens.</p>
          <Button onClick={() => openConnectModal?.()}>Connect wallet</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {wrongNetwork && (
        <div className="flex flex-col items-start justify-between gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 text-sm">
            <TriangleAlert className="size-4 text-destructive" />
            <span>
              Wrong network for {mode}. Switch to <span className="font-medium">{activeChain(mode).name}</span> to
              transact.
            </span>
          </div>
          <Button size="sm" disabled={switching} onClick={() => switchChain({ chainId: activeChain(mode).id })}>
            Switch to {activeChain(mode).name}
          </Button>
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Total holdings</p>
          <p className="mt-1 text-4xl font-semibold tracking-tight">
            <HeroUsd value={overallUsd} />
          </p>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {rows.length} {rows.length === 1 ? "token" : "tokens"} on {activeChain(mode).name}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            Import token
          </Button>
          <Button
            disabled={!client || rows.length === 0 || decryptAll.isPending}
            onClick={async () => {
              const res = await decryptAll.run();
              if (res)
                setConf((p) => ({ balances: { ...p.balances, ...res.balances }, failed: { ...p.failed, ...res.failed } }));
            }}
          >
            {decryptAll.isPending ? (
              <>
                <Spinner />
                Decrypting
              </>
            ) : (
              "Decrypt all"
            )}
          </Button>
        </div>
      </div>

      <Card className="mt-8">
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <Table className="text-[15px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Token</TableHead>
                  <TableHead>Public</TableHead>
                  <TableHead>Confidential</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((p) => {
                  const lc = p.wrapper.toLowerCase();
                  const price = priceOf(p);
                  const pubBal = pub?.[lc] ?? 0n;
                  const pubUsd = pub ? usdValue(pubBal, p.underlyingDecimals, price) : null;
                  const tBase = totalBase(p);
                  const totalUsd = usdValue(tBase, p.underlyingDecimals, price);
                  const revealed = isRevealed(p);
                  return (
                    <TableRow key={p.wrapper}>
                      <TableCell className="font-medium">
                        <span className="inline-flex items-center gap-2">
                          <TokenIcon symbol={symbolOf(p)} address={p.underlying} />
                          {symbolOf(p)}
                          <TokenInfo pair={p} explorer={explorer} />
                          {importedSet.has(lc) && <Badge variant="secondary">imported</Badge>}
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap tabular-nums">
                        {pub ? (
                          <div className="flex flex-col leading-tight">
                            <span className="">{fmt(pubBal, p.underlyingDecimals)}</span>
                            {pubUsd != null && <span className="text-xs text-muted-foreground">{fmtUsd(pubUsd)}</span>}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap tabular-nums">
                        <ConfidentialBalanceCell
                          client={client}
                          wrapper={p.wrapper}
                          decimals={p.wrapperDecimals}
                          rate={p.rate}
                          underlyingDecimals={p.underlyingDecimals}
                          price={price}
                          value={conf.balances[lc]}
                          failed={conf.failed[lc]}
                          onRevealed={(v) => setConf((prev) => ({ balances: { ...prev.balances, [lc]: v }, failed: prev.failed }))}
                        />
                      </TableCell>
                      <TableCell className="whitespace-nowrap tabular-nums">
                        <div className="flex flex-col leading-tight">
                          <span className="">{mask(revealed, fmt(tBase, p.underlyingDecimals))}</span>
                          {revealed && totalUsd != null && (
                            <span className="text-xs text-muted-foreground">{fmtUsd(totalUsd)}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <RowActions client={client} pair={p} showFaucet={mode === "testnet"} onDone={() => refresh(p)} />
                          {importedSet.has(lc) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                removeImported(chainId, p.wrapper);
                                setImported((cur) => cur.filter((r) => r.wrapper.toLowerCase() !== lc));
                              }}
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ImportDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        chainId={chainId}
        onImported={(p) => setImported((cur) => [...cur.filter((r) => r.wrapper.toLowerCase() !== p.wrapper.toLowerCase()), p])}
      />
    </div>
  );
}
