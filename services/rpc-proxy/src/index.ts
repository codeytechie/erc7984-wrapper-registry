import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { ALLOWED_ORIGINS, PORT, RPC_URLS } from "./config";

const allowAll = ALLOWED_ORIGINS.length === 0;

// sets cors headers, returns whether the origin may proceed
function applyCors(req: IncomingMessage, res: ServerResponse): boolean {
  const origin = req.headers.origin;
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "content-type");
  // no origin: server-side / curl, not a browser
  if (!origin) return true;
  if (allowAll || ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    return true;
  }
  return false;
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c: Buffer) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function json(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
}

const server = createServer(async (req, res) => {
  const allowed = applyCors(req, res);

  if (req.method === "OPTIONS") {
    res.writeHead(allowed ? 204 : 403);
    res.end();
    return;
  }
  if (!allowed) {
    json(res, 403, { error: "origin not allowed" });
    return;
  }

  const path = (req.url ?? "/").split("?")[0] ?? "/";

  if (path === "/health") {
    json(res, 200, { ok: true, chains: Object.keys(RPC_URLS).filter((id) => RPC_URLS[id]) });
    return;
  }

  const match = path.match(/^\/rpc\/(\d+)$/);
  if (match && req.method === "POST") {
    const upstream = RPC_URLS[match[1] ?? ""];
    if (!upstream) {
      json(res, 400, { error: `no rpc configured for chain ${match[1]}` });
      return;
    }
    try {
      const body = await readBody(req);
      const upstreamRes = await fetch(upstream, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body,
      });
      const text = await upstreamRes.text();
      res.writeHead(upstreamRes.status, { "content-type": "application/json" });
      res.end(text);
    } catch {
      json(res, 502, { error: "upstream request failed" });
    }
    return;
  }

  json(res, 404, { error: "not found" });
});

server.listen(PORT, () => {
  console.log(`rpc-proxy listening on :${PORT}`);
  console.log(allowAll ? "origins: ALL (set ALLOWED_ORIGINS to lock down)" : `origins: ${ALLOWED_ORIGINS.join(", ")}`);
});
