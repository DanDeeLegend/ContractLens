/**
 * /api/rpc: server-side JSON-RPC proxy.
 *
 * The browser never sees the provider URL (which contains the API key). It posts JSON-RPC
 * here; this function checks the request, forwards it to RPC_URL, and relays the answer.
 *
 * Guard rails, because a public RPC proxy is otherwise a free key for anyone to burn:
 *  - read-only method allowlist (no sends, no admin/debug/trace methods)
 *  - same-origin only (browsers send Origin on POST; cross-site callers are refused)
 *  - small body, small batches, bounded eth_getLogs ranges
 *  - best-effort per-IP rate limit (serverless instances don't share memory, so also add
 *    a Vercel Firewall rate-limit rule for a hard limit)
 *  - the key is scrubbed from anything relayed back, and upstream failures are generic
 *
 * Runs on Vercel as a standalone function (default-export fetch handler) and in `vite dev`
 * through the middleware in vite.config.ts.
 */

const ALLOWED_METHODS = new Set([
  "eth_chainId",
  "net_version",
  "eth_blockNumber",
  "eth_getBlockByNumber",
  "eth_getLogs",
  "eth_getTransactionByHash",
  "eth_getTransactionReceipt",
  "eth_call",
]);

const MAX_BODY_BYTES = 32 * 1024;
const MAX_BATCH = 25;
const MAX_LOG_RANGE = 5_000;
const UPSTREAM_TIMEOUT_MS = 10_000;
const RATE_LIMIT = { windowMs: 60_000, max: 240 };

const hits = new Map<string, { count: number; resetAt: number }>();

function rateLimited(ip: string, now = Date.now()): boolean {
  const entry = hits.get(ip);
  if (!entry || entry.resetAt <= now) {
    hits.set(ip, { count: 1, resetAt: now + RATE_LIMIT.windowMs });
    // Keep the map from growing without bound on a long-lived instance.
    if (hits.size > 5_000) for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT.max;
}

function reply(status: number, body: unknown, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      ...extra,
    },
  });
}

const rpcError = (status: number, code: number, message: string, id: unknown = null, extra = {}) =>
  reply(status, { jsonrpc: "2.0", id, error: { code, message } }, extra);

type RpcCall = { jsonrpc: "2.0"; id: string | number | null; method: string; params: unknown[] };

function blockNumber(tag: unknown): number | null {
  return typeof tag === "string" && /^0x[0-9a-f]+$/i.test(tag) ? Number.parseInt(tag, 16) : null;
}

/** Returns an error message when a call is not allowed, otherwise null. */
function validateCall(call: unknown): string | null {
  if (typeof call !== "object" || call === null) return "Invalid request";
  const c = call as Partial<RpcCall>;
  if (c.jsonrpc !== "2.0") return "Invalid request";
  if (!(c.id === null || typeof c.id === "string" || typeof c.id === "number")) return "Invalid request";
  if (typeof c.method !== "string" || !ALLOWED_METHODS.has(c.method)) return "Method not allowed";
  if (c.params !== undefined && !Array.isArray(c.params)) return "Invalid params";

  if (c.method === "eth_getLogs") {
    const filter = (c.params?.[0] ?? {}) as { fromBlock?: unknown; toBlock?: unknown; address?: unknown };
    if (typeof filter.address !== "string" || !/^0x[0-9a-f]{40}$/i.test(filter.address)) {
      return "eth_getLogs requires a single contract address";
    }
    // Both ends must be concrete so the range can be bounded ("latest" or "earliest" could span the chain).
    const from = blockNumber(filter.fromBlock);
    const to = blockNumber(filter.toBlock);
    if (from === null || to === null) return "fromBlock and toBlock must be hex block numbers";
    if (to < from || to - from > MAX_LOG_RANGE) return `Block range must be 0-${MAX_LOG_RANGE} blocks`;
  }
  return null;
}

/** Removes the provider URL and its key from text that is about to be sent to a browser. */
function scrub(text: string, rpcUrl: string): string {
  let out = text.split(rpcUrl).join("[redacted]");
  try {
    const key = new URL(rpcUrl).pathname.split("/").filter(Boolean).pop();
    if (key && key.length >= 8) out = out.split(key).join("[redacted]");
  } catch {
    // an unparsable RPC_URL will fail at the upstream call anyway
  }
  return out;
}

function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

function originAllowed(request: Request): boolean {
  if (request.headers.get("sec-fetch-site") === "cross-site") return false;
  const origin = request.headers.get("origin");
  if (!origin) return true; // same-origin GET-like navigations and server-side callers
  const extra = (process.env.ALLOWED_ORIGINS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  try {
    return new URL(origin).host === new URL(request.url).host || extra.includes(origin);
  } catch {
    return false;
  }
}

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== "POST") {
      return rpcError(405, -32600, "Use POST", null, { allow: "POST" });
    }
    if (!originAllowed(request)) return rpcError(403, -32600, "Forbidden");
    if (rateLimited(clientIp(request))) return rpcError(429, -32005, "Too many requests", null, { "retry-after": "60" });

    const rpcUrl = process.env.RPC_URL;
    if (!rpcUrl) return rpcError(500, -32603, "RPC proxy is not configured");

    const declared = Number(request.headers.get("content-length") ?? 0);
    if (declared > MAX_BODY_BYTES) return rpcError(413, -32600, "Request too large");
    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) return rpcError(413, -32600, "Request too large");

    let payload: unknown;
    try {
      payload = JSON.parse(raw);
    } catch {
      return rpcError(400, -32700, "Parse error");
    }

    const calls = Array.isArray(payload) ? payload : [payload];
    if (calls.length === 0 || calls.length > MAX_BATCH) return rpcError(400, -32600, "Invalid batch size");
    for (const call of calls) {
      const problem = validateCall(call);
      if (problem) {
        const id = typeof call === "object" && call !== null ? ((call as { id?: unknown }).id ?? null) : null;
        return rpcError(problem === "Method not allowed" ? 403 : 400, -32600, problem, id);
      }
    }

    let upstream: Response;
    try {
      upstream = await fetch(rpcUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      });
    } catch {
      return rpcError(502, -32603, "Upstream RPC unavailable");
    }

    const text = scrub(await upstream.text(), rpcUrl);
    if (upstream.status >= 500) return rpcError(502, -32603, "Upstream RPC error");
    try {
      JSON.parse(text);
    } catch {
      return rpcError(502, -32603, "Upstream RPC returned an invalid response");
    }
    return new Response(text, {
      status: upstream.status,
      headers: { "content-type": "application/json", "cache-control": "no-store", "x-content-type-options": "nosniff" },
    });
  },
};
