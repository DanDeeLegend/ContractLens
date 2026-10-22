import { FileCode2, Copy } from "lucide-react";
import { useState } from "react";
import type { Contract } from "../types";
import { truncateHex } from "../utils/format";

interface ContractCardProps {
  contract: Contract;
}

export default function ContractCard({ contract }: ContractCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(contract.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard access can fail silently (e.g. permissions) — non-critical.
    }
  };

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-accent">
          <FileCode2 size={17} strokeWidth={2.25} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-text-primary">{contract.name}</p>
          <p className="text-xs text-text-muted">{contract.network}</p>
        </div>
      </div>

      <button
        onClick={handleCopy}
        className="mt-4 flex w-full items-center justify-between rounded-lg border border-border-soft bg-elevated px-3 py-2 text-left transition-colors hover:border-accent-dim/50"
      >
        <span className="truncate font-mono text-sm text-text-secondary">{truncateHex(contract.address, 10, 8)}</span>
        <span className="ml-2 flex shrink-0 items-center gap-1 text-xs text-text-muted">
          <Copy size={12} />
          {copied ? "Copied" : "Copy"}
        </span>
      </button>
    </div>
  );
}
