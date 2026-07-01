"use client";
import { useDisconnect } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { useMode, type Mode } from "@/app/providers";
import { cn } from "@/lib/utils";

const MODES: Mode[] = ["testnet", "mainnet"];

export function ModeToggle() {
  const { mode, setMode } = useMode();
  const { disconnect } = useDisconnect();
  const qc = useQueryClient();

  const switchTo = (m: Mode) => {
    if (m === mode) return;
    disconnect(); // reconnect on the target network
    qc.clear(); // drop volatile state
    setMode(m);
  };

  return (
    <div className="inline-flex h-9 items-center rounded-lg border bg-card p-1 text-sm">
      {MODES.map((m) => (
        <button
          key={m}
          onClick={() => switchTo(m)}
          className={cn(
            "flex h-7 items-center rounded-md px-3 capitalize transition-colors",
            mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {m}
        </button>
      ))}
    </div>
  );
}
