import React from "react";
import { Pill, FlaskConical, FileText, Users } from "lucide-react";

// Quick Actions — the four things a doctor starts most often, each opening the
// matching section of the portal.
export default function QuickActionsPanel({ onNavigate, notesLabel }) {
  const actions = [
    { label: "Add Prescription", icon: Pill, tab: "prescriptions" },
    { label: "Request Lab Test", icon: FlaskConical, tab: "labs" },
    { label: notesLabel ? "Write Record" : "Write Clinical Note", icon: FileText, tab: "notes" },
    { label: "View My Patients", icon: Users, tab: "search" },
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="mb-3 text-sm font-semibold text-foreground">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.tab}
              type="button"
              onClick={() => onNavigate?.(action.tab)}
              className="flex flex-col items-center gap-2 rounded-xl bg-[#F1F5F9] px-2 py-4 text-center transition-colors hover:bg-[#E2E8F0]"
            >
              <Icon className="h-5 w-5 text-[#2563EB]" />
              <span className="text-xs font-medium leading-tight text-foreground">{action.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}