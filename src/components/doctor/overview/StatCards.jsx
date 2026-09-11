import React from "react";
import { Users, Calendar, FlaskConical, Image as ImageIcon } from "lucide-react";

// Four summary cards — each opens its section of the portal.
const CARDS = [
  { key: "patients", label: "Active Patients", desc: "View and manage your patients", icon: Users, chip: "bg-emerald-50 text-primary", tab: "search" },
  { key: "appointments", label: "Appointments", desc: "Upcoming and today's", icon: Calendar, chip: "bg-indigo-50 text-indigo-600", tab: "appointments" },
  { key: "labs", label: "Lab Requests", desc: "View and manage lab orders", icon: FlaskConical, chip: "bg-amber-50 text-amber-600", tab: "labs" },
  { key: "imaging", label: "Imaging Requests", desc: "View and manage imaging orders", icon: ImageIcon, chip: "bg-purple-50 text-purple-600", tab: "imaging" },
];

export default function StatCards({ stats, onNavigate }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {CARDS.map((card) => {
        const Icon = card.icon;
        return (
          <button
            key={card.key}
            type="button"
            onClick={() => onNavigate?.(card.tab)}
            className="text-left rounded-xl border border-border bg-card p-4 hover:shadow-sm transition-shadow"
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${card.chip}`}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold">{stats?.[card.key] ?? 0}</p>
            <p className="text-xs font-medium mt-1">{card.label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{card.desc}</p>
          </button>
        );
      })}
    </div>
  );
}