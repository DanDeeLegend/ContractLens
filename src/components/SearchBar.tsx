import { Search, X } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export default function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative w-full sm:max-w-xs">
      <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type="text"
        placeholder="Search event, wallet, or hash…"
        className="w-full rounded-lg border border-border bg-elevated py-2 pl-9 pr-8 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-dim focus:outline-none focus:ring-1 focus:ring-accent-dim"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
