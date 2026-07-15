/**
 * Core domain types for ContractLens.
 *
 * These describe the shape of on-chain data once real RPC/decoding
 * services are wired up. For now they are populated from mock data
 * (see src/data/mockTransactions.ts).
 */

export type TransactionStatus = "success" | "failed";

/** A single decoded input parameter passed to a contract function. */
export interface DecodedParam {
  name: string;
  type: string;
  value: string;
}

/** A single monitored interaction with the contract. */
export interface Transaction {
  id: string;
  hash: string;
  functionName: string;
  caller: string;
  timestamp: string; // ISO 8601
  blockNumber: number;
  gasUsed: number;
  status: TransactionStatus;
  params: DecodedParam[];
}

/** Metadata about the contract currently being monitored. */
export interface Contract {
  address: string;
  name: string;
  network: string;
  deployedBlock: number;
}

/** Aggregate stats shown on the dashboard status cards. */
export interface DashboardStats {
  contractAddress: string;
  latestBlock: number;
  totalTransactions: number;
  activeListeners: number;
  connectionStatus: ConnectionState;
}

export type ConnectionState = "connected" | "connecting" | "disconnected";

export interface ConnectionStatus {
  state: ConnectionState;
  network: string;
  lastSyncedAt: string; // ISO 8601
}

/** Filter applied to the transaction table. */
export type TransactionFilter = "all" | "success" | "failed";

/** Sidebar navigation destinations. */
export type NavRoute = "dashboard" | "transactions" | "settings" | "about";
