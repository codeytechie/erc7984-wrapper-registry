import { existsSync } from "node:fs";

// load a local .env if present; shell env still applies
if (existsSync(".env")) process.loadEnvFile(".env");

// chainId -> private upstream url, from any RPC_URL_<chainId> env var
export const RPC_URLS: Record<string, string> = Object.fromEntries(
  Object.entries(process.env).flatMap(([k, v]) => {
    const m = k.match(/^RPC_URL_(\d+)$/);
    return m && v ? [[m[1], v] as [string, string]] : [];
  }),
);

// allowed browser origins; empty = allow all (dev)
export const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

export const PORT = Number(process.env.PORT ?? 8788);

// zama relayer proxy: keeps the mainnet relayer api key server-side
export const ZAMA_RELAYER_URL = process.env.ZAMA_RELAYER_URL ?? "https://relayer.mainnet.zama.org/v2";
export const ZAMA_API_KEY = process.env.ZAMA_API_KEY ?? "";
