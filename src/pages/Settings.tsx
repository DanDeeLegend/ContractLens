import { mockContract, mockConnectionStatus } from "../data/mockTransactions";

const fields = [
  { label: "Contract address", value: mockContract.address },
  { label: "Network", value: mockContract.network },
  { label: "RPC endpoint", value: "Not configured — TODO: rpcService" },
  { label: "Sync status", value: mockConnectionStatus.state },
];

export default function Settings() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-lg font-semibold text-text-primary">Settings</h1>
        <p className="text-sm text-text-muted">Contract and network configuration for this monitor.</p>
      </div>

      <div className="max-w-xl rounded-xl border border-border bg-surface">
        {fields.map((field, i) => (
          <div
            key={field.label}
            className={`flex items-center justify-between px-4 py-3 ${
              i !== fields.length - 1 ? "border-b border-border-soft" : ""
            }`}
          >
            <span className="text-sm text-text-secondary">{field.label}</span>
            <span className="font-mono text-xs text-text-primary">{field.value}</span>
          </div>
        ))}
      </div>

      <p className="max-w-xl text-xs text-text-muted">
        Editable settings and live RPC connection controls will land once blockchainService is implemented.
      </p>
    </div>
  );
}
