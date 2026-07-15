import { useState } from "react";
import SearchBar from "../components/SearchBar";
import TransactionTable from "../components/TransactionTable";
import TransactionDetailsModal from "../components/TransactionDetailsModal";
import { mockTransactions } from "../data/mockTransactions";
import { useTransactionFilters } from "../hooks/useTransactionFilters";
import type { Transaction } from "../types";

export default function Transactions() {
  const [selected, setSelected] = useState<Transaction | null>(null);
  const { query, setQuery, filter, setFilter, filtered } = useTransactionFilters(mockTransactions);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">Transactions</h1>
          <p className="text-sm text-text-muted">Every recorded interaction with the monitored contract.</p>
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
