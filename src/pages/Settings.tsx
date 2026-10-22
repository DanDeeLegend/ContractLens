import type { ContractActivity } from "../hooks/useContractActivity";
import { formatAbsoluteTime, formatNumber } from "../utils/format";

export default function Settings({ activity }: { activity: ContractActivity }) {
  const { contract, range, connection, lastSyncedAt } = activity;

  const fields = [
    { label: "Contract address", value: contract?.address ?? "—" },
    { label: "Network", value: "Sepolia (chain ID 11155111)" },
    { label: "RPC access", value: "Server-side proxy (/api/rpc)" },
    { label: "Blocks scanned", value: range ? `${formatNumber(range.from)} to ${formatNumber(range.to)}` : "—" },
    { label: "Log window", value: range ? `${formatNumber(range.window)} blocks per request` : "—" },
    { label: "Last synced", value: lastSyncedAt ? formatAbsoluteTime(lastSyncedAt) : "—" },
    { label: "Status", value: connection },
  ];

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-lg font-semibold text-text-primary">Settings</h1>
        <p className="text-sm text-text-muted">Read-only view of the current connection.</p>
      </div>

      <div className="max-w-xl rounded-xl border border-border bg-surface">
        {fields.map((field, i) => (
          <div
            key={field.label}
            className={`flex items-center justify-between gap-4 px-4 py-3 ${
              i !== fields.length - 1 ? "border-b border-border-soft" : ""
            }`}
          >
            <span className="text-sm text-text-secondary">{field.label}</span>
            <span className="break-all text-right font-mono text-xs text-text-primary">{field.value}</span>
          </div>
        ))}
      </div>

      <p className="max-w-xl text-xs text-text-muted">
        The RPC provider key stays on the server. The browser only talks to this app's own /api/rpc endpoint, which
        forwards a small allowlist of read-only calls.
      </p>
    </div>
  );
}
