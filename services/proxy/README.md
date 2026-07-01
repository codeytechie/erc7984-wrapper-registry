# @cwr/proxy

A minimal server-side proxy for two things, so private keys never reach the browser:

1. **JSON-RPC** — forwards to your private upstream RPC URL (dRPC, Alchemy, etc.).
2. **Zama relayer** — forwards to the mainnet relayer with the gated API key injected.

Origin-allowlisted, zero runtime deps.

## Why

Putting a keyed RPC URL or the Zama relayer API key in `NEXT_PUBLIC_*` ships the secret
to every visitor. This proxy holds the secrets server-side; the frontend talks to the
proxy instead.

## Run

```bash
cp .env.example .env
# edit .env: RPC_URL_<chainId>, ALLOWED_ORIGINS, and (for mainnet decrypt) ZAMA_API_KEY
npm run dev -w @cwr/proxy     # or: npm run start -w @cwr/proxy
```

## Config (env)

| Var                | Meaning                                                          |
| ------------------ | --------------------------------------------------------------- |
| `PORT`             | Listen port (default `8788`).                                    |
| `RPC_URL_<chainId>`| Private upstream RPC per chain (e.g. `RPC_URL_1`, `RPC_URL_11155111`). |
| `ALLOWED_ORIGINS`  | Comma-separated browser origins. Empty = allow all (dev).        |
| `ZAMA_RELAYER_URL` | Upstream relayer base (default mainnet `.../v2`).                |
| `ZAMA_API_KEY`     | Mainnet relayer key, injected as `x-api-key`. Blank = relayer route off. |

## Endpoints

- `POST /rpc/<chainId>` forwards the JSON-RPC body to the configured upstream.
- `ALL /relayer/*` forwards to `ZAMA_RELAYER_URL/*` with the API key injected.
- `GET /health` returns `{ ok, chains, relayer }`.

## Use from the app

```
NEXT_PUBLIC_RPC_PROXY=http://localhost:8788
NEXT_PUBLIC_RELAYER_PROXY=http://localhost:8788/relayer
```

The SDK puts the RPC proxy first and keeps public nodes as fallbacks; the relayer proxy
is used for mainnet decrypt/reveal. If the proxy is down, RPC still falls back to public
nodes (relayer has no fallback — mainnet decrypt needs the key).

## Notes

- Origin allowlisting is enforced for browser requests (they send `Origin`). Non-browser
  callers (curl, server-side) have no `Origin` and are not blocked by CORS, which is a
  browser mechanism. For hard server-side limits, put this behind a gateway or add auth.
- Apply for a mainnet relayer key at https://forms.gle/jq84zEek1oiv3kBz9 (testnet is open).
