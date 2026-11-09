import React from "react";
import { UserPlus, Stethoscope, FlaskConical, Radiation, MessagesSquare, UserCog, Megaphone, Building2 } from "lucide-react";
import { useAppLanguage } from "@/lib/appLanguage";

// Quick actions open the existing hospital workspaces — the same tabs, with
// their existing permission checks and workflows.
const ACTIONS = [
  { key: "patients", icon: UserPlus, label: "Register / Check In Patient" },
  { key: "doctors", icon: Stethoscope, label: "Manage Doctors" },
  { key: "panels", icon: FlaskConical, label: "Lab Panels" },
  { key: "radiology", icon: Radiation, label: "Radiology Department" },
  { key: "messages", icon: MessagesSquare, label: "Doctor Messages" },
  { key: "staff", icon: UserCog, label: "Receptionists" },
  { key: "partnership", icon: Megaphone, label: "Partnership" },
  { key: "profile", icon: Building2, label: "Hospital Profile" },
];

export default function CommandQuickActions({ onNavigate }) {
  const { t } = useAppLanguage();

  return (
    <section className="rounded-xl border border-border bg-card shadow-sm">
      <header className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold">{t("Quick Actions")}</h2>
      </header>
      <div className="grid grid-cols-2 gap-2 p-3">
        {ACTIONS.map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => onNavigate(key)}
            className="flex flex-col items-start gap-2 rounded-lg border border-border px-3 py-3 text-left rtl:text-right hover:border-primary/40 hover:bg-secondary/60 transition-colors"
          >
            <Icon className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium leading-snug">{t(label)}</span>
          </button>
        ))}
      </div>
    </section>
  );
}