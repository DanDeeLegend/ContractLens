import { useState } from "react";
import { ethers } from "ethers";
import { Blocks, Activity, Radio, PlugZap, Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import StatusCard from "../components/StatusCard";
import ContractCard from "../components/ContractCard";
import SearchBar from "../components/SearchBar";
import TransactionTable from "../components/TransactionTable";
import TransactionDetailsModal from "../components/TransactionDetailsModal";
import { useTransactionFilters } from "../hooks/useTransactionFilters";
import type { ContractActivity } from "../hooks/useContractActivity";
import { formatNumber } from "../utils/format";
import type { Transaction } from "../types";

type DashboardProps = {
  activity: ContractActivity;
  onMonitor: (address: string) => void;
};

export default function Dashboard({ activity, onMonitor }: DashboardProps) {
  const { contract, transactions, loading, error, connection, range, reload } = activity;
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [inputAddress, setInputAddress] = useState(contract?.address ?? "");
  const [inputError, setInputError] = useState("");

  // Hooks must run unconditionally, so this stays above the loading/error returns.
  const { query, setQuery, filter, setFilter, filtered } = useTransactionFilters(transactions);

  const handleMonitor = () => {
    if (!ethers.isAddress(inputAddress)) {
      setInputError("Enter a valid Ethereum address (0x…).");
      return;
    }
    setInputError("");
    onMonitor(inputAddress);
  };

  const latestBlock = range?.to ?? 0;

  if (loading && !contract) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 p-24 text-text-muted">
        <Loader2 size={26} className="animate-spin text-accent" />
        <p className="text-sm">Scanning recent blocks…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">Dashboard</h1>
          <p className="text-sm text-text-muted">
            Decoded events emitted by {contract?.name ?? "the contract"}
            {range ? `, blocks ${formatNumber(range.from)} to ${formatNumber(range.to)}.` : "."}
          </p>
        </div>
        <button
          onClick={reload}
          disabled={loading}
          className="flex shrink-0 items-center gap-2 rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-text-secondary transition-colors hover:border-accent-dim/50 disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-danger/30 bg-danger-soft p-4">
          <AlertTriangle size={18} strokeWidth={2.25} className="mt-0.5 shrink-0 text-danger" />
          <div>
            <p className="text-sm font-semibold text-danger">Failed to load activity</p>
            <p className="mt-1 text-sm text-text-secondary">{error}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatusCard label="Latest Block" value={formatNumber(latestBlock)} icon={Blocks} tone="accent" />
        <StatusCard label="Events Found" value={formatNumber(transactions.length)} icon={Activity} />
        <StatusCard
          label="Blocks Scanned"
          value={range ? formatNumber(range.to - range.from + 1) : "0"}
          icon={Radio}
          tone="success"
          hint={range ? `${formatNumber(range.window)}-block windows` : undefined}
        />
        <StatusCard
          label="Connection"
          value={connection === "connected" ? "Online" : connection === "connecting" ? "Syncing" : "Offline"}
          icon={connection === "connecting" ? Loader2 : PlugZap}
          tone={connection === "connected" ? "success" : "default"}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1">{contract && <ContractCard contract={contract} />}</div>

        <div className="flex flex-col gap-3 lg:col-span-2">
          <div>
            <label
              htmlFor="monitor-address"
              className="mb-1 block text-xs font-medium uppercase tracking-wide text-text-muted"
            >
              Monitor Contract
            </label>
            <div className="flex gap-2">
              <input
                id="monitor-address"
                value={inputAddress}
                onChange={(e) => setInputAddress(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleMonitor()}
                type="text"
                placeholder="0x…"
                className="w-full min-w-0 flex-1 rounded-lg border border-border bg-elevated px-3 py-2 font-mono text-sm text-text-primary placeholder:text-text-muted focus:border-accent-dim focus:outline-none focus:ring-1 focus:ring-accent-dim"
              />
              <button
                onClick={handleMonitor}
                className="shrink-0 rounded-lg border border-accent-dim/50 bg-accent-soft px-4 py-2 text-sm font-medium text-accent transition-colors hover:bg-accent-dim/20"
              >
                Monitor
              </button>
            </div>
            {inputError && <p className="mt-2 text-sm text-danger">{inputError}</p>}
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
