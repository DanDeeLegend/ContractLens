import { SearchX } from "lucide-react";

interface EmptyStateProps {
  message?: string;
}

export default function EmptyState({ message = "No interactions match your filters." }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-4 py-16 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-elevated text-text-muted">
        <SearchX size={20} />
      </span>
      <p className="text-sm text-text-secondary">{message}</p>
      <p className="text-xs text-text-muted">Try clearing the search or switching the status filter.</p>
    </div>
  );
}
