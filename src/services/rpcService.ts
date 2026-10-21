import { ethers } from "ethers";

/**
 * rpcService
 *
 * Thin wrapper around a single ethers v6 JsonRpcProvider. Everything else in the app
 * (decoderService, blockchainService) goes through this module.
 *
 * The provider talks to our own /api/rpc proxy, never to Alchemy directly, so the API
 * key lives only on the server (see api/rpc.ts).
 */

export const SEPOLIA = ethers.Network.from("sepolia");

/** Same-origin proxy path. Overridable for tests or a differently hosted proxy. */
const PROXY_PATH = (import.meta.env.VITE_RPC_PROXY_URL as string | undefined) ?? "/api/rpc";

let cachedProvider: ethers.JsonRpcProvider | null = null;

/** Returns the shared provider, creating it on first use (lazy singleton). */
export function getProvider(): ethers.JsonRpcProvider {
  if (!cachedProvider) {
    const url = new URL(PROXY_PATH, window.location.origin).toString();
    // staticNetwork skips the eth_chainId probe ethers otherwise repeats on every call.
    cachedProvider = new ethers.JsonRpcProvider(url, SEPOLIA, { staticNetwork: SEPOLIA, batchMaxCount: 10 });
  }
  return cachedProvider;
}

/** Current chain tip. */
export async function getLatestBlockNumber(): Promise<number> {
  return getProvider().getBlockNumber();
}

/** Unix timestamp (seconds) for a given block, or null if the block can't be found. */
export async function getBlockTimestamp(blockNumber: number): Promise<number | null> {
  const block = await getProvider().getBlock(blockNumber);
  return block ? block.timestamp : null;
}

/** Full transaction response, used to read `from` (the real caller). */
export async function getTransaction(hash: string): Promise<ethers.TransactionResponse | null> {
  return getProvider().getTransaction(hash);
}

/** Transaction receipt, used to read status (success/failed) and gas used. */
export async function getTransactionReceipt(hash: string): Promise<ethers.TransactionReceipt | null> {
  return getProvider().getTransactionReceipt(hash);
}

/** Historical logs for a contract within a block range. Throws on provider errors. */
export async function getLogs(filter: {
  address: string;
  fromBlock: number;
  toBlock: number;
  topics?: (string | string[] | null)[];
}): Promise<ethers.Log[]> {
  return getProvider().getLogs(filter);
}

const NAME_ABI = ["function name() view returns (string)", "function symbol() view returns (string)"];

/** Best-effort display name for a contract: ERC-20-style name(), or null when it has none. */
export async function getContractName(address: string): Promise<string | null> {
  try {
    const contract = new ethers.Contract(address, NAME_ABI, getProvider());
    const name = (await contract.name()) as string;
    return name.trim() ? name : null;
  } catch {
    return null;
  }
}

/** True once a provider has been created (does not guarantee it's reachable). */
export function isInitialized(): boolean {
  return cachedProvider !== null;
}
