import React from "react";
import { Users, Calendar, FlaskConical, Image as ImageIcon } from "lucide-react";

// Four summary cards — each opens its section of the portal.
const CARDS = [
  { key: "patients", label: "Active Patients", icon: Users, chip: "bg-blue-50 text-blue-600", tab: "search" },
  { key: "appointmentsToday", label: "Today's Appointments", icon: Calendar, chip: "bg-violet-50 text-violet-600", tab: "appointments" },
  { key: "labs", label: "Lab Requests", icon: FlaskConical, chip: "bg-amber-50 text-amber-600", tab: "labs" },
  { key: "imaging", label: "Imaging Requests", icon: ImageIcon, chip: "bg-emerald-50 text-emerald-600", tab: "imaging" },
];

export default function StatCards({ stats, appointmentsToday = 0, onNavigate }) {
  const values = { ...stats, appointmentsToday };

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {CARDS.map((card) => {
        const Icon = card.icon;
        return (
          <button
            key={card.key}
            type="button"
            onClick={() => onNavigate?.(card.tab)}
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-left transition-shadow hover:shadow-sm"
          >
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${card.chip}`}>
              <Icon className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block text-2xl font-bold leading-none text-foreground">{values?.[card.key] ?? 0}</span>
              <span className="mt-1 block text-xs font-medium leading-tight text-muted-foreground">{card.label}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}