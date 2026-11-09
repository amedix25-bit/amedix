import React from "react";
import { AlertTriangle, ChevronRight, ShieldCheck } from "lucide-react";
import { SEVERITY } from "@/lib/hospitalCommandFormat";
import { useAppLanguage } from "@/lib/appLanguage";

// The alert text is written on the client from the alert's key and its measured
// count, so it reads correctly in Arabic and English.
const COPY = {
  labs_overdue: {
    title: "Laboratory requests overdue",
    detail: "{n} laboratory request(s) authorized more than 48 hours ago are still awaiting processing or validation.",
  },
  imaging_awaiting_report: {
    title: "Imaging awaiting reporting",
    detail: "{n} study/studies have images ready but no signed report.",
  },
  labs_pending: {
    title: "Laboratory requests open",
    detail: "{n} request(s) are awaiting specimen collection, processing or validation.",
  },
  imaging_open: {
    title: "Imaging requests open",
    detail: "{n} imaging request(s) are not completed yet.",
  },
  doctors_pending: {
    title: "Doctor associations pending",
    detail: "{n} doctor request(s) are waiting for hospital approval.",
  },
  prescriptions_open: {
    title: "Prescriptions awaiting dispensing",
    detail: "{n} prescription(s) have been sent to a pharmacy but not dispensed.",
  },
};

// Operational alerts. Each alert is a measured backlog and opens the workspace
// that resolves it. When nothing needs attention the panel says so.
export default function CommandAlerts({ alerts, onNavigate }) {
  const { t } = useAppLanguage();

  return (
    <section className="rounded-xl border border-border bg-card shadow-sm">
      <header className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-warning" />
          <h2 className="text-sm font-semibold">{t("Urgent Alerts")}</h2>
        </div>
        <span className="text-[11px] text-muted-foreground">{alerts.length}</span>
      </header>

      {alerts.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-success/60" />
          <p className="text-sm text-muted-foreground">{t("No operational backlog detected.")}</p>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {alerts.map((a) => {
            const sev = SEVERITY[a.severity] || SEVERITY.info;
            const copy = COPY[a.key];
            if (!copy) return null;
            return (
              <li key={a.id}>
                <button
                  onClick={() => onNavigate(a.target)}
                  className="w-full text-left rtl:text-right px-4 py-3 hover:bg-secondary/60 transition-colors flex items-start gap-3"
                >
                  <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${sev.dot}`} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">{t(copy.title)}</span>
                      <span className={`rounded-full border px-1.5 text-[10px] font-semibold ${sev.chip}`}>
                        {t(sev.label)}
                      </span>
                    </span>
                    <span className="block text-xs text-muted-foreground mt-0.5 leading-snug">
                      {t(copy.detail).replace("{n}", String(a.count))}
                    </span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1 rtl:rotate-180" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}