"use client";
import Image from "next/image";
import { Magnetic } from "./magnetic";
import { Reveal } from "./reveal";
import { APP_URL, GITHUB_URL } from "@/lib/links";

export function Footer() {
  return (
    <footer className="relative mx-auto max-w-6xl px-6 pb-14 pt-32">
      <div className="bloom pointer-events-none absolute inset-0 -z-10 opacity-60" />
      <Reveal>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-mist">Confidential Wrapper Registry</p>
        <h2 className="mt-6 max-w-3xl text-5xl font-bold leading-[0.95] tracking-[-0.02em] sm:text-8xl">
          Make your balances yours.
        </h2>
        <div className="mt-12 flex flex-wrap items-center gap-6">
          <Magnetic>
            <a
              href={APP_URL}
              data-cursor
              className="inline-flex h-14 items-center rounded-full bg-zama px-9 text-lg font-bold text-black transition-opacity hover:opacity-90"
            >
              Launch app
            </a>
          </Magnetic>
          <a href={GITHUB_URL} data-cursor className="text-sm font-semibold text-mist transition-colors hover:text-paper">
            GitHub →
          </a>
        </div>
      </Reveal>
      <div className="mt-24 flex items-center justify-between border-t border-line pt-8 text-xs text-mist">
        <span className="flex items-center gap-2">
          <Image src="/brand/zama-z.svg" alt="" width={16} height={16} />
          Built on Zama FHE
        </span>
        <span>Sepolia · Ethereum</span>
      </div>
    </footer>
  );
}
