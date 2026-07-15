import { LayoutDashboard, List, Settings, Info } from "lucide-react";
import type { NavRoute } from "../types";

interface SidebarProps {
  active: NavRoute;
  onNavigate: (route: NavRoute) => void;
}

const items: { route: NavRoute; label: string; icon: typeof LayoutDashboard }[] = [
  { route: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { route: "transactions", label: "Transactions", icon: List },
  { route: "settings", label: "Settings", icon: Settings },
  { route: "about", label: "About", icon: Info },
];

export default function Sidebar({ active, onNavigate }: SidebarProps) {
  return (
    <aside className="hidden w-56 shrink-0 flex-col gap-1 border-r border-border bg-surface px-3 py-4 sm:flex">
      {items.map(({ route, label, icon: Icon }) => {
        const isActive = active === route;
        return (
          <button
            key={route}
            onClick={() => onNavigate(route)}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
              isActive
                ? "bg-elevated text-accent"
                : "text-text-secondary hover:bg-elevated/60 hover:text-text-primary"
            }`}
          >
            <Icon size={17} strokeWidth={2} className={isActive ? "text-accent" : "text-text-muted"} />
            <span className="font-medium">{label}</span>
            {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-accent" />}
          </button>
        );
      })}
    </aside>
  );
}
