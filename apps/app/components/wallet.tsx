"use client";
import { useAccount, useDisconnect, useSwitchChain } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { toast } from "sonner";
import { Wallet, Copy, ExternalLink, LogOut, ChevronDown, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMode } from "@/app/providers";
import { activeChain, explorerUrl, isSupported } from "@/lib/networks";
import { ChainIcon } from "./chain-icon";
import { AddressAvatar } from "./address-avatar";

const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

export function WalletControls() {
  const { mode } = useMode();
  const { address, isConnected, chainId } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending } = useSwitchChain();
  const target = activeChain(mode);

  if (!isConnected || !address) {
    return (
      <Button className="h-9" onClick={() => openConnectModal?.()}>
        <Wallet className="size-4" />
        Connect wallet
      </Button>
    );
  }

  const wrongNetwork = !isSupported(chainId, mode);

  return (
    <div className="flex items-center gap-2">
      {wrongNetwork ? (
        <Button className="h-9" variant="destructive" disabled={isPending} onClick={() => switchChain({ chainId: target.id })}>
          <TriangleAlert className="size-4" />
          Switch to {target.name}
        </Button>
      ) : (
        <span className="hidden h-9 items-center gap-1.5 rounded-md border px-3 text-sm text-muted-foreground sm:inline-flex">
          <ChainIcon size={16} />
          {target.name}
        </span>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="h-9 gap-2 pl-2">
            <AddressAvatar address={address} size={20} />
            <span className="font-mono text-sm">{short(address)}</span>
            <ChevronDown className="size-4 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <div className="flex items-center gap-2 px-2 py-1.5">
            <AddressAvatar address={address} size={26} />
            <span className="font-mono text-sm">{short(address)}</span>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              navigator.clipboard.writeText(address);
              toast.success("Address copied");
            }}
          >
            <Copy className="size-4" />
            Copy address
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href={`${explorerUrl(mode)}/address/${address}`} target="_blank" rel="noreferrer">
              <ExternalLink className="size-4" />
              View on explorer
            </a>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => disconnect()}>
            <LogOut className="size-4" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
