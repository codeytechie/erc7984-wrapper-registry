"use client";
import Image from "next/image";
import { ModeToggle } from "./mode-toggle";
import { WalletControls } from "./wallet";
import { ThemeToggle } from "./theme-toggle";

export function Header() {
  return (
    <header className="sticky top-0 z-40 bg-background/70 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 py-3 sm:gap-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-2.5">
          <Image src="/brand/zama-z.svg" alt="Zama" width={22} height={22} priority className="shrink-0" />
          <span className="hidden truncate text-base font-semibold tracking-tight sm:inline">
            Confidential Wrapper Registry
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle />
          <ModeToggle />
          <WalletControls />
        </div>
      </div>
    </header>
  );
}
