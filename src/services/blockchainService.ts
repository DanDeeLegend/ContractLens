import { ethers } from "ethers";
import type { Transaction, TransactionStatus } from "../types";
import {
  getLatestBlockNumber,
  getLogs,
  getBlockTimestamp,
  getTransaction,
  getTransactionReceipt,
} from "./rpcService";
import { createInterface, decodeLog } from "./decoderService";
import { scanLogs } from "./logScanner";

/**
 * blockchainService
 *
 * The single entry point the UI uses to get Transaction[] for a contract. It composes
 * rpcService (raw chain access through the /api/rpc proxy), logScanner (windowed
 * eth_getLogs that adapts to provider limits) and decoderService (ABI decoding).
 */

/** Public demo contract for the landing page's "Try Demo Contract" button (not a secret). */
export const DEMO_CONTRACT_ADDRESS = (import.meta.env.VITE_CONTRACT_ADDRESS as string | undefined) ?? "";

/**
 * Default ABI: standard ERC-20 + Ownable + Pausable events. Logs whose signature is not in the
 * ABI still appear, labelled "Unknown", so an incomplete ABI degrades instead of hiding activity.
 */
export const DEFAULT_ABI: ethers.InterfaceAbi = [
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
  "event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)",
  "event Paused(address account)",
  "event Unpaused(address account)",
];

export interface FetchHistoryOptions {
  contractAddress: string;
  /** ABI used to decode logs. Defaults to DEFAULT_ABI. */
  abi?: ethers.InterfaceAbi;
  /** Blocks to look back from the chain tip at most. Default 2,000 (about 6.7 hours on Sepolia). */
  lookbackBlocks?: number;
  /** Stop scanning once this many events were found. Default 50. */
  targetLogs?: number;
  /** Max concurrent RPC calls. Default 6. */
  concurrency?: number;
}

export interface HistoryResult {
  /** Newest first. */
  transactions: Transaction[];
  fromBlock: number;
  toBlock: number;
  scannedBlocks: number;
  /** The getLogs window the provider allowed (small windows mean a rate-limited plan). */
  window: number;
}

/** Runs async tasks with bounded concurrency so we don't flood the RPC provider. */
async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;

  async function worker() {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await fn(items[index]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

const blockTimestampCache = new Map<number, number>();

async function resolveTimestamp(blockNumber: number): Promise<string> {
  let unixSeconds = blockTimestampCache.get(blockNumber);
  if (unixSeconds === undefined) {
    unixSeconds = (await getBlockTimestamp(blockNumber)) ?? Math.floor(Date.now() / 1000);
    blockTimestampCache.set(blockNumber, unixSeconds);
  }
  return new Date(unixSeconds * 1000).toISOString();
}

type Lookup = { tx: ethers.TransactionResponse | null; receipt: ethers.TransactionReceipt | null };

/**
 * Converts one raw log into the app's Transaction shape. If decoding fails the row is still
 * returned (hash, block, time) with functionName "Unknown" rather than being dropped.
 */
async function logToTransaction(
  iface: ethers.Interface,
  log: ethers.Log,
  lookups: Map<string, Promise<Lookup>>,
): Promise<Transaction> {
  const decoded = decodeLog(iface, log);

  // Several events can share one transaction: look it up once.
  let lookup = lookups.get(log.transactionHash);
  if (!lookup) {
    lookup = Promise.all([
      getTransaction(log.transactionHash).catch(() => null),
      getTransactionReceipt(log.transactionHash).catch(() => null),
    ]).then(([tx, receipt]) => ({ tx, receipt }));
    lookups.set(log.transactionHash, lookup);
  }
  const [timestamp, { tx, receipt }] = await Promise.all([resolveTimestamp(log.blockNumber), lookup]);

  // Receipts are only used for status and gas; a reverted transaction emits no logs, so rows
  // found through logs are normally "success".
  const status: TransactionStatus = receipt?.status === 0 ? "failed" : "success";

  return {
    id: `${log.transactionHash}-${log.index}`,
    hash: log.transactionHash,
    functionName: decoded.name,
    // The log's own `.address` is the contract, not the caller. The caller is the transaction's `from`.
    caller: tx?.from ?? log.address,
    timestamp,
    blockNumber: log.blockNumber,
    gasUsed: receipt ? Number(receipt.gasUsed) : 0,
    status,
    params: decoded.params,
  };
}

/** Fetches and decodes recent events emitted by a contract, newest first. */
export async function fetchTransactionHistory(options: FetchHistoryOptions): Promise<HistoryResult> {
  const { contractAddress, abi = DEFAULT_ABI, lookbackBlocks = 2_000, targetLogs = 50, concurrency = 6 } = options;

  if (!ethers.isAddress(contractAddress)) {
    throw new Error("Not a valid contract address.");
  }

  const latestBlock = await getLatestBlockNumber();
  const scan = await scanLogs<ethers.Log>({
    getLogs: (fromBlock, toBlock) => getLogs({ address: contractAddress, fromBlock, toBlock }),
    latestBlock,
    lookbackBlocks,
    targetLogs,
    concurrency,
  });

  const iface = createInterface(abi);
  const lookups = new Map<string, Promise<Lookup>>();
  const transactions = await mapWithConcurrency(scan.logs, concurrency, (log) => logToTransaction(iface, log, lookups));

  transactions.sort((a, b) => b.blockNumber - a.blockNumber || b.id.localeCompare(a.id));

  return {
    transactions: transactions.slice(0, 200),
    fromBlock: scan.fromBlock,
    toBlock: scan.toBlock,
    scannedBlocks: scan.scannedBlocks,
    window: scan.window,
  };
}

/** Clears the in-memory block-timestamp cache. Mainly useful for tests. */
export function clearTimestampCache(): void {
  blockTimestampCache.clear();
}
