"use client";
import { motion, type Variants } from "motion/react";
import { Magnetic } from "./magnetic";
import { DecryptCard } from "./decrypt-card";
import { APP_URL, GITHUB_URL } from "@/lib/links";

const container: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } } };
const lineWrap: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };
const line: Variants = { hidden: { y: "115%" }, show: { y: "0%", transition: { duration: 0.85, ease: [0.22, 1, 0.36, 1] } } };
const fade: Variants = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } } };

const HEADLINE = ["Wrap any token.", "Keep the amount", "to yourself."];

export function Hero() {
  return (
    <section id="top" className="relative mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 pt-28 pb-20">
      <div className="bloom pointer-events-none absolute inset-0 -z-10" />
      <div className="grid items-center gap-14 lg:grid-cols-[1.1fr_0.9fr]">
        <motion.div variants={container} initial="hidden" animate="show">
          <motion.p
            variants={fade}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1 font-mono text-xs text-mist"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-zama" />
            ERC-7984 confidential tokens · Zama FHE
          </motion.p>

          <motion.h1 variants={lineWrap} className="text-5xl font-bold leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
            {HEADLINE.map((l) => (
              <span key={l} className="block overflow-hidden pb-[0.05em]">
                <motion.span variants={line} className="block">
                  {l}
                </motion.span>
              </span>
            ))}
          </motion.h1>

          <motion.p variants={fade} className="mt-7 max-w-md text-lg leading-relaxed text-mist">
            Convert public ERC-20s into confidential ERC-7984 wrappers. Balances live encrypted on-chain — only you can
            decrypt yours.
          </motion.p>

          <motion.div variants={fade} className="mt-9 flex items-center gap-5">
            <Magnetic>
              <a
                href={APP_URL}
                className="inline-flex h-12 items-center rounded-full bg-zama px-7 font-bold text-black transition-opacity hover:opacity-90"
              >
                Launch app
              </a>
            </Magnetic>
            <a href={GITHUB_URL} className="text-sm font-semibold text-mist transition-colors hover:text-paper">
              View on GitHub →
            </a>
          </motion.div>
        </motion.div>

        <div className="flex justify-center lg:justify-end" style={{ perspective: 1000 }}>
          <DecryptCard />
        </div>
      </div>
    </section>
  );
}
