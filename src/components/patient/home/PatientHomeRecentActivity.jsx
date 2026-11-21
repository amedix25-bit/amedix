import React from "react";
import { ChevronRight, Clock, FileText, FlaskConical, Image as ImageIcon, Pill } from "lucide-react";
import { usePatientLanguage } from "@/lib/patientLanguage";

// Only new clinical items are listed here — appointments, messages and
// reminders live on their own tabs.
const KINDS = {
  radiology_report: { label: "New radiology report", Icon: ImageIcon, target: "imaging", available: true },
  radiology_request: { label: "New radiology request", Icon: ImageIcon, target: "imaging", available: false },
  lab_report: { label: "Laboratory Results Available", Icon: FlaskConical, target: "mylabresults", available: true },
  lab_request: { label: "New lab request", Icon: FlaskConical, target: "labs", available: false },
  prescription: { label: "New prescription", Icon: Pill, target: "drugs", available: false },
  document: { label: "New medical report", Icon: FileText, target: "documents", available: true },
};

function kindOf(item) {
  const type = String(item?.type || "");
  const target = String(item?.target || "");
  const title = String(item?.title || "").toLowerCase();

  if (type === "lab_results" || /lab(?:oratory)? (?:results?|report)/.test(title)) return "lab_report";
  if (type === "lab_request" || /lab(?:oratory)? request/.test(title)) return "lab_request";
  if (["imaging_critical", "critical_finding", "imaging_results"].includes(type) || /(radiology|imaging) (report|result)/.test(title)) {
    return "radiology_report";
  }
  if (type === "imaging" || /(radiology|imaging) request/.test(title)) return "radiology_request";
  if (type === "medication_update" || target === "prescriptions" || /prescription/.test(title)) return "prescription";
  if (type === "document" || target === "documents") return "document";
  return null;
}

export default function PatientHomeRecentActivity({ items, onNavigate, onViewAll }) {
  const { t, locale } = usePatientLanguage();

  const entries = (items || [])
    .map((item) => ({ item, kind: kindOf(item) }))
    .filter((entry) => entry.kind)
    .slice(0, 3);

  return (
    <section className="rounded-2xl border border-border bg-card p-3 sm:p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-heading text-sm font-bold text-patient-ink sm:text-base">
          <Clock className="h-4 w-4 text-primary" aria-hidden="true" />
          {t("Recent Activity")}
        </h2>
        <button
          type="button"
          onClick={onViewAll}
          className="inline-flex shrink-0 items-center gap-0.5 text-xs font-semibold text-primary"
        >
          {t("View All")}
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>

      {!entries.length ? (
        <p className="mt-3 text-xs text-patient-muted">{t("No recent activity")}</p>
      ) : (
        <div className="relative mt-3">
          <span aria-hidden="true" className="absolute bottom-4 left-[15px] top-4 w-px bg-border" />
          <ul className="relative space-y-3">
            {entries.map(({ item, kind }) => {
              const { label, Icon, target, available } = KINDS[kind];
              const when = item.created_date
                ? new Date(item.created_date).toLocaleString(locale, {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })
                : "";
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onNavigate?.(target)}
                    className="flex w-full items-start gap-3 text-start"
                  >
                    <span className="relative z-10 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-patient-canvas text-primary ring-4 ring-card">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-2">
                        <span className="text-xs font-semibold leading-tight text-patient-ink">{t(label)}</span>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold ${
                            available ? "bg-emerald-50 text-emerald-700" : "bg-accent text-primary"
                          }`}
                        >
                          {t(available ? "Available" : "New")}
                        </span>
                      </span>
                      {when && <span className="mt-0.5 block text-[10px] text-patient-muted">{when}</span>}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}