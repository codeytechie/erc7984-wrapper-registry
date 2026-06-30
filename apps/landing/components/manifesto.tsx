"use client";
import { useRef } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "motion/react";

const TEXT =
  "A public chain shows everyone how much you hold. Wrapping turns the amount into ciphertext only your key can read. Transfers still settle. Balances stay yours.";

function Word({ children, progress, range }: { children: string; progress: MotionValue<number>; range: [number, number] }) {
  const opacity = useTransform(progress, range, [0.12, 1]);
  return (
    <span className="mr-[0.25em] inline-block">
      <motion.span style={{ opacity }}>{children}</motion.span>
    </span>
  );
}

export function Manifesto() {
  const container = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({ target: container, offset: ["start 0.85", "start 0.32"] });
  const words = TEXT.split(" ");
  return (
    <section className="mx-auto max-w-4xl px-6 py-40">
      <p
        ref={container}
        className="flex flex-wrap text-3xl font-semibold leading-snug tracking-tight sm:text-[2.75rem] sm:leading-[1.18]"
      >
        {words.map((w, i) => {
          const start = i / words.length;
          return (
            <Word key={i} progress={scrollYProgress} range={[start, start + 1 / words.length]}>
              {w}
            </Word>
          );
        })}
      </p>
    </section>
  );
}
