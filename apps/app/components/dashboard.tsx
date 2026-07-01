"use client";
import { useMode } from "@/app/providers";
import { Header } from "./header";
import { Portfolio } from "./portfolio";

export function Dashboard() {
  const { chainId } = useMode();
  return (
    <div className="flex min-h-full flex-col">
      <Header />
      <main className="mx-auto w-full max-w-5xl px-6 py-10">
        {/* key by chain: reset state on mode switch */}
        <Portfolio key={chainId} />
      </main>
    </div>
  );
}
