import { useState } from "react";
import { ethers } from "ethers";
import {
  Activity,
  Search,
  FileCode2,
  ShieldCheck,
} from "lucide-react";

type LandingPageProps = {
  onStart: (address: string) => void;
};

export default function LandingPage({ onStart }: LandingPageProps) {
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");

  const handleMonitor = () => {
    if (!ethers.isAddress(address)) {
      setError("Please enter a valid Ethereum contract address.");
      return;
    }

    setError("");
    onStart(address);
  };

  const handleDemo = () => {
    const demo = import.meta.env.VITE_CONTRACT_ADDRESS as string;

    if (!demo) {
      setError("Demo contract is not configured.");
      return;
    }

    setError("");
    onStart(demo);
  };

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col items-center justify-center gap-16 px-8 py-12 lg:flex-row">

        {/* LEFT SIDE */}

        <div className="flex-1">

          <div className="inline-flex items-center rounded-full border border-accent/20 bg-accent-soft px-3 py-1 text-sm text-accent">
            Ethereum • Sepolia • Real-Time Monitoring
          </div>

          <h1 className="mt-6 text-7xl font-bold leading-tight lg:text-8xl">
            ContractLens
          </h1>

          <h2 className="mt-5 max-w-2xl text-2xl font-semibold text-text-secondary">
            See What Your Smart Contract Is Really Doing.
          </h2>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-text-muted">
            Decode transactions, inspect event logs, and monitor Ethereum
            smart contracts from one clean, developer-friendly dashboard.
          </p>

          {/* Input */}

          <div className="mt-10 max-w-2xl">

            <div className="flex gap-3">

              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter Contract Address (0x...)"
                className="flex-1 rounded-xl border border-border bg-elevated px-4 py-4 font-mono text-sm outline-none transition focus:border-accent"
              />

              <button
                onClick={handleMonitor}
                className="rounded-xl bg-accent px-6 py-4 font-semibold text-white transition hover:opacity-90"
              >
                Monitor
              </button>

            </div>

            <button
              onClick={handleDemo}
              className="mt-4 rounded-xl border border-border bg-surface px-5 py-3 text-sm font-medium transition hover:border-accent"
            >
              Try Demo Contract
            </button>

            {error && (
              <p className="mt-3 text-sm text-red-400">
                {error}
              </p>
            )}

            <p className="mt-4 text-sm text-text-muted">
              Demo tip: Paste any Sepolia smart contract address or use the demo
              contract to explore ContractLens.
            </p>

          </div>

          {/* Feature Cards */}

          <div className="mt-12 grid max-w-2xl grid-cols-1 gap-4 md:grid-cols-2">

            <div className="rounded-xl border border-border bg-surface p-5">
              <Activity className="mb-3 text-accent" size={22} />
              <h3 className="font-semibold">
                Historical Monitoring
              </h3>
              <p className="mt-2 text-sm text-text-muted">
                Browse historical smart contract interactions.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-surface p-5">
              <FileCode2 className="mb-3 text-accent" size={22} />
              <h3 className="font-semibold">
                ABI Decoding
              </h3>
              <p className="mt-2 text-sm text-text-muted">
                Decode logs into readable function names and parameters.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-surface p-5">
              <Search className="mb-3 text-accent" size={22} />
              <h3 className="font-semibold">
                Search & Filter
              </h3>
              <p className="mt-2 text-sm text-text-muted">
                Search by wallet address, function name or transaction hash.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-surface p-5">
              <ShieldCheck className="mb-3 text-accent" size={22} />
              <h3 className="font-semibold">
                Ethereum Ready
              </h3>
              <p className="mt-2 text-sm text-text-muted">
                Powered by ethers.js, Alchemy and Ethereum Sepolia.
              </p>
            </div>

          </div>

        </div>

        {/* RIGHT SIDE */}

        <div className="hidden flex-1 justify-center lg:flex">

          <div className="relative">

            {/* Glow */}

            <div className="absolute -inset-6 rounded-3xl bg-cyan-500/20 blur-3xl"></div>

            {/* Screenshot */}

            <div className="relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-surface shadow-2xl">

              <img
                src="/dashboard-preview.png"
                alt="ContractLens Dashboard"
                className="w-[700px] rounded-2xl transition duration-500 hover:-translate-y-2"
              />

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}