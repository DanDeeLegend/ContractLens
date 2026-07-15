import { useMemo, useState } from "react";
import type { Transaction, TransactionFilter } from "../types";

export function useTransactionFilters(transactions: Transaction[]) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<TransactionFilter>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return transactions.filter((tx) => {
      if (filter !== "all" && tx.status !== filter) return false;
      if (!q) return true;

      return (
        tx.functionName.toLowerCase().includes(q) ||
        tx.caller.toLowerCase().includes(q) ||
        tx.hash.toLowerCase().includes(q)
      );
    });
  }, [transactions, query, filter]);

  return { query, setQuery, filter, setFilter, filtered };
}
