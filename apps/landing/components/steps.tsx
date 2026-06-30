"use client";
import { useRef } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "motion/react";

const STEPS = [
  { n: "01", t: "Wrap", d: "Deposit a public ERC-20 and mint its confidential ERC-7984 wrapper.", tag: "public → confidential" },
  { n: "02", t: "Send privately", d: "Transfer encrypted amounts. The chain records a transfer — never the number.", tag: "encrypted transfer" },
  { n: "03", t: "Unwrap", d: "Burn the wrapper and withdraw the underlying ERC-20, whenever you want.", tag: "confidential → public" },
];

function Card({
  i,
  step,
  progress,
  range,
  targetScale,
}: {
  i: number;
  step: (typeof STEPS)[number];
  progress: MotionValue<number>;
  range: [number, number];
  targetScale: number;
}) {
  const scale = useTransform(progress, range, [1, targetScale]);
  const last = i === STEPS.length - 1;
  return (
    <div className="sticky top-0 flex min-h-screen items-center justify-center px-6">
      <motion.div
        style={{ scale, top: `calc(-12vh + ${i * 34}px)` }}
        className={`grain relative flex h-[60vh] w-full max-w-4xl flex-col justify-between overflow-hidden rounded-[2rem] border p-9 sm:p-14 ${
          last ? "border-zama bg-zama text-black" : "border-line bg-ink"
        }`}
      >
        <div className="flex items-start justify-between">
          <span className={`font-mono text-sm ${last ? "text-black/60" : "text-zama"}`}>{step.n}</span>
          <span className={`font-mono text-xs uppercase tracking-[0.2em] ${last ? "text-black/60" : "text-mist"}`}>
            {step.tag}
          </span>
        </div>
        <div>
          <h3 className="text-5xl font-bold tracking-[-0.02em] sm:text-7xl">{step.t}</h3>
          <p className={`mt-5 max-w-md text-lg leading-relaxed ${last ? "text-black/70" : "text-mist"}`}>{step.d}</p>
        </div>
      </motion.div>
    </div>
  );
}

export function Steps() {
  const container = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: container, offset: ["start start", "end end"] });
  return (
    <section ref={container} className="relative">
      <div className="mx-auto mb-4 max-w-4xl px-6">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-mist">Three moves</span>
      </div>
      {STEPS.map((s, i) => (
        <Card
          key={s.n}
          i={i}
          step={s}
          progress={scrollYProgress}
          range={[i * 0.25, 1]}
          targetScale={1 - (STEPS.length - i) * 0.04}
        />
      ))}
    </section>
  );
}
