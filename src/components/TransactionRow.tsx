import { CheckCircle2, XCircle } from "lucide-react";
import type { Transaction } from "../types";
import { formatNumber, formatRelativeTime, truncateHex } from "../utils/format";

interface TransactionRowProps {
  transaction: Transaction;
  onSelect: (transaction: Transaction) => void;
}

export default function TransactionRow({ transaction, onSelect }: TransactionRowProps) {
  const isSuccess = transaction.status === "success";

  return (
    <tr
      onClick={() => onSelect(transaction)}
      className="cursor-pointer border-b border-border-soft text-sm transition-colors hover:bg-elevated/50"
    >
      <td className="whitespace-nowrap px-4 py-3 text-text-muted">{formatRelativeTime(transaction.timestamp)}</td>
      <td className="px-4 py-3">
        <span className="rounded-md bg-elevated-2 px-2 py-0.5 font-mono text-xs text-accent">
          {transaction.functionName}()
        </span>
      </td>
      <td className="px-4 py-3 font-mono text-xs text-text-secondary">{truncateHex(transaction.caller)}</td>
      <td className="px-4 py-3 font-mono text-xs text-text-secondary">{truncateHex(transaction.hash)}</td>
      <td className="whitespace-nowrap px-4 py-3 text-text-secondary">{formatNumber(transaction.blockNumber)}</td>
      <td className="whitespace-nowrap px-4 py-3 text-text-secondary">{formatNumber(transaction.gasUsed)}</td>
      <td className="whitespace-nowrap px-4 py-3">
        {isSuccess ? (
          <span className="flex items-center gap-1.5 text-xs font-medium text-success">
            <CheckCircle2 size={13} /> Success
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-xs font-medium text-danger">
            <XCircle size={13} /> Failed
          </span>
        )}
      </td>
    </tr>
  );
}
