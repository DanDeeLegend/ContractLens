/** Core domain types for ContractLens: the shape of decoded on-chain data shown in the UI. */

export type TransactionStatus = "success" | "failed";

/** A single decoded input parameter passed to a contract function. */
export interface DecodedParam {
  name: string;
  type: string;
  value: string;
}

/** A single decoded event emitted by the monitored contract. */
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
