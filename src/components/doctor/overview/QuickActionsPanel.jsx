import React from "react";
import { Pill, FlaskConical, FileText, Users } from "lucide-react";

// Quick Actions — the four things a doctor starts most often, each opening the
// matching section of the portal. Kept compact so the overview fits one screen.
export default function QuickActionsPanel({ onNavigate, notesLabel }) {
  const actions = [
    { label: "Add Prescription", icon: Pill, tab: "prescriptions" },
    { label: "Request Lab Test", icon: FlaskConical, tab: "labs" },
    { label: notesLabel ? "Write Record" : "Write Clinical Note", icon: FileText, tab: "notes" },
    { label: "View My Patients", icon: Users, tab: "search" },
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="mb-2 text-sm font-semibold text-foreground">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-2">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.tab}
              type="button"
              onClick={() => onNavigate?.(action.tab)}
              className="flex items-center gap-2 rounded-lg bg-[#F1F5F9] px-2.5 py-2 text-left transition-colors hover:bg-[#E2E8F0]"
            >
              <Icon className="h-4 w-4 shrink-0 text-[#2563EB]" />
              <span className="text-[11px] font-medium leading-tight text-foreground">{action.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}