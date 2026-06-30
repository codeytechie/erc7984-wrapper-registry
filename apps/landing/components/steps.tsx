"use client";
import { Reveal } from "./reveal";

const STEPS = [
  { n: "01", t: "Wrap", d: "Deposit a public ERC-20 and mint its confidential ERC-7984 wrapper, rounded to the wrapper's decimals." },
  { n: "02", t: "Hold & send privately", d: "Transfer encrypted amounts. The chain records that a transfer happened — never how much." },
  { n: "03", t: "Unwrap", d: "Burn the wrapper and withdraw the underlying ERC-20 to any address, whenever you want." },
];

export function Steps() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-28">
      <Reveal>
        <h2 className="max-w-xl text-3xl font-bold tracking-tight sm:text-4xl">Privacy in three moves.</h2>
        <p className="mt-3 max-w-md text-mist">
          No new mental model — wrap, use, unwrap. The amounts just stop being public.
        </p>
      </Reveal>

      <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-3">
        {STEPS.map((s, i) => (
          <Reveal key={s.n} delay={i * 0.08} className="bg-void">
            <div className="grain relative h-full p-7">
              <span className="font-mono text-sm text-zama">{s.n}</span>
              <h3 className="mt-8 text-xl font-bold">{s.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-mist">{s.d}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
