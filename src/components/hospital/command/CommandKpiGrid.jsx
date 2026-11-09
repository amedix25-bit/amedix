import React from "react";
import { Users, Stethoscope, CalendarClock, FlaskConical, Radiation, Banknote, Activity, ClipboardCheck } from "lucide-react";
import { formatCount, formatMoney } from "@/lib/hospitalCommandFormat";
import { useAppLanguage } from "@/lib/appLanguage";

// The hospital's measured figures. Each card is one count or sum taken from
// the hospital's own records — no illustrative numbers.
export default function CommandKpiGrid({ kpis }) {
  const { t } = useAppLanguage();
  const cards = [
    { icon: ClipboardCheck, label: "Check-Ins Today", value: formatCount(kpis.checkinsToday), tone: "text-primary" },
    { icon: Users, label: "Active Checked-In Patients", value: formatCount(kpis.activeVisits), tone: "text-info" },
    { icon: Activity, label: "Total Visits Recorded", value: formatCount(kpis.visitsTotal), tone: "text-muted-foreground" },
    { icon: Stethoscope, label: "Active Doctors", value: formatCount(kpis.activeDoctors), tone: "text-success" },
    { icon: CalendarClock, label: "Appointments Today", value: formatCount(kpis.appointmentsToday), tone: "text-primary" },
    { icon: FlaskConical, label: "Open Lab Requests", value: formatCount(kpis.pendingLabs), tone: "text-warning" },
    { icon: Radiation, label: "Imaging Not Completed", value: formatCount(kpis.pendingImaging), tone: "text-portal-radiology" },
    {
      icon: Banknote,
      label: `Revenue Today (LYD)`,
      value: formatMoney(kpis.revenueToday),
      tone: "text-success",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map(({ icon: Icon, label, value, tone }) => (
        <div key={label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Icon className={`w-4 h-4 ${tone}`} />
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground truncate">
              {t(label)}
            </p>
          </div>
          <p className="text-2xl font-bold mt-2 tabular-nums">{value}</p>
        </div>
      ))}
    </div>
  );
}