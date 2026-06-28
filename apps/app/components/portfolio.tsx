"use client";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useAccount, usePublicClient } from "wagmi";
import { abi, decryptBalancesBatch, fetchPairs, resolveImportedToken, type PairView } from "@cwr/sdk";
import { useMode, useZamaClient } from "@/app/providers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfidentialBalanceCell } from "./confidential-balance-cell";
import { TokenInfo } from "./token-info";
import { TokenIcon } from "./token-icon";
import { RowActions } from "./row-actions";
import { ImportDialog } from "./import-dialog";
import { symbolOf } from "@/lib/token";
import { getImported, removeImported } from "@/lib/imported";
import { fmt } from "@/lib/format";
import { useAsyncAction } from "@/hooks/use-async-action";

const mask = (revealed: boolean, formatted: string) => (revealed ? formatted : "****");

export function Portfolio() {
  const client = useZamaClient();
  const { chainId, mode } = useMode();
  const publicClient = usePublicClient({ chainId });
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const qc = useQueryClient();

  const [imported, setImported] = useState<PairView[]>([]);
  const [conf, setConf] = useState<{ balances: Record<string, bigint>; failed: Record<string, string> }>({
    balances: {},
    failed: {},
  });
  const [importOpen, setImportOpen] = useState(false);

  const explorer = mode === "mainnet" ? "https://etherscan.io" : "https://sepolia.etherscan.io";

  // reset revealed state when the account changes
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
    return [...(registryPairs ?? []), ...imported.filter((p) => !seen.has(p.wrapper.toLowerCase()))];
  }, [registryPairs, imported]);

  const wrappersKey = rows.map((r) => r.wrapper).join(",");

  // public balances in one multicall, keyed by account
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

  const totalBase = (p: PairView): bigint => (pub?.[p.wrapper.toLowerCase()] ?? 0n) + (conf.balances[p.wrapper.toLowerCase()] ?? 0n) * p.rate;
  const isRevealed = (p: PairView) => conf.balances[p.wrapper.toLowerCase()] != null;
  const allRevealed = rows.length > 0 && rows.every(isRevealed) && !!pub;

  // mixed decimals can't sum into one number; group by decimals
  const overallByDecimals: Record<number, bigint> = {};
  if (allRevealed) {
    rows.forEach((p) => {
      overallByDecimals[p.underlyingDecimals] = (overallByDecimals[p.underlyingDecimals] ?? 0n) + totalBase(p);
    });
  }

  if (!isConnected) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 p-12 text-center">
          <p className="text-sm text-muted-foreground">Connect your wallet to view balances and manage tokens.</p>
          <Button onClick={() => openConnectModal?.()}>Connect wallet</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Portfolio</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
              Import token
            </Button>
            <Button
              size="sm"
              disabled={!client || rows.length === 0 || decryptAll.isPending}
              onClick={async () => {
                const res = await decryptAll.run();
                if (res) setConf((p) => ({ balances: { ...p.balances, ...res.balances }, failed: { ...p.failed, ...res.failed } }));
              }}
            >
              {decryptAll.isPending ? "Decrypting…" : "Decrypt all"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Token</TH>
                  <TH>Public</TH>
                  <TH>Confidential</TH>
                  <TH>Total</TH>
                  <TH></TH>
                </TR>
              </THead>
              <TBody>
                {rows.map((p) => {
                  const lc = p.wrapper.toLowerCase();
                  return (
                    <TR key={p.wrapper}>
                      <TD className="font-medium">
                        <span className="inline-flex items-center gap-2">
                          <TokenIcon symbol={symbolOf(p)} address={p.underlying} />
                          {symbolOf(p)}
                          <TokenInfo pair={p} explorer={explorer} />
                          {importedSet.has(lc) && <Badge variant="muted">imported</Badge>}
                        </span>
                      </TD>
                      <TD>{pub ? fmt(pub[lc] ?? 0n, p.underlyingDecimals) : <span className="text-muted-foreground">—</span>}</TD>
                      <TD>
                        <ConfidentialBalanceCell
                          client={client}
                          wrapper={p.wrapper}
                          decimals={p.wrapperDecimals}
                          value={conf.balances[lc]}
                          failed={conf.failed[lc]}
                          onRevealed={(v) => setConf((prev) => ({ balances: { ...prev.balances, [lc]: v }, failed: prev.failed }))}
                        />
                      </TD>
                      <TD className="font-mono">{mask(isRevealed(p), fmt(totalBase(p), p.underlyingDecimals))}</TD>
                      <TD className="text-right">
                        <div className="flex items-center justify-end gap-2">
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
                      </TD>
                    </TR>
                  );
                })}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center justify-between p-5">
          <span className="text-sm text-muted-foreground">Σ holdings (token units, not fiat)</span>
          <span className="font-mono">
            {allRevealed
              ? Object.entries(overallByDecimals)
                  .map(([d, v]) => fmt(v, Number(d)))
                  .join(" + ") || "0"
              : "****"}
          </span>
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
