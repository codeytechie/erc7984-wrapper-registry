"use client";
import Image from "next/image";
import { Magnetic } from "./magnetic";
import { APP_URL } from "@/lib/links";

export function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4">
      <nav className="glass grain relative flex w-full max-w-5xl items-center justify-between rounded-full px-5 py-3">
        <a href="#top" className="flex items-center gap-2.5">
          <Image src="/brand/zama-z.svg" alt="Zama" width={24} height={24} priority />
          <span className="hidden text-sm font-bold tracking-tight sm:inline">Confidential Wrapper Registry</span>
        </a>
        <Magnetic>
          <a
            href={APP_URL}
            className="inline-flex h-9 items-center rounded-full bg-zama px-4 text-sm font-bold text-black transition-opacity hover:opacity-90"
          >
            Launch app
          </a>
        </Magnetic>
      </nav>
    </header>
  );
}
