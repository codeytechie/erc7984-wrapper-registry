"use client";
import { useQuery } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";
import { sepolia } from "wagmi/chains";
import { fetchPairs, knownTokenByWrapper, SEPOLIA_ID, type PairView } from "@cwr/sdk";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { fmt, shortAddr } from "@/lib/format";
import { toAppError, shouldRetry } from "@/lib/errors";

export function symbolOf(p: PairView): string {
  return knownTokenByWrapper(p.wrapper)?.symbol ?? p.underlyingSymbol ?? "—";
}

export function RegistryTable() {
  const publicClient = usePublicClient({ chainId: sepolia.id });
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["pairs", SEPOLIA_ID],
    queryFn: () => fetchPairs(publicClient!, SEPOLIA_ID),
    enabled: !!publicClient,
    retry: shouldRetry,
  });

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Registered pairs</CardTitle>
        <span className="text-xs text-muted-foreground">{data ? `${data.length} pairs` : ""}</span>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </div>
        )}
        {error ? (
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted-foreground">{toAppError(error).message}</span>
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : null}
        {data && (
          <Table>
            <THead>
              <TR>
                <TH>Token</TH>
                <TH>Wrapper</TH>
                <TH>Rate</TH>
                <TH>Total shielded</TH>
                <TH>Status</TH>
              </TR>
            </THead>
            <TBody>
              {data.map((p) => (
                <TR key={p.wrapper}>
                  <TD className="font-medium">{symbolOf(p)}</TD>
                  <TD className="font-mono text-xs">{shortAddr(p.wrapper)}</TD>
                  <TD>{p.rate.toString()}</TD>
                  <TD>{fmt(p.inferredTotalSupply, p.wrapperDecimals)}</TD>
                  <TD>
                    {p.isValid ? <Badge>valid</Badge> : <Badge variant="destructive">revoked</Badge>}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
