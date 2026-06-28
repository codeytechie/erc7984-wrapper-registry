"use client";
import Image from "next/image";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export function ConnectBar() {
  return (
    <header className="flex items-center justify-between border-b px-6 py-4">
      <div className="flex items-center gap-3">
        <Image src="/brand/zama-z.svg" alt="Zama" width={28} height={28} priority />
        <span className="font-semibold">Confidential Wrapper Registry</span>
      </div>
      <ConnectButton showBalance={false} />
    </header>
  );
}
