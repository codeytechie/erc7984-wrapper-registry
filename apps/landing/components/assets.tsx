import Image from "next/image";

const ASSETS = [
  { s: "cUSDC", src: "/tokens/USDC.png" },
  { s: "cUSDT", src: "/tokens/USDT.png" },
  { s: "cWETH", src: "/tokens/WETH.png" },
  { s: "cXAUt", src: "/tokens/XAUt.png" },
  { s: "cZAMA", src: "/tokens/ZAMA.svg" },
];

export function Assets() {
  // 4 sets so translateX(-50%) loops seamlessly and always fills the viewport
  const row = [...ASSETS, ...ASSETS, ...ASSETS, ...ASSETS];
  return (
    <section className="border-y border-white/10 py-10">
      <p className="mb-8 text-center font-mono text-xs uppercase tracking-[0.2em] text-mist">
        Confidential wrappers in the registry
      </p>
      <div className="relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]">
        <div className="marquee-track flex w-max gap-12">
          {row.map((a, i) => (
            <span key={i} className="flex items-center gap-3 whitespace-nowrap">
              <Image src={a.src} alt="" width={28} height={28} className="rounded-full" />
              <span className="font-mono text-lg text-mist">{a.s}</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
