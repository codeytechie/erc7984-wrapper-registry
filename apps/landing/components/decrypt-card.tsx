"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, useInView, useReducedMotion } from "motion/react";

const FINAL = "12.84";
const CHARS = "0123456789ABCDEF";
const scramble = (n: number) =>
  Array.from({ length: n }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join("");

export function DecryptCard() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const reduce = useReducedMotion();
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [display, setDisplay] = useState("••••••");

  const decrypt = useCallback(() => {
    if (reduce) {
      setDisplay(FINAL);
      setRevealed(true);
      return;
    }
    let ticks = 0;
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(() => {
      ticks += 1;
      if (ticks > 12) {
        if (timer.current) clearInterval(timer.current);
        setDisplay(FINAL);
        setRevealed(true);
        return;
      }
      setDisplay(scramble(5));
    }, 55);
  }, [reduce]);

  useEffect(() => {
    if (inView) decrypt();
  }, [inView, decrypt]);
  useEffect(() => () => void (timer.current && clearInterval(timer.current)), []);

  const reset = () => {
    if (timer.current) clearInterval(timer.current);
    setRevealed(false);
    setDisplay("••••••");
  };

  return (
    <motion.div
      ref={ref}
      className="glass grain relative w-full max-w-sm rounded-3xl p-6"
      initial={{ opacity: 0, y: 30, rotateX: 8 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-mist">Confidential balance</span>
        <span
          className={`rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${
            revealed ? "bg-zama/15 text-zama" : "bg-white/10 text-mist"
          }`}
        >
          {revealed ? "decrypted" : "encrypted"}
        </span>
      </div>

      <div className="mt-7 flex items-center justify-between">
        <span className="flex items-center gap-2.5">
          <Image src="/tokens/WETH.png" alt="" width={32} height={32} className="rounded-full" />
          <span className="font-semibold">cWETH</span>
        </span>
        <motion.span
          className="font-mono text-3xl font-bold tabular-nums"
          animate={{ filter: revealed || reduce ? "blur(0px)" : "blur(8px)", opacity: revealed ? 1 : 0.75 }}
          transition={{ duration: 0.4 }}
        >
          {display}
        </motion.span>
      </div>
      <div className="mt-1 text-right font-mono text-sm text-mist">{revealed ? "$20,394.18" : "—"}</div>

      <div className="mt-7 flex items-center justify-between border-t border-white/10 pt-4">
        <span className="text-xs text-mist">Only you hold the key · EIP-712</span>
        <button onClick={revealed ? reset : decrypt} className="text-xs font-semibold text-zama hover:underline">
          {revealed ? "Re-encrypt" : "Decrypt"}
        </button>
      </div>
    </motion.div>
  );
}
