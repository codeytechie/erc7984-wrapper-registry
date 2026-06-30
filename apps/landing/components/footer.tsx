"use client";
import Image from "next/image";
import { Magnetic } from "./magnetic";
import { APP_URL, GITHUB_URL } from "@/lib/links";

export function Footer() {
  return (
    <footer className="mx-auto max-w-6xl px-6 pb-12">
      <div className="glass grain relative overflow-hidden rounded-3xl p-10 sm:p-14">
        <div className="bloom pointer-events-none absolute inset-0 opacity-70" />
        <div className="relative flex flex-col items-start gap-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Make your balances yours.</h2>
            <p className="mt-2 text-mist">Wrap, decrypt, and transfer confidentially — start on Sepolia.</p>
          </div>
          <Magnetic>
            <a
              href={APP_URL}
              className="inline-flex h-12 items-center rounded-full bg-zama px-7 font-bold text-black transition-opacity hover:opacity-90"
            >
              Launch app
            </a>
          </Magnetic>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between text-sm text-mist">
        <span className="flex items-center gap-2">
          <Image src="/brand/zama-z.svg" alt="" width={18} height={18} />
          Confidential Wrapper Registry
        </span>
        <a href={GITHUB_URL} className="transition-colors hover:text-paper">
          GitHub →
        </a>
      </div>
    </footer>
  );
}
