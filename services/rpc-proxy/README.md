# @cwr/rpc-proxy

A minimal JSON-RPC proxy. It keeps your private upstream RPC URL (dRPC, Alchemy, etc.)
on the server and only serves the browser origins you allowlist. Zero runtime deps.

## Why

Putting a keyed RPC URL in `NEXT_PUBLIC_*` ships the key to every visitor. This proxy
holds the keyed URL server-side; the frontend talks to the proxy instead.

## Run

```bash
cp .env.example .env
# edit .env: set RPC_URL_<chainId> and ALLOWED_ORIGINS
npm run dev -w @cwr/rpc-proxy     # or: npm run start -w @cwr/rpc-proxy
```

## Config (env)

| Var                | Meaning                                                      |
| ------------------ | ----------------------------------------------------------- |
| `PORT`             | Listen port (default `8788`).                               |
| `RPC_URL_1`        | Private upstream for Ethereum mainnet.                      |
| `RPC_URL_11155111` | Private upstream for Sepolia.                               |
| `ALLOWED_ORIGINS`  | Comma-separated browser origins. Empty = allow all (dev).   |

## Endpoints

- `POST /rpc/<chainId>` forwards the JSON-RPC body to the configured upstream.
- `GET /health` returns `{ ok, chains }`.

## Use from the app

Point the app's RPC env at the proxy (per chain):

```
NEXT_PUBLIC_SEPOLIA_RPC=http://localhost:8788/rpc/11155111
NEXT_PUBLIC_MAINNET_RPC=http://localhost:8788/rpc/1
```

The SDK's `rpcUrls()` puts this first and keeps the public nodes as fallbacks, so if
the proxy is down the app still works.

## Notes

- Origin allowlisting is enforced for browser requests (they send `Origin`). Non-browser
  callers (curl, server-side) have no `Origin` and are not blocked by CORS, which is a
  browser mechanism. For hard server-side limits, put this behind a gateway or add an
  auth header.
