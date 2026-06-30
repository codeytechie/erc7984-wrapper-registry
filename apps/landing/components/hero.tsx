"use client";
import { motion, type Variants } from "motion/react";
import { Magnetic } from "./magnetic";
import { CipherLedger } from "./cipher-ledger";
import { APP_URL, GITHUB_URL } from "@/lib/links";

const container: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.09, delayChildren: 0.15 } } };
const lineWrap: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.12 } } };
const line: Variants = { hidden: { y: "115%" }, show: { y: "0%", transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] } } };
const fade: Variants = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } } };

const HEADLINE = ["Wrap any token.", "Keep the amount", "to yourself."];

export function Hero() {
  return (
    <section id="top" className="relative mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 pt-32 pb-24">
      <div className="bloom pointer-events-none absolute inset-0 -z-10" />
      <div className="grid items-center gap-16 lg:grid-cols-[1.05fr_0.95fr]">
        <motion.div variants={container} initial="hidden" animate="show">
          <motion.p
            variants={fade}
            className="mb-7 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-mist"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-zama" />
            ERC-7984 · Zama FHE
          </motion.p>

          <motion.h1
            variants={lineWrap}
            className="text-[3.25rem] font-bold leading-[0.92] tracking-[-0.02em] sm:text-7xl"
          >
            {HEADLINE.map((l) => (
              <span key={l} className="block overflow-hidden pb-[0.06em]">
                <motion.span variants={line} className="block">
                  {l}
                </motion.span>
              </span>
            ))}
          </motion.h1>

          <motion.p variants={fade} className="mt-8 max-w-md text-lg leading-relaxed text-mist">
            Public ERC-20s become confidential ERC-7984 wrappers. The amount lives encrypted on-chain — only your key
            decrypts it.
          </motion.p>

          <motion.div variants={fade} className="mt-10 flex items-center gap-6">
            <Magnetic>
              <a
                href={APP_URL}
                data-cursor
                className="inline-flex h-12 items-center rounded-full bg-zama px-7 font-bold text-black transition-opacity hover:opacity-90"
              >
                Launch app
              </a>
            </Magnetic>
            <a
              href={GITHUB_URL}
              data-cursor
              className="text-sm font-semibold text-mist transition-colors hover:text-paper"
            >
              View on GitHub →
            </a>
          </motion.div>
        </motion.div>

        <motion.div
          className="flex justify-center lg:justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          <CipherLedger />
        </motion.div>
      </div>

      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 font-mono text-[11px] uppercase tracking-[0.2em] text-mist"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 1 }}
      >
        scroll
      </motion.div>
    </section>
  );
}
