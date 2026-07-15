import { ethers } from "ethers";

/**
 * rpcService
 *
 * Thin wrapper around a single ethers v6 JsonRpcProvider. Everything else
 * in the app (decoderService, blockchainService) should go through this
 * module instead of constructing its own provider.
 */

const RPC_URL = import.meta.env.VITE_ALCHEMY_RPC_URL as string | undefined;

let cachedProvider: ethers.JsonRpcProvider | null = null;

/** Returns the shared provider, creating it on first use (lazy singleton). */
export function getProvider(): ethers.JsonRpcProvider {
  if (!cachedProvider) {
    if (!RPC_URL) {
      throw new Error(
        "Missing VITE_ALCHEMY_RPC_URL. Add it to your .env file."
      );
    }

    cachedProvider = new ethers.JsonRpcProvider(RPC_URL);
  }

  return cachedProvider;
}

/** Current chain tip. Used by the dashboard's "Latest Block" stat card. */
export async function getLatestBlockNumber(): Promise<number> {
  return getProvider().getBlockNumber();
}

/** Unix timestamp (seconds) for a given block, or null if the block can't be found. */
export async function getBlockTimestamp(
  blockNumber: number
): Promise<number | null> {
  const block = await getProvider().getBlock(blockNumber);
  return block ? block.timestamp : null;
}

/** Full transaction response — used to read `from` (the real caller). */
export async function getTransaction(
  hash: string
): Promise<ethers.TransactionResponse | null> {
  return getProvider().getTransaction(hash);
}

/** Transaction receipt — used to read status (success/failed) and gas used. */
export async function getTransactionReceipt(
  hash: string
): Promise<ethers.TransactionReceipt | null> {
  return getProvider().getTransactionReceipt(hash);
}

/**
 * Fetches historical logs for a contract within a block range.
 */
export async function getLogs(filter: {
  address: string;
  fromBlock: number | string;
  toBlock: number | string;
  topics?: (string | string[] | null)[];
}): Promise<ethers.Log[]> {
  try {
    const logs = await getProvider().getLogs(filter);

    // Safe operational logging
    console.info(`Retrieved ${logs.length} blockchain event logs.`);

    return logs;
  } catch (error) {
    // Log the error without exposing sensitive configuration
    console.error("Failed to retrieve blockchain event logs.", error);

    throw error;
  }
}

/** True once a provider has been created (does not guarantee it's reachable). */
export function isInitialized(): boolean {
  return cachedProvider !== null;
}