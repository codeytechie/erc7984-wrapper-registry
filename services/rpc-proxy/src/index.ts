import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { ALLOWED_ORIGINS, PORT, RPC_URLS, ZAMA_API_KEY, ZAMA_RELAYER_URL } from "./config";

const allowAll = ALLOWED_ORIGINS.length === 0;

// sets cors headers, returns whether the origin may proceed
function applyCors(req: IncomingMessage, res: ServerResponse): boolean {
  const origin = req.headers.origin;
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", req.headers["access-control-request-headers"] ?? "content-type");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  // no origin: server-side / curl, not a browser
  if (!origin) return true;
  if (allowAll || ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    return true;
  }
  return false;
}

function readBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c: Buffer) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
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
    json(res, 200, {
      ok: true,
      chains: Object.keys(RPC_URLS).filter((id) => RPC_URLS[id]),
      relayer: ZAMA_API_KEY ? "configured" : "off",
    });
    return;
  }

  // forward relayer calls with the api key injected server-side
  if (path === "/relayer" || path.startsWith("/relayer/")) {
    if (!ZAMA_API_KEY) {
      json(res, 500, { error: "relayer proxy not configured (set ZAMA_API_KEY)" });
      return;
    }
    const rest = (req.url ?? "/relayer").slice("/relayer".length) || "/"; // keeps path + query
    const method = req.method ?? "GET";
    const headers: Record<string, string> = { "x-api-key": ZAMA_API_KEY };
    const ct = req.headers["content-type"];
    if (typeof ct === "string") headers["content-type"] = ct;
    const cookie = req.headers["cookie"];
    if (typeof cookie === "string") headers["cookie"] = cookie;
    const body = method === "GET" || method === "HEAD" ? undefined : await readBody(req);
    try {
      const up = await fetch(ZAMA_RELAYER_URL + rest, { method, headers, body });
      const buf = Buffer.from(await up.arrayBuffer());
      const out: Record<string, string | string[]> = {
        "content-type": up.headers.get("content-type") ?? "application/octet-stream",
      };
      // bind any cookie to the proxy host (drop the upstream Domain)
      const setCookies = up.headers.getSetCookie?.() ?? [];
      if (setCookies.length) out["set-cookie"] = setCookies.map((c) => c.replace(/;\s*Domain=[^;]+/i, ""));
      res.writeHead(up.status, out);
      res.end(buf);
    } catch {
      json(res, 502, { error: "relayer upstream failed" });
    }
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
  console.log(`relayer proxy: ${ZAMA_API_KEY ? `on -> ${ZAMA_RELAYER_URL}` : "off (set ZAMA_API_KEY)"}`);
});
