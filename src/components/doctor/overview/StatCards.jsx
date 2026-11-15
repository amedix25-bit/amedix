import React from "react";
import { Users, Calendar, FlaskConical, Image as ImageIcon } from "lucide-react";

// Four summary cards — each opens its section of the portal.
// The pastel surface fills the whole card; the icon chip is a slightly darker
// shade of the same tint.
const CARDS = [
  {
    key: "patients",
    label: "Active Patients",
    icon: Users,
    surface: "bg-[#E3F1FF]",
    chip: "bg-[#C7E4FF] text-[#1D6FD0]",
    tab: "search",
  },
  {
    key: "appointmentsToday",
    label: "Today's Appointments",
    icon: Calendar,
    surface: "bg-[#E0F6EF]",
    chip: "bg-[#C3EEDF] text-[#0F8A6A]",
    tab: "appointments",
  },
  {
    key: "labs",
    label: "Lab Requests",
    icon: FlaskConical,
    surface: "bg-[#EEE9FF]",
    chip: "bg-[#DCD3FF] text-[#6544D6]",
    tab: "labs",
  },
  {
    key: "imaging",
    label: "Imaging Requests",
    icon: ImageIcon,
    surface: "bg-[#FFF0E6]",
    chip: "bg-[#FFDCC7] text-[#C1631F]",
    tab: "imaging",
  },
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
            className={`flex items-center gap-3 rounded-xl p-4 text-left shadow-sm transition-shadow hover:shadow-md ${card.surface}`}
          >
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${card.chip}`}>
              <Icon className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block text-2xl font-bold leading-none text-foreground">{values?.[card.key] ?? 0}</span>
              <span className="mt-1 block text-xs font-medium leading-tight text-foreground/60">{card.label}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}