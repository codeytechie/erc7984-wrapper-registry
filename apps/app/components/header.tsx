"use client";
import Image from "next/image";
import { ModeToggle } from "./mode-toggle";
import { WalletControls } from "./wallet";

export function Header() {
  return (
    <header className="sticky top-0 z-40 bg-background/70 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-6 py-3">
        <div className="flex items-center gap-2.5">
          <Image src="/brand/zama-z.svg" alt="Zama" width={22} height={22} priority />
          <span className="text-sm font-semibold tracking-tight">Confidential Wrapper Registry</span>
        </div>
        <div className="flex items-center gap-2.5">
          <ModeToggle />
          <WalletControls />
        </div>
      </div>
    </header>
  );
}
