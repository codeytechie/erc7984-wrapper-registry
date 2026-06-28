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
    disconnect(); // reconnect on target network
    qc.clear(); // drop volatile state
    setMode(m);
  };

  return (
    <div className="inline-flex rounded-md border p-0.5 text-sm">
      {MODES.map((m) => (
        <button
          key={m}
          onClick={() => switchTo(m)}
          className={cn(
            "rounded px-3 py-1 capitalize transition-colors",
            mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground",
          )}
        >
          {m}
        </button>
      ))}
    </div>
  );
}
