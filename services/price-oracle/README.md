# @cwr/price-oracle

Tiny standalone USD price service for the app's known tokens. Zero runtime
dependencies (Node `http` + global `fetch`). Caches upstream prices so the
frontend never hits CoinGecko directly and the API is never hammered.

## Endpoints

- `GET /prices` → `{ "prices": { "USDC": 1, "WETH": 2400.5, ... } }` (normalized symbols)
- `GET /health` → `{ "ok": true }`

CORS is open (`*`) so the browser app can call it directly.

## Caching

- In-memory TTL cache (`PRICE_TTL_MS`, default 60s).
- Single-flight: concurrent requests share one upstream call.
- Stale/stable fallback: serves the last good values (and `$1` stables) if the
  upstream is down.

## Run

```bash
npm run dev      # tsx watch, :8787
npm start        # tsx
```

Env (see `.env.example`): `PORT`, `PRICE_TTL_MS`, optional `COINGECKO_API_KEY`.

The frontend points at this via `NEXT_PUBLIC_PRICE_API` (default
`http://localhost:8787`).
