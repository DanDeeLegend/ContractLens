import type { LucideIcon } from "lucide-react";

interface StatusCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: "default" | "accent" | "success";
  hint?: string;
}

const toneStyles: Record<NonNullable<StatusCardProps["tone"]>, { icon: string; ring: string }> = {
  default: { icon: "text-text-secondary bg-elevated-2", ring: "border-border" },
  accent: { icon: "text-accent bg-accent-soft", ring: "border-accent-dim/40" },
  success: { icon: "text-success bg-success-soft", ring: "border-success/30" },
};

export default function StatusCard({ label, value, icon: Icon, tone = "default", hint }: StatusCardProps) {
  const styles = toneStyles[tone];

  return (
    <div className={`rounded-xl border ${styles.ring} bg-surface p-4 shadow-[0_1px_0_0_rgba(255,255,255,0.02)]`}>
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-text-muted">{label}</p>
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${styles.icon}`}>
          <Icon size={16} strokeWidth={2.25} />
        </span>
      </div>
      <p className="mt-3 truncate font-mono text-lg font-semibold text-text-primary" title={value}>
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-text-muted">{hint}</p>}
    </div>
  );
}
