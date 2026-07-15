import { ScanLine } from "lucide-react";
import type { ConnectionState } from "../types";

interface HeaderProps {
  network: string;
  connectionState: ConnectionState;
}

const stateCopy: Record<ConnectionState, { label: string; dot: string; text: string }> = {
  connected: { label: "Connected", dot: "bg-success", text: "text-success" },
  connecting: { label: "Connecting", dot: "bg-accent", text: "text-accent" },
  disconnected: { label: "Disconnected", dot: "bg-danger", text: "text-danger" },
};

export default function Header({ network, connectionState }: HeaderProps) {
  const state = stateCopy[connectionState];

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-surface/80 px-6 backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-accent-dim/50 bg-accent-soft text-accent">
          <ScanLine size={18} strokeWidth={2.25} />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold tracking-tight text-text-primary">ContractLens</p>
          <p className="text-xs text-text-muted">Smart contract interaction recorder</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="rounded-full border border-border bg-elevated px-3 py-1 font-mono text-xs text-text-secondary">
          {network}
        </span>
        <span className="flex items-center gap-2 rounded-full border border-border bg-elevated px-3 py-1 text-xs font-medium">
          <span className={`h-1.5 w-1.5 rounded-full ${state.dot} ${connectionState === "connected" ? "animate-pulse-dot" : ""}`} />
          <span className={state.text}>{state.label}</span>
        </span>
      </div>
    </header>
  );
}
