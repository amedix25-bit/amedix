import React from "react";
import { Building2, Stethoscope } from "lucide-react";
import { useAppLanguage } from "@/lib/appLanguage";

// Department overview — the hospital's own specialisations, measured by the
// doctors assigned to them and today's appointments for those doctors.
export default function CommandDepartments({ departments }) {
  const { t } = useAppLanguage();
  const maxAppointments = Math.max(1, ...departments.map((d) => d.appointmentsToday));

  return (
    <section className="rounded-xl border border-border bg-card shadow-sm">
      <header className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Building2 className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-semibold">{t("Department Overview")}</h2>
      </header>

      {departments.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-muted-foreground">
          {t("No doctors are assigned to a department yet.")}
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {departments.map((d) => (
            <li key={d.name} className="px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium truncate">{d.name}</p>
                <span className="text-[11px] text-muted-foreground shrink-0 flex items-center gap-1">
                  <Stethoscope className="w-3 h-3" />
                  {d.doctors}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div className="h-1.5 flex-1 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.round((d.appointmentsToday / maxAppointments) * 100)}%` }}
                  />
                </div>
                <span className="text-[11px] text-muted-foreground tabular-nums shrink-0">
                  {d.appointmentsToday} {t("today")}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}