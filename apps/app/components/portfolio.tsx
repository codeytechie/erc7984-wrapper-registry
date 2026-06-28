"use client";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAccount, usePublicClient } from "wagmi";
import {
  decryptBalancesBatch,
  fetchPairs,
  resolveImportedToken,
  type PairView,
} from "@cwr/sdk";
import { useMode, useZamaClient } from "@/app/providers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PublicBalanceCell } from "./public-balance-cell";
import { ConfidentialBalanceCell } from "./confidential-balance-cell";
import { TokenInfo } from "./token-info";
import { ActionPanel } from "./action-panel";
import { ImportDialog } from "./import-dialog";
import { symbolOf } from "@/lib/token";
import { getImported, removeImported } from "@/lib/imported";
import { useAsyncAction } from "@/hooks/use-async-action";

export function Portfolio() {
  const client = useZamaClient();
  const { chainId, mode } = useMode();
  const publicClient = usePublicClient({ chainId });
  const { isConnected } = useAccount();
  const qc = useQueryClient();

  const [imported, setImported] = useState<PairView[]>([]);
  const [conf, setConf] = useState<{ balances: Record<string, bigint>; failed: Record<string, string> }>({
    balances: {},
    failed: {},
  });
  const [selected, setSelected] = useState<`0x${string}` | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const explorer = mode === "mainnet" ? "https://etherscan.io" : "https://sepolia.etherscan.io";

  const { data: registryPairs, isLoading } = useQuery({
    queryKey: ["pairs", chainId],
    queryFn: () => fetchPairs(publicClient!, chainId),
    enabled: !!publicClient,
  });

  // re-resolve imported tokens for this chain
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
    const extra = imported.filter((p) => !seen.has(p.wrapper.toLowerCase()));
    return [...(registryPairs ?? []), ...extra];
  }, [registryPairs, imported]);

  const decryptAll = useAsyncAction(() => decryptBalancesBatch(client!, rows.map((r) => r.wrapper)));

  const refresh = (pair: PairView) => {
    void qc.invalidateQueries({ queryKey: ["pub", chainId, pair.underlying] });
    void qc.invalidateQueries({ queryKey: ["pairs", chainId] });
    setConf((prev) => {
      const balances = { ...prev.balances };
      delete balances[pair.wrapper.toLowerCase()];
      return { balances, failed: prev.failed };
    });
  };

  const selectedPair = rows.find((r) => r.wrapper === selected) ?? null;

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
          {isLoading && (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-full" />
              ))}
            </div>
          )}
          {!isLoading && (
            <Table>
              <THead>
                <TR>
                  <TH>Token</TH>
                  <TH>Public balance</TH>
                  <TH>Confidential balance</TH>
                  <TH></TH>
                </TR>
              </THead>
              <TBody>
                {rows.map((p) => {
                  const lc = p.wrapper.toLowerCase();
                  return (
                    <TR key={p.wrapper}>
                      <TD className="font-medium">
                        <span className="inline-flex items-center gap-1">
                          {symbolOf(p)}
                          <TokenInfo pair={p} explorer={explorer} />
                          {importedSet.has(lc) && <Badge variant="muted">imported</Badge>}
                        </span>
                      </TD>
                      <TD>
                        <PublicBalanceCell client={client} underlying={p.underlying} decimals={p.underlyingDecimals} chainId={chainId} />
                      </TD>
                      <TD>
                        <ConfidentialBalanceCell
                          client={client}
                          wrapper={p.wrapper}
                          decimals={p.wrapperDecimals}
                          batchValue={conf.balances[lc]}
                          failedCode={conf.failed[lc]}
                        />
                      </TD>
                      <TD className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant={selected === p.wrapper ? "default" : "outline"} onClick={() => setSelected(p.wrapper)}>
                            Manage
                          </Button>
                          {importedSet.has(lc) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                removeImported(chainId, p.wrapper);
                                setImported((cur) => cur.filter((r) => r.wrapper.toLowerCase() !== lc));
                                if (selected === p.wrapper) setSelected(null);
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

      {!isConnected || !client ? (
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Connect your wallet to view balances and manage tokens.</p>
          </CardContent>
        </Card>
      ) : selectedPair ? (
        <ActionPanel
          client={client}
          pair={selectedPair}
          chainId={chainId}
          showFaucet={mode === "testnet"}
          onDone={() => refresh(selectedPair)}
        />
      ) : (
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Select a token (Manage) to faucet, wrap, decrypt, or transfer.</p>
          </CardContent>
        </Card>
      )}

      <ImportDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        chainId={chainId}
        onImported={(p) => setImported((cur) => [...cur.filter((r) => r.wrapper.toLowerCase() !== p.wrapper.toLowerCase()), p])}
      />
    </div>
  );
}
