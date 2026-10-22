import { describe, expect, it } from "vitest";
import { parseRangeLimit, scanLogs } from "../src/services/logScanner.ts";

type Log = { block: number };

/** Fake chain: one event at each of the given blocks; providers can cap the range per call. */
function fakeChain(eventBlocks: number[], maxRange = Infinity, genericError = false) {
  const requests: Array<[number, number]> = [];
  const getLogs = async (from: number, to: number): Promise<Log[]> => {
    requests.push([from, to]);
    if (to - from + 1 > maxRange) {
      throw new Error(
        genericError
          ? "query exceeds max block range"
          : `Under the Free tier plan, you can make eth_getLogs requests with up to a ${maxRange} block range.`,
      );
    }
    return eventBlocks.filter((b) => b >= from && b <= to).map((block) => ({ block }));
  };
  return { getLogs, requests };
}

describe("parseRangeLimit", () => {
  it("reads the limit out of Alchemy's free-tier message", () => {
    const err = new Error("Under the Free tier plan, you can make eth_getLogs requests with up to a 10 block range.");
    expect(parseRangeLimit(err)).toBe(10);
  });
  it("returns 0 for range complaints with no number, and null for unrelated errors", () => {
    expect(parseRangeLimit(new Error("query exceeds max block range"))).toBe(0);
    expect(parseRangeLimit(new Error("401 unauthorized"))).toBeNull();
    expect(parseRangeLimit("network down")).toBeNull();
  });
});

describe("scanLogs", () => {
  it("collects logs newest-first and reports the scanned range", async () => {
    const { getLogs } = fakeChain([995, 990, 400]);
    const r = await scanLogs({ getLogs, latestBlock: 1000, lookbackBlocks: 1000, targetLogs: 100, initialWindow: 100 });
    expect(r.logs.map((l) => l.block).sort((a, b) => b - a)).toEqual([995, 990, 400]);
    expect(r.fromBlock).toBe(1);
    expect(r.toBlock).toBe(1000);
    expect(r.scannedBlocks).toBe(1000);
  });

  it("stops early once enough logs are found", async () => {
    const { getLogs, requests } = fakeChain(Array.from({ length: 100 }, (_, i) => 1000 - i));
    const r = await scanLogs({ getLogs, latestBlock: 1000, lookbackBlocks: 100_000, targetLogs: 20, initialWindow: 50, concurrency: 2 });
    expect(r.logs.length).toBeGreaterThanOrEqual(20);
    expect(r.scannedBlocks).toBeLessThan(1000);
    expect(requests.length).toBeLessThan(10);
  });

  it("adapts to a provider that only allows a 10-block range", async () => {
    const { getLogs } = fakeChain([995, 960, 931], 10);
    const r = await scanLogs({ getLogs, latestBlock: 1000, lookbackBlocks: 100, targetLogs: 100, initialWindow: 1000 });
    expect(r.window).toBe(10);
    expect(r.logs).toHaveLength(3);
    expect(r.scannedBlocks).toBe(100);
  });

  it("halves the window when the provider complains without naming a limit", async () => {
    const { getLogs } = fakeChain([990], 40, true);
    const r = await scanLogs({ getLogs, latestBlock: 1000, lookbackBlocks: 200, targetLogs: 100, initialWindow: 400 });
    expect(r.window).toBeLessThanOrEqual(40);
    expect(r.logs).toHaveLength(1);
  });

  it("never scans below block 0 or beyond the lookback", async () => {
    const { getLogs, requests } = fakeChain([3]);
    const r = await scanLogs({ getLogs, latestBlock: 50, lookbackBlocks: 5_000, targetLogs: 100, initialWindow: 20 });
    expect(Math.min(...requests.map(([from]) => from))).toBe(0);
    expect(r.fromBlock).toBe(0);
    expect(r.logs).toHaveLength(1);
  });

  it("surfaces real failures instead of swallowing them", async () => {
    const getLogs = async () => {
      throw new Error("401 invalid api key");
    };
    await expect(scanLogs({ getLogs, latestBlock: 100, lookbackBlocks: 100, targetLogs: 10 })).rejects.toThrow("401");
  });

  it("gives up when even the smallest window is refused", async () => {
    const getLogs = async () => {
      throw new Error("block range too large");
    };
    await expect(scanLogs({ getLogs, latestBlock: 100, lookbackBlocks: 100, targetLogs: 10, initialWindow: 4 })).rejects.toThrow(
      /smallest window/,
    );
  });

  it("caps the number of provider calls", async () => {
    const { getLogs, requests } = fakeChain([]);
    await scanLogs({ getLogs, latestBlock: 100_000, lookbackBlocks: 100_000, targetLogs: 10, initialWindow: 10, maxCalls: 30 });
    expect(requests.length).toBeLessThanOrEqual(30);
  });
});
