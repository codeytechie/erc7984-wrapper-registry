"use client";
import { useMode } from "@/app/providers";
import { ConnectBar } from "./connect-bar";
import { Portfolio } from "./portfolio";

export function Dashboard() {
  const { chainId } = useMode();
  return (
    <div className="flex min-h-full flex-col">
      <ConnectBar />
      <main className="mx-auto w-full max-w-4xl p-6 pt-20">
        {/* key by chain: reset state on mode switch */}
        <Portfolio key={chainId} />
      </main>
    </div>
  );
}
