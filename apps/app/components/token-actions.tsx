"use client";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAccount, usePublicClient, useSwitchChain } from "wagmi";
import { sepolia } from "wagmi/chains";
import { fetchPairs, SEPOLIA_ID } from "@cwr/sdk";
import { useZamaClient } from "@/app/providers";
import { symbolOf } from "@/components/registry-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { shouldRetry } from "@/lib/errors";
import { FaucetAction } from "./faucet-action";
import { WrapAction } from "./wrap-action";
import { DecryptAction } from "./decrypt-action";
import { UnwrapAction } from "./unwrap-action";

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      {children}
    </div>
  );
}

export function TokenActions() {
  const client = useZamaClient();
  const { isConnected, chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const publicClient = usePublicClient({ chainId: sepolia.id });
  const queryClient = useQueryClient();
  const [idx, setIdx] = useState(0);

  const { data: pairs } = useQuery({
    queryKey: ["pairs", SEPOLIA_ID],
    queryFn: () => fetchPairs(publicClient!, SEPOLIA_ID),
    enabled: !!publicClient,
    retry: shouldRetry,
  });

  const refresh = () => void queryClient.invalidateQueries({ queryKey: ["pairs", SEPOLIA_ID] });

  if (!isConnected || !client) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Connect your wallet to faucet, wrap, decrypt, and unwrap.</p>
        </CardContent>
      </Card>
    );
  }

  if (chainId !== sepolia.id) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Wrong network</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-3">
          <p className="text-sm text-muted-foreground">Switch to Sepolia to continue.</p>
          <Button onClick={() => switchChain({ chainId: sepolia.id })}>Switch to Sepolia</Button>
        </CardContent>
      </Card>
    );
  }

  const pair = pairs?.[idx];

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Actions</CardTitle>
        {pairs && (
          <select
            className="h-9 rounded-md border bg-background px-2 text-sm"
            value={idx}
            onChange={(e) => setIdx(Number(e.target.value))}
          >
            {pairs.map((p, i) => (
              <option key={p.wrapper} value={i}>
                {symbolOf(p)}
              </option>
            ))}
          </select>
        )}
      </CardHeader>
      <CardContent className="space-y-5">
        {!pair && <p className="text-sm text-muted-foreground">Loading tokens…</p>}
        {pair && (
          <>
            <Section label="Faucet">
              <FaucetAction client={client} pair={pair} onDone={refresh} />
            </Section>
            <Section label="Wrap (ERC-20 to confidential)">
              <WrapAction client={client} pair={pair} onDone={refresh} />
            </Section>
            <Section label="Confidential balance">
              <DecryptAction client={client} pair={pair} />
            </Section>
            <Section label="Unwrap (confidential to ERC-20)">
              <UnwrapAction client={client} pair={pair} onDone={refresh} />
            </Section>
          </>
        )}
      </CardContent>
    </Card>
  );
}
