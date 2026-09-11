import React from "react";
import { Search, Calendar, FlaskConical, Image as ImageIcon, ChevronRight } from "lucide-react";

const ACTIONS = [
  { label: "Find Patient", desc: "Search by CIN or scan QR code", tab: "search", icon: Search },
  { label: "Appointments", desc: "Schedule and manage appointments", tab: "appointments", icon: Calendar },
  { label: "Create Lab Request", desc: "Order laboratory tests", tab: "labs", icon: FlaskConical },
  { label: "Create Imaging Request", desc: "Order imaging studies", tab: "imaging", icon: ImageIcon },
];

export default function QuickActions({ onNavigate }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="font-semibold text-sm mb-4">Quick Actions</h3>
      <div className="space-y-2">
        {ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.tab}
              type="button"
              onClick={() => onNavigate?.(action.tab)}
              className="w-full flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 text-left hover:bg-accent transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{action.label}</p>
                <p className="text-xs text-muted-foreground">{action.desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
}