import { beforeEach, describe, expect, it, vi } from "vitest";
import handler from "../api/rpc.ts";

const SECRET = "SECRETKEY1234567";
const RPC_URL = `https://eth-sepolia.example/v2/${SECRET}`;
const ORIGIN = "https://app.example";
const ADDRESS = "0x" + "ab".repeat(20);

let ipCounter = 0;
const nextIp = () => `10.0.${Math.floor(ipCounter / 250)}.${(ipCounter++ % 250) + 1}`;

function call(body: unknown, init: { method?: string; headers?: Record<string, string>; raw?: string; ip?: string } = {}) {
  return handler.fetch(
    new Request(`${ORIGIN}/api/rpc`, {
      method: init.method ?? "POST",
      headers: {
        "content-type": "application/json",
        origin: ORIGIN,
        "x-forwarded-for": init.ip ?? nextIp(),
        ...init.headers,
      },
      body: init.method === "GET" ? undefined : (init.raw ?? JSON.stringify(body)),
    }),
  );
}

const rpc = (method: string, params: unknown[] = [], id = 1) => ({ jsonrpc: "2.0", id, method, params });
const upstreamOk = (result: unknown = "0x1") =>
  new Response(JSON.stringify({ jsonrpc: "2.0", id: 1, result }), { status: 200 });

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  process.env.RPC_URL = RPC_URL;
  delete process.env.ALLOWED_ORIGINS;
  fetchMock = vi.fn(async () => upstreamOk());
  vi.stubGlobal("fetch", fetchMock);
});

