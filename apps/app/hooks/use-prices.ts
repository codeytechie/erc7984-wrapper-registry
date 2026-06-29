"use client";
import { useQuery } from "@tanstack/react-query";
import { PRICE_API } from "@/lib/env";
import type { PricesResponse } from "@/lib/prices";

// USD prices by normalized symbol, from @cwr/price-oracle
export function usePrices() {
  return useQuery({
    queryKey: ["prices"],
    queryFn: async (): Promise<Record<string, number>> => {
      const res = await fetch(`${PRICE_API}/prices`);
      if (!res.ok) throw new Error("price fetch failed");
      return ((await res.json()) as PricesResponse).prices;
    },
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
}
