import type { CSSProperties } from "react";
import { APP_URL, GITHUB_URL } from "@/lib/links";

const META: [string, string][] = [
  ["Standard", "ERC-7984"],
  ["Decryption", "EIP-712"],
  ["Networks", "Ethereum, Sepolia"],
  ["Registry", "read live on-chain"],
];

const rise = (i: number) => ({ "--i": i }) as CSSProperties;

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-between px-6 py-10 sm:px-10 sm:py-16">
      <header className="rise flex items-center justify-between font-mono text-xs text-mist" style={rise(0)}>
        <span>Confidential Wrapper Registry</span>
        <a href={APP_URL} className="transition-colors hover:text-paper">
          Launch app ↗
        </a>
      </header>

      <section>
        <p
          className="rise max-w-2xl text-2xl font-medium leading-[1.35] tracking-[-0.01em] sm:text-[2.25rem] sm:leading-[1.3]"
          style={rise(1)}
        >
          Wrap a public token into a confidential one. The balance lives encrypted on-chain, readable{" "}
          <span className="whitespace-nowrap">
            only by <span className="underline decoration-zama decoration-2 underline-offset-[6px]">you</span>.
          </span>
        </p>

        <dl className="rise mt-16 grid max-w-xl grid-cols-2 gap-x-10 gap-y-6 font-mono text-sm" style={rise(2)}>
          {META.map(([k, v]) => (
            <div key={k}>
              <dt className="text-mist">{k}</dt>
              <dd className="mt-1">{v}</dd>
            </div>
          ))}
        </dl>

        <p className="rise mt-16 max-w-md text-sm leading-relaxed text-mist" style={rise(3)}>
          Wrap, hold or send privately, then unwrap back to the public token anytime. Amounts stay yours; transfers still
          settle on-chain.
        </p>
      </section>

      <footer className="rise flex items-center justify-between font-mono text-xs text-mist" style={rise(4)}>
        <a href={GITHUB_URL} className="transition-colors hover:text-paper">
          GitHub ↗
        </a>
        <span>Built on Zama FHE</span>
      </footer>
    </main>
  );
}
