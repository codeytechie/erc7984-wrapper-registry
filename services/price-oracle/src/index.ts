import { createServer } from "node:http";
import { COINGECKO_API_KEY, COINGECKO_IDS, PORT, STABLE_USD, TTL_MS } from "./config";

type Prices = Record<string, number>;

let cache: { at: number; data: Prices } | null = null;
let inflight: Promise<Prices> | null = null;

async function fetchUpstream(): Promise<Prices> {
  const ids = [...new Set(Object.values(COINGECKO_IDS))].join(",");
  const data: Prices = { ...STABLE_USD, ...(cache?.data ?? {}) };
  const headers: Record<string, string> = COINGECKO_API_KEY ? { "x-cg-demo-api-key": COINGECKO_API_KEY } : {};
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`,
      { headers },
    );
    if (res.ok) {
      const json = (await res.json()) as Record<string, { usd?: number }>;
      for (const [sym, id] of Object.entries(COINGECKO_IDS)) {
        const p = json[id]?.usd;
        if (typeof p === "number") data[sym] = p;
      }
    }
  } catch {
    // keep fallbacks / last good cache
  }
  return data;
}

// single-flight + TTL cache so concurrent requests never fan out upstream
async function getPrices(): Promise<Prices> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.data;
  if (!inflight) {
    inflight = fetchUpstream()
      .then((data) => {
        cache = { at: Date.now(), data };
        return data;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

const server = createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const path = (req.url ?? "/").split("?")[0];

  if (path === "/health") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  if (path === "/prices") {
    const prices = await getPrices();
    res.writeHead(200, { "content-type": "application/json", "cache-control": "public, max-age=60" });
    res.end(JSON.stringify({ prices }));
    return;
  }

  res.writeHead(404, { "content-type": "application/json" });
  res.end(JSON.stringify({ error: "not found" }));
});

server.listen(PORT, () => {
  console.log(`price-oracle listening on :${PORT}`);
});
