import { useEffect } from "react";
import { X, CheckCircle2, XCircle, Copy } from "lucide-react";
import type { Transaction } from "../types";
import { formatAbsoluteTime, formatNumber, truncateHex } from "../utils/format";

interface TransactionDetailsModalProps {
  transaction: Transaction | null;
  onClose: () => void;
}

function Field({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-text-muted">{label}</p>
      <p className={`mt-1 break-all text-sm text-text-primary ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}

export default function TransactionDetailsModal({ transaction, onClose }: TransactionDetailsModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!transaction) return null;
  const isSuccess = transaction.status === "success";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-surface shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border-soft px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-elevated-2 px-2 py-0.5 font-mono text-sm text-accent">
              {transaction.functionName}()
            </span>
            {isSuccess ? (
              <span className="flex items-center gap-1 text-xs font-medium text-success">
                <CheckCircle2 size={13} /> Success
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs font-medium text-danger">
                <XCircle size={13} /> Failed
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-text-muted transition-colors hover:bg-elevated hover:text-text-primary"
          >
            <X size={16} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 px-5 py-4">
          <Field label="Caller Wallet" value={truncateHex(transaction.caller, 10, 8)} mono />
          <Field label="Block Number" value={formatNumber(transaction.blockNumber)} mono />
          <Field label="Gas Used" value={formatNumber(transaction.gasUsed)} mono />
          <Field label="Timestamp" value={formatAbsoluteTime(transaction.timestamp)} />
          <div className="col-span-2">
            <Field label="Transaction Hash" value={transaction.hash} mono />
          </div>
        </div>

        <div className="border-t border-border-soft px-5 py-4">
          <p className="text-xs uppercase tracking-wide text-text-muted">Decoded Inputs</p>
          {transaction.params.length === 0 ? (
            <p className="mt-2 text-sm text-text-muted">This function takes no parameters.</p>
          ) : (
            <div className="mt-2 flex flex-col gap-2">
              {transaction.params.map((param) => (
                <div
                  key={param.name}
                  className="flex items-start justify-between gap-3 rounded-lg border border-border-soft bg-elevated px-3 py-2"
                >
                  <div>
                    <p className="text-sm text-text-primary">{param.name}</p>
                    <p className="text-xs text-text-muted">{param.type}</p>
                  </div>
                  <p className="break-all text-right font-mono text-xs text-text-secondary">{param.value}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-border-soft px-5 py-3">
          <button
            onClick={() => navigator.clipboard?.writeText(transaction.hash)}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-elevated py-2 text-sm text-text-secondary transition-colors hover:border-accent-dim/50 hover:text-text-primary"
          >
            <Copy size={14} /> Copy transaction hash
          </button>
        </div>
      </div>
    </div>
  );
}
