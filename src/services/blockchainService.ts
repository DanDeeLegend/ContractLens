import { ethers } from "ethers";
import type { Transaction, TransactionStatus } from "../types";
import { getProvider, getLogs, getTransaction, getTransactionReceipt } from "./rpcService";
import { createInterface, decodeLog } from "./decoderService";

/**
 * blockchainService
 *
 * Single entry point the UI (or a data hook) calls to get real
 * Transaction[] data for the monitored contract — composing rpcService
 * (raw chain access) and decoderService (ABI decoding) behind one
 * interface, per the architecture the placeholder files described.
 */

/** The single contract this dashboard monitors. Configure via .env. */
export const CONTRACT_ADDRESS = (import.meta.env.VITE_CONTRACT_ADDRESS as string | undefined) ?? "";

/**
 * Default ABI: standard ERC20 + Ownable + Pausable events. Swap this for
 * the real contract's ABI (e.g. `import abi from "../abi/VaultToken.json"`)
 * once it's available — decodeLog() falls back to "Unknown" gracefully
 * for any log signature not present here, so an incomplete ABI degrades
 * rather than breaks.
 */
export const DEFAULT_ABI: ethers.InterfaceAbi = [
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
  "event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)",
  "event Paused(address account)",
  "event Unpaused(address account)",
];

export interface FetchHistoryOptions {
  /** Contract to monitor. Defaults to CONTRACT_ADDRESS. */
  contractAddress?: string;
  /** ABI used to decode logs. Defaults to DEFAULT_ABI. */
  abi?: ethers.InterfaceAbi;
  /** Start of the block range. Negative numbers mean "N blocks before toBlock". Default: last 5,000 blocks. */
  fromBlock?: number;
  /** End of the block range. Default: chain tip. */
  toBlock?: number;
  /** Max concurrent getTransaction/getTransactionReceipt/getBlock calls. Default: 5. */
  concurrency?: number;
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
    const block = await getProvider().getBlock(blockNumber);
    unixSeconds = block?.timestamp ?? Math.floor(Date.now() / 1000);
    blockTimestampCache.set(blockNumber, unixSeconds);
  }
  return new Date(unixSeconds * 1000).toISOString();
}

/**
 * Converts one raw log into the app's Transaction shape.
 * Per requirement #9: if decoding fails, we still return hash/block/timestamp
 * with functionName "Unknown" rather than dropping the row.
 */
async function logToTransaction(iface: ethers.Interface, log: ethers.Log): Promise<Transaction> {
  const decoded = decodeLog(iface, log);

  // Timestamp, caller, and status all need extra RPC calls beyond the log itself.
  const [timestamp, tx, receipt] = await Promise.all([
    resolveTimestamp(log.blockNumber),
    getTransaction(log.transactionHash).catch(() => null),
    getTransactionReceipt(log.transactionHash).catch(() => null),
  ]);

  const status: TransactionStatus = receipt?.status === 0 ? "failed" : "success";
  // The log's own `.address` is the contract, not the caller — the real
  // caller is the transaction's `from`. Fall back to the contract address
  // only if the transaction lookup itself failed.
  const caller = tx?.from ?? log.address;

  return {
    id: `${log.transactionHash}-${log.index}`,
    hash: log.transactionHash,
    functionName: decoded.name,
    caller,
    timestamp,
    blockNumber: log.blockNumber,
    gasUsed: receipt ? Number(receipt.gasUsed) : 0,
    status,
    params: decoded.params,
  };
}

/**
 * Fetches and decodes historical interactions with the monitored contract.
 * Returns objects fully compatible with the existing Transaction type, so
 * TransactionTable / TransactionRow / TransactionDetailsModal need no changes.
 */
export async function fetchTransactionHistory(options: FetchHistoryOptions = {}): Promise<Transaction[]> {
  console.log("OPTIONS RECEIVED:", options);

  
  const {
    contractAddress = CONTRACT_ADDRESS,
    abi = DEFAULT_ABI,
    toBlock,
    fromBlock,
    concurrency = 5,
  } = options;

  if (!contractAddress) {
    throw new Error(
      "No contract address configured. Set VITE_CONTRACT_ADDRESS in .env, or pass contractAddress explicitly."
    );
  }

  const provider = getProvider();
  const resolvedToBlock = toBlock ?? (await provider.getBlockNumber());
  const resolvedFromBlock = fromBlock ?? Math.max(resolvedToBlock - 9, 0);  console.log("Watching contract:", contractAddress);
  console.log("Block range:", resolvedFromBlock, "to", resolvedToBlock);
  
  const logs = await getLogs({
    address: contractAddress,
    fromBlock: resolvedFromBlock,
    toBlock: resolvedToBlock,
  });
  
  console.log("Found logs:", logs.length);
  console.log("RAW LOGS:", logs);

  const iface = createInterface(abi);
  const transactions = await mapWithConcurrency(
    logs,
    concurrency,
    (log) => logToTransaction(iface, log)
  );
  // Newest first, matching the ordering the mock data previously provided.
  return transactions.sort((a, b) => b.blockNumber - a.blockNumber || b.id.localeCompare(a.id));
}

/** Clears the in-memory block-timestamp cache. Mainly useful for tests. */
export function clearTimestampCache(): void {
  blockTimestampCache.clear();
}
