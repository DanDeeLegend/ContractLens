/**
 * logScanner
 *
 * Walks backwards from the chain tip in block windows, collecting logs until it has
 * enough or runs out of lookback. Pure logic (the log fetcher is injected) so it can be
 * unit-tested without a network.
 *
 * Why it exists: providers cap eth_getLogs ranges (Alchemy's free tier allows only 10
 * blocks per call). The scanner starts wide and, when a provider says "up to a N block
 * range", shrinks to N and carries on, instead of failing or silently returning nothing.
 */

export interface ScanOptions<L> {
  /** Fetches logs for an inclusive block range. */
  getLogs: (fromBlock: number, toBlock: number) => Promise<L[]>;
  /** Chain tip to scan back from. */
  latestBlock: number;
  /** How many blocks to look back at most. */
  lookbackBlocks: number;
  /** Stop early once at least this many logs are collected. */
  targetLogs: number;
  /** First window size to try. */
  initialWindow?: number;
  /** Parallel getLogs calls per round. */
  concurrency?: number;
  /** Hard cap on getLogs calls, bounding provider cost. */
  maxCalls?: number;
}

export interface ScanResult<L> {
  /** Newest first. */
  logs: L[];
  fromBlock: number;
  toBlock: number;
  scannedBlocks: number;
  /** Window size that ended up working (useful for the UI and for tuning). */
  window: number;
  calls: number;
}

/** Reads "up to a 10 block range" style limits out of provider error messages. */
export function parseRangeLimit(error: unknown): number | null {
  const message = error instanceof Error ? error.message : String(error ?? "");
  const exact = /up to a (\d+) block range/i.exec(message);
  if (exact) return Math.max(1, Number(exact[1]));
  // Generic range complaints carry no number: tell the caller to try something smaller.
  if (/block range|range is too (large|wide)|too many blocks|exceed.*range|more than \d+ results/i.test(message)) return 0;
  return null;
}

export async function scanLogs<L>(opts: ScanOptions<L>): Promise<ScanResult<L>> {
  const { getLogs, latestBlock, lookbackBlocks, targetLogs } = opts;
  const concurrency = opts.concurrency ?? 6;
  const maxCalls = opts.maxCalls ?? 250;
  const minBlock = Math.max(latestBlock - lookbackBlocks + 1, 0);

  let window = Math.max(opts.initialWindow ?? 1_000, 1);
  let cursor = latestBlock; // highest block not yet scanned
  let calls = 0;
  const logs: L[] = [];

  while (cursor >= minBlock && logs.length < targetLogs && calls < maxCalls) {
    // Plan one round of non-overlapping windows, newest first.
    const ranges: Array<[number, number]> = [];
    let next = cursor;
    while (ranges.length < concurrency && next >= minBlock && calls + ranges.length < maxCalls) {
      const from = Math.max(next - window + 1, minBlock);
      ranges.push([from, next]);
      next = from - 1;
    }

    const settled = await Promise.allSettled(ranges.map(([from, to]) => getLogs(from, to)));
    calls += ranges.length;

    // If any window hit a range limit, shrink and retry the same blocks.
    let stated: number | null = null; // a limit the provider named ("up to a 10 block range")
    let unspecified = false; // "range too large" with no number
    for (const s of settled) {
      if (s.status !== "rejected") continue;
      const parsed = parseRangeLimit(s.reason);
      if (parsed === null) throw s.reason; // a real failure (network, auth): surface it
      if (parsed > 0) stated = stated === null ? parsed : Math.min(stated, parsed);
      else unspecified = true;
    }
    if (stated !== null || unspecified) {
      const halved = Math.floor(window / 2);
      const shrunk = stated !== null && unspecified ? Math.min(stated, halved) : (stated ?? halved);
      if (shrunk < 1 || shrunk >= window) throw new Error("Provider rejected the log range even at the smallest window");
      window = shrunk;
      continue;
    }

    for (const s of settled) if (s.status === "fulfilled") logs.push(...s.value);
    cursor = next;
  }

  const scannedFrom = Math.max(cursor + 1, minBlock);
  return {
    logs,
    fromBlock: scannedFrom,
    toBlock: latestBlock,
    scannedBlocks: latestBlock - scannedFrom + 1,
    window,
    calls,
  };
}
