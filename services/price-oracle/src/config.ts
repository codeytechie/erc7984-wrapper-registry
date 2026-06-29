// normalized symbol -> CoinGecko id
export const COINGECKO_IDS: Record<string, string> = {
  USDC: "usd-coin",
  USDT: "tether",
  WETH: "weth",
  XAUt: "tether-gold",
  ZAMA: "zama",
};

// baseline if the upstream is unreachable
export const STABLE_USD: Record<string, number> = { USDC: 1, USDT: 1 };

export const PORT = Number(process.env.PORT ?? 8787);
export const TTL_MS = Number(process.env.PRICE_TTL_MS ?? 60_000);
export const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY ?? "";
