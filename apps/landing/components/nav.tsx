"use client";
import Image from "next/image";
import { Magnetic } from "./magnetic";
import { APP_URL } from "@/lib/links";

export function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
      <a href="#top" data-cursor className="flex items-center gap-2.5">
        <Image src="/brand/zama-z.svg" alt="Zama" width={22} height={22} priority />
        <span className="hidden text-sm font-semibold tracking-tight sm:inline">Confidential Wrapper Registry</span>
      </a>
      <Magnetic>
        <a
          href={APP_URL}
          data-cursor
          className="inline-flex h-9 items-center rounded-full border border-line px-4 text-sm font-semibold transition-colors hover:border-zama hover:text-zama"
        >
          Launch app
        </a>
      </Magnetic>
    </header>
  );
}
