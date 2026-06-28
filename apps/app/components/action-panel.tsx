"use client";
import { useAccount, useSwitchChain } from "wagmi";
import type { PairView, SupportedChainId, ZamaClient } from "@cwr/sdk";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { symbolOf } from "@/lib/token";
import { FaucetAction } from "./faucet-action";
import { WrapAction } from "./wrap-action";
import { UnwrapAction } from "./unwrap-action";
import { TransferAction } from "./transfer-action";

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      {children}
    </div>
  );
}

export function ActionPanel({
  client,
  pair,
  chainId,
  showFaucet,
  onDone,
}: {
  client: ZamaClient;
  pair: PairView;
  chainId: SupportedChainId;
  showFaucet: boolean;
  onDone: () => void;
}) {
  const { chainId: connectedChainId } = useAccount();
  const { switchChain } = useSwitchChain();

  if (connectedChainId !== chainId) {
    return (
      <Card>
        <CardContent className="flex items-center gap-3 p-5">
          <p className="text-sm text-muted-foreground">Wrong network for this mode.</p>
          <Button onClick={() => switchChain({ chainId })}>Switch network</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{symbolOf(pair)} actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {showFaucet && (
          <Section label="Faucet">
            <FaucetAction client={client} pair={pair} onDone={onDone} />
          </Section>
        )}
        <Section label="Wrap (ERC-20 to confidential)">
          <WrapAction client={client} pair={pair} onDone={onDone} />
        </Section>
        <Section label="Unwrap (confidential to ERC-20)">
          <UnwrapAction client={client} pair={pair} onDone={onDone} />
        </Section>
        <Section label="Confidential transfer">
          <TransferAction client={client} pair={pair} onDone={onDone} />
        </Section>
      </CardContent>
    </Card>
  );
}
