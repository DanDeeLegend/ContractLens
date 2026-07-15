import { ScanLine } from "lucide-react";

export default function About() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-lg font-semibold text-text-primary">About</h1>
        <p className="text-sm text-text-muted">What ContractLens is, and isn't.</p>
      </div>

      <div className="max-w-2xl rounded-xl border border-border bg-surface p-5">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-accent-soft text-accent">
          <ScanLine size={18} />
        </div>
        <p className="text-sm leading-relaxed text-text-secondary">
          ContractLens watches a single smart contract and records every interaction made with it — every
          function call, its caller, the gas it used, and whether it succeeded. Think of it as a focused,
          single-contract alternative to a full block explorer.
        </p>
        <ul className="mt-4 flex flex-col gap-1.5 text-sm text-text-secondary">
          <li>· Not a wallet — it never holds keys or signs transactions.</li>
          <li>· Not a DEX or marketplace — it doesn't facilitate trades.</li>
          <li>· It only observes and decodes activity on one contract at a time.</li>
        </ul>
      </div>
    </div>
  );
}
