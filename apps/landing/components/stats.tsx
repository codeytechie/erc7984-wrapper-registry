import { Reveal } from "./reveal";

const STATS = [
  { k: "FHE", v: "balances encrypted and computed on-chain" },
  { k: "ERC-7984", v: "the confidential token standard" },
  { k: "EIP-712", v: "one signature decrypts your balances" },
  { k: "2 networks", v: "live on Ethereum and Sepolia" },
];

export function Stats() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-28">
      <Reveal>
        <div className="grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.k} className="grain relative bg-void p-7">
              <p className="font-mono text-2xl font-bold text-paper">{s.k}</p>
              <p className="mt-2 text-sm text-mist">{s.v}</p>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
