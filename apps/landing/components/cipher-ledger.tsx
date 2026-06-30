"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, useInView, useReducedMotion } from "motion/react";

const HEX = "0123456789abcdef";
const hex = (n: number) => Array.from({ length: n }, () => HEX[Math.floor(Math.random() * 16)]).join("");
const handle = () => `0x${hex(4)}…${hex(4)}`;

const ROWS = [
  { s: "cUSDC", src: "/tokens/USDC.png" },
  { s: "cWETH", src: "/tokens/WETH.png", you: true },
  { s: "cXAUt", src: "/tokens/XAUt.png" },
  { s: "cUSDT", src: "/tokens/USDT.png" },
];
const FINAL = "12.84";

export function CipherLedger() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const reduce = useReducedMotion();
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const [ciphers] = useState(() => ROWS.map(() => handle()));
  const [revealed, setRevealed] = useState(false);
  const [amount, setAmount] = useState("0x••••");

  const decrypt = useCallback(() => {
    if (reduce) {
      setAmount(FINAL);
      setRevealed(true);
      return;
    }
    let t = 0;
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(() => {
      t += 1;
      if (t > 14) {
        if (timer.current) clearInterval(timer.current);
        setAmount(FINAL);
        setRevealed(true);
        return;
      }
      setAmount(hex(5));
    }, 55);
  }, [reduce]);

  useEffect(() => {
    if (inView) decrypt();
  }, [inView, decrypt]);
  useEffect(() => () => void (timer.current && clearInterval(timer.current)), []);

  return (
    <div ref={ref} className="w-full max-w-sm">
      <div className="flex items-center justify-between pb-4">
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-mist">What the chain sees</span>
        <span className="h-1.5 w-1.5 rounded-full bg-zama" />
      </div>
      <div className="border-t border-line">
        {ROWS.map((r, i) => (
          <div
            key={r.s}
            className="flex items-center justify-between border-b border-line py-4"
          >
            <span className="flex items-center gap-3">
              <Image src={r.src} alt="" width={26} height={26} className="rounded-full" />
              <span className={`font-medium ${r.you ? "text-paper" : "text-mist"}`}>{r.s}</span>
              {r.you && (
                <span className="rounded-full bg-zama/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-zama">
                  you
                </span>
              )}
            </span>
            {r.you ? (
              <motion.span
                className="font-mono text-lg font-bold tabular-nums"
                animate={{ filter: revealed || reduce ? "blur(0px)" : "blur(6px)" }}
                transition={{ duration: 0.4 }}
              >
                {revealed ? `${FINAL} cWETH` : amount}
              </motion.span>
            ) : (
              <span className="font-mono text-sm text-mist/70">{ciphers[i]}</span>
            )}
          </div>
        ))}
      </div>
      <p className="pt-4 text-xs text-mist">Encrypted handles on-chain. Only your row is yours to read.</p>
    </div>
  );
}
