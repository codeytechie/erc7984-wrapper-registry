import type { CSSProperties } from "react";
import Image from "next/image";
import { APP_URL, GITHUB_URL } from "@/lib/links";

const rise = (i: number) => ({ "--i": i }) as CSSProperties;

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-between px-6 pt-6 pb-10 sm:px-10 sm:pt-8 sm:pb-14">
      <header className="rise flex items-center justify-between text-xs uppercase tracking-[0.14em] text-mist" style={rise(0)}>
        <span>Confidential Wrapper Registry</span>
        <a href={APP_URL} className="transition-colors hover:text-paper">
          Launch app ↗
        </a>
      </header>

      <section>
        <p
          className="rise max-w-2xl text-3xl font-semibold leading-[1.12] tracking-[-0.02em] sm:text-5xl"
          style={rise(1)}
        >
          Wrap any token. The amount stays encrypted on-chain, readable{" "}
          <span className="whitespace-nowrap">
            only by <span className="underline decoration-black decoration-[3px] underline-offset-8">you</span>.
          </span>
        </p>

        <p className="rise mt-10 max-w-md text-base leading-relaxed text-mist" style={rise(2)}>
          Wrap, hold or send privately, then unwrap back to the public token anytime. Amounts stay yours; transfers still
          settle on-chain.
        </p>
      </section>

      <footer className="rise flex items-center justify-between text-xs uppercase tracking-[0.14em] text-mist" style={rise(3)}>
        <a href={GITHUB_URL} className="transition-colors hover:text-paper">
          GitHub ↗
        </a>
        <span className="flex items-center gap-2">
          Built on
          <Image src="/brand/zama-black.svg" alt="Zama" width={58} height={16} className="h-4 w-auto" />
        </span>
      </footer>
    </main>
  );
}
