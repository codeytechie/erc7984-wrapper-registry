"use client";
import { useQuery } from "@tanstack/react-query";
import { publicBalanceOf, type ZamaClient } from "@cwr/sdk";
import { Skeleton } from "@/components/ui/skeleton";
import { fmt } from "@/lib/format";
import { shouldRetry } from "@/lib/errors";

export function PublicBalanceCell({
  client,
  underlying,
  decimals,
  chainId,
}: {
  client: ZamaClient | null;
  underlying: `0x${string}`;
  decimals: number;
  chainId: number;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["pub", chainId, underlying, client?.account],
    queryFn: () => publicBalanceOf(client!, underlying),
    enabled: !!client,
    retry: shouldRetry,
  });

  if (!client) return <span className="text-muted-foreground">—</span>;
  if (isLoading) return <Skeleton className="h-4 w-16" />;
  return <span>{fmt(data ?? 0n, decimals)}</span>;
}
