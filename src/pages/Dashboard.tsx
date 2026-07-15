import { useEffect, useState } from "react";
import { Blocks, Activity, Radio, PlugZap, Loader2, AlertTriangle } from "lucide-react";
import StatusCard from "../components/StatusCard";
import ContractCard from "../components/ContractCard";
import SearchBar from "../components/SearchBar";
import TransactionTable from "../components/TransactionTable";
import TransactionDetailsModal from "../components/TransactionDetailsModal";
import { mockContract } from "../data/mockTransactions";
import { fetchTransactionHistory } from "../services/blockchainService";
import { useTransactionFilters } from "../hooks/useTransactionFilters";
import { formatNumber } from "../utils/format";
import type { ConnectionState, Transaction } from "../types";

type DashboardProps = {
  contractAddress: string;
};

export default function Dashboard({ contractAddress }: DashboardProps) {  
  console.log("Dashboard prop:", contractAddress);
  
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [inputAddress, setInputAddress] = useState(contractAddress);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTransactions = (address: string) => {
    let cancelled = false;
  
    setLoading(true);
    setError(null);
  
    fetchTransactionHistory({ contractAddress: address })
      .then((result) => {
        if (!cancelled) {
          setTransactions(result);
        }
      })
      .catch((error) => {
        // Log the technical error for developers only
        console.error("Transaction loading failed:", error);
  
        // Show a generic message to users
        if (!cancelled) {
          setError("Failed to load transactions. Please try again later.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
  
    return () => {
      cancelled = true;
    };
  };

  // Fetch once on mount using whatever contract address the app started with.
  useEffect(() => {
    const cancel = loadTransactions(contractAddress);
    return cancel;
}, [contractAddress]);

  const handleMonitor = () => {
    loadTransactions(inputAddress);
};

  // Hooks must run unconditionally, so this stays above the loading/error returns.
  const { query, setQuery, filter, setFilter, filtered } = useTransactionFilters(transactions);

  // Dashboard stats derived entirely from live transaction state —
  // no more mockDashboardStats reference anywhere in this file.
  const latestBlock = transactions.reduce((max, tx) => Math.max(max, tx.blockNumber), 0);
  const totalTransactions = transactions.length;
  const activeListeners = 1;
  const connectionStatus: ConnectionState = "connected";

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 p-24 text-text-muted">
        <Loader2 size={26} className="animate-spin text-accent" />
        <p className="text-sm">Loading blockchain data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-start gap-3 rounded-xl border border-danger/30 bg-danger-soft p-4">
          <AlertTriangle size={18} strokeWidth={2.25} className="mt-0.5 shrink-0 text-danger" />
          <div>
            <p className="text-sm font-semibold text-danger">Failed to load transactions</p>
            <p className="mt-1 text-sm text-text-secondary">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-lg font-semibold text-text-primary">Dashboard</h1>
        <p className="text-sm text-text-muted">Live view of every interaction with {mockContract.name}.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatusCard
          label="Latest Block"
          value={formatNumber(latestBlock)}
          icon={Blocks}
          tone="accent"
        />
        <StatusCard
          label="Total Transactions"
          value={formatNumber(totalTransactions)}
          icon={Activity}
        />
        <StatusCard
          label="Active Listeners"
          value={String(activeListeners)}
          icon={Radio}
          tone="success"
          hint="Watching for new events"
        />
        <StatusCard
          label="Connection"
          value={connectionStatus === "connected" ? "Online" : "Offline"}
          icon={PlugZap}
          tone={connectionStatus === "connected" ? "success" : "default"}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <ContractCard contract={mockContract} />
        </div>

        <div className="flex flex-col gap-3 lg:col-span-2">
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-text-muted">
              Monitor Contract
            </label>
            <div className="flex gap-2">
            <input
              value={inputAddress}
              onChange={(e) => setInputAddress(e.target.value)}
              type="text"
              placeholder="0x..."
              className="w-full min-w-0 flex-1 rounded-lg border border-border bg-elevated px-3 py-2 font-mono text-sm text-text-primary placeholder:text-text-muted focus:border-accent-dim focus:outline-none focus:ring-1 focus:ring-accent-dim"
            />
              <button
                onClick={handleMonitor}
                className="shrink-0 rounded-lg border border-accent-dim/50 bg-accent-soft px-4 py-2 text-sm font-medium text-accent transition-colors hover:bg-accent-dim/20"
              >
                Monitor
              </button>
            </div>
          </div>

          <div className="flex items-end">
            <SearchBar value={query} onChange={setQuery} />
          </div>
        </div>
      </div>

      <TransactionTable
        transactions={filtered}
        filter={filter}
        onFilterChange={setFilter}
        onSelect={setSelected}
      />

      <TransactionDetailsModal transaction={selected} onClose={() => setSelected(null)} />
    </div>
  );
}