import { useState } from "react";
import SearchBar from "../components/SearchBar";
import TransactionTable from "../components/TransactionTable";
import TransactionDetailsModal from "../components/TransactionDetailsModal";
import { useTransactionFilters } from "../hooks/useTransactionFilters";
import type { ContractActivity } from "../hooks/useContractActivity";
import type { Transaction } from "../types";

export default function Transactions({ activity }: { activity: ContractActivity }) {
  const [selected, setSelected] = useState<Transaction | null>(null);
  const { query, setQuery, filter, setFilter, filtered } = useTransactionFilters(activity.transactions);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">Transactions</h1>
          <p className="text-sm text-text-muted">
            {activity.loading
              ? "Loading…"
              : `${activity.transactions.length} decoded events from the most recent blocks.`}
          </p>
        </div>
        <SearchBar value={query} onChange={setQuery} />
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
