import type { Transaction, TransactionFilter } from "../types";
import TransactionRow from "./TransactionRow";
import LoadingState from "./LoadingState";
import EmptyState from "./EmptyState";

interface TransactionTableProps {
  transactions: Transaction[];
  isLoading?: boolean;
  filter: TransactionFilter;
  onFilterChange: (filter: TransactionFilter) => void;
  onSelect: (transaction: Transaction) => void;
}

const filters: { value: TransactionFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "success", label: "Success" },
  { value: "failed", label: "Failed" },
];

const columns = ["Timestamp", "Event", "Caller", "Tx Hash", "Block", "Gas Used", "Status"];

export default function TransactionTable({
  transactions,
  isLoading = false,
  filter,
  onFilterChange,
  onSelect,
}: TransactionTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border-soft px-4 py-3">
        <p className="text-sm font-semibold text-text-primary">Recent interactions</p>
        <div className="flex gap-1 rounded-lg border border-border bg-elevated p-0.5">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => onFilterChange(f.value)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                filter === f.value
                  ? "bg-elevated-2 text-accent"
                  : "text-text-muted hover:text-text-secondary"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : transactions.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse">
            <thead>
              <tr className="border-b border-border-soft text-left text-xs uppercase tracking-wide text-text-muted">
                {columns.map((col) => (
                  <th key={col} className="whitespace-nowrap px-4 py-2.5 font-medium">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <TransactionRow key={tx.id} transaction={tx} onSelect={onSelect} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
