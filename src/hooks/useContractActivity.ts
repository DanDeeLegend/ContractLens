import { useCallback, useEffect, useRef, useState } from "react";
import { fetchTransactionHistory } from "../services/blockchainService";
import { getContractName } from "../services/rpcService";
import type { ConnectionState, Contract, Transaction } from "../types";

export interface ContractActivity {
  contract: Contract | null;
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  connection: ConnectionState;
  /** Block range the last scan covered. */
  range: { from: number; to: number; window: number } | null;
  lastSyncedAt: string | null;
  reload: () => void;
}

/**
 * Loads decoded activity for one contract and shares it across pages, so the Dashboard,
 * Transactions and Settings screens all show the same live data.
 */
export function useContractActivity(address: string): ContractActivity {
  const [contract, setContract] = useState<Contract | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(Boolean(address));
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<ContractActivity["range"]>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const latest = useRef(0);

  useEffect(() => {
    if (!address) return;
    const run = ++latest.current; // ignore results from superseded requests
    setLoading(true);
    setError(null);

    Promise.all([fetchTransactionHistory({ contractAddress: address }), getContractName(address)])
      .then(([history, name]) => {
        if (run !== latest.current) return;
        setTransactions(history.transactions);
        setRange({ from: history.fromBlock, to: history.toBlock, window: history.window });
        setContract({ address, name: name ?? "Contract", network: "Sepolia" });
        setLastSyncedAt(new Date().toISOString());
      })
      .catch((err: unknown) => {
        if (run !== latest.current) return;
        // Technical detail stays in the console; the UI gets a short, safe message.
        console.error("Failed to load contract activity:", err);
        setTransactions([]);
        setError("Couldn't load activity from the network. Check the address and try again.");
      })
      .finally(() => {
        if (run === latest.current) setLoading(false);
      });
  }, [address, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  const connection: ConnectionState = loading ? "connecting" : error ? "disconnected" : "connected";

  return { contract, transactions, loading, error, connection, range, lastSyncedAt, reload };
}