describe("/api/rpc proxy: request validation", () => {
  it("only accepts POST", async () => {
    const res = await call(null, { method: "GET" });
    expect(res.status).toBe(405);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refuses cross-origin browsers", async () => {
    const res = await call(rpc("eth_blockNumber"), { headers: { origin: "https://evil.example" } });
    expect(res.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refuses Sec-Fetch-Site: cross-site even without an Origin match", async () => {
    const res = await call(rpc("eth_blockNumber"), { headers: { "sec-fetch-site": "cross-site" } });
    expect(res.status).toBe(403);
  });

  it("allows extra origins listed in ALLOWED_ORIGINS", async () => {
    process.env.ALLOWED_ORIGINS = "https://other.example";
    const res = await call(rpc("eth_blockNumber"), { headers: { origin: "https://other.example" } });
    expect(res.status).toBe(200);
  });

  it.each(["eth_sendRawTransaction", "eth_sendTransaction", "debug_traceTransaction", "eth_accounts", "personal_sign"])(
    "blocks %s",
    async (method) => {
      const res = await call(rpc(method));
      expect(res.status).toBe(403);
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it("rejects malformed JSON and non-JSON-RPC bodies", async () => {
    expect((await call(null, { raw: "{nope" })).status).toBe(400);
    expect((await call({ hello: "world" })).status).toBe(400);
    expect((await call({ ...rpc("eth_blockNumber"), params: "oops" })).status).toBe(400);
  });

  it("limits batch size and body size", async () => {
    const big = Array.from({ length: 26 }, (_, i) => rpc("eth_blockNumber", [], i));
    expect((await call(big)).status).toBe(400);
    expect((await call([])).status).toBe(400);
    const huge = rpc("eth_call", [{ data: "0x" + "00".repeat(40_000) }]);
    expect((await call(huge)).status).toBe(413);
  });

  it("bounds eth_getLogs", async () => {
    const hex = (n: number) => "0x" + n.toString(16);
    const ok = rpc("eth_getLogs", [{ address: ADDRESS, fromBlock: hex(100), toBlock: hex(200) }]);
    expect((await call(ok)).status).toBe(200);

    const tooWide = rpc("eth_getLogs", [{ address: ADDRESS, fromBlock: hex(0), toBlock: hex(6_000) }]);
    expect((await call(tooWide)).status).toBe(400);

    const open = rpc("eth_getLogs", [{ address: ADDRESS, fromBlock: "earliest", toBlock: "latest" }]);
    expect((await call(open)).status).toBe(400);

    const noAddress = rpc("eth_getLogs", [{ fromBlock: hex(1), toBlock: hex(2) }]);
    expect((await call(noAddress)).status).toBe(400);

    const reversed = rpc("eth_getLogs", [{ address: ADDRESS, fromBlock: hex(9), toBlock: hex(2) }]);
    expect((await call(reversed)).status).toBe(400);
  });
});

describe("/api/rpc proxy: forwarding", () => {
  it("forwards allowed calls to RPC_URL and relays the result", async () => {
    fetchMock.mockResolvedValueOnce(upstreamOk("0xabc"));
    const res = await call(rpc("eth_blockNumber"));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ result: "0xabc" });
    expect(fetchMock).toHaveBeenCalledWith(RPC_URL, expect.objectContaining({ method: "POST" }));
  });

  it("supports batches within the limit", async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify([{ id: 1, result: "0x1" }, { id: 2, result: "0x2" }])));
    const res = await call([rpc("eth_blockNumber", [], 1), rpc("net_version", [], 2)]);
    expect(res.status).toBe(200);
    expect(await res.json()).toHaveLength(2);
  });

  it("passes provider JSON-RPC errors through so the client can adapt (e.g. range limits)", async () => {
    const message = "Under the Free tier plan, you can make eth_getLogs requests with up to a 10 block range.";
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ jsonrpc: "2.0", id: 1, error: { code: -32600, message } })));
    const res = await call(rpc("eth_getLogs", [{ address: ADDRESS, fromBlock: "0x1", toBlock: "0x9" }]));
    const body = (await res.json()) as { error: { message: string } };
    expect(body.error.message).toBe(message);
  });

  it("never leaks the provider URL or key, even if the upstream echoes them", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ jsonrpc: "2.0", id: 1, error: { code: -32000, message: `bad key ${SECRET} at ${RPC_URL}` } }), {
        status: 401,
      }),
    );
    const res = await call(rpc("eth_blockNumber"));
    const text = await res.text();
    expect(text).not.toContain(SECRET);
    expect(text).not.toContain("eth-sepolia.example/v2");
    expect(text).toContain("[redacted]");
  });

  it("hides upstream failures behind a generic 502", async () => {
    fetchMock.mockResolvedValueOnce(new Response(`oops ${RPC_URL}`, { status: 500 }));
    const res = await call(rpc("eth_blockNumber"));
    expect(res.status).toBe(502);
    expect(await res.text()).not.toContain(SECRET);

    fetchMock.mockRejectedValueOnce(new Error(`connect ECONNREFUSED ${RPC_URL}`));
    const res2 = await call(rpc("eth_blockNumber"));
    expect(res2.status).toBe(502);
    expect(await res2.text()).not.toContain(SECRET);

    fetchMock.mockResolvedValueOnce(new Response("<html>not json</html>", { status: 200 }));
    expect((await call(rpc("eth_blockNumber"))).status).toBe(502);
  });

  it("fails closed when RPC_URL is not configured", async () => {
    delete process.env.RPC_URL;
    const res = await call(rpc("eth_blockNumber"));
    expect(res.status).toBe(500);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sets no-store and nosniff on responses", async () => {
    const res = await call(rpc("eth_blockNumber"));
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
  });
});

describe("/api/rpc proxy: rate limiting", () => {
  it("returns 429 after too many requests from one IP, without affecting others", async () => {
    const ip = "203.0.113.50";
    let last = 200;
    for (let i = 0; i < 241; i++) last = (await call(rpc("eth_blockNumber"), { ip })).status;
    expect(last).toBe(429);
    expect((await call(rpc("eth_blockNumber"), { ip: "203.0.113.51" })).status).toBe(200);
  });
});
