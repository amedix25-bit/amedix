import React from "react";
import { Activity } from "lucide-react";
import { usePatientLanguage } from "@/lib/patientLanguage";

const DOT_TONES = {
  lab_results: "bg-patient-teal",
  lab_request: "bg-patient-teal",
  appointment: "bg-patient-accent",
  rescheduled: "bg-patient-accent",
  doctor_message: "bg-patient-purple",
  medication_update: "bg-patient-green",
  medication_reminder: "bg-patient-green",
  recall: "bg-patient-red",
  other: "bg-patient-muted",
};

const formatWhen = (value) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};

// The newest events on the patient's record, newest first.
export default function PatientRecentActivity({ items }) {
  const { t } = usePatientLanguage();

  return (
    <div className="pp-glass p-5">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-patient-purple/12 text-patient-purple">
          <Activity className="h-4 w-4" />
        </span>
        <h2 className="text-sm font-bold text-patient-ink">{t("Recent Activity")}</h2>
      </div>

      {items.length === 0 ? (
        <p className="mt-4 text-sm text-patient-muted">{t("No recent activity")}</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {items.map((item) => (
            <li key={item.id} className="flex items-start gap-2.5">
              <span
                className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${DOT_TONES[item.type] || DOT_TONES.other}`}
              />
              <span className="min-w-0 flex-1 text-sm font-medium leading-snug text-patient-ink">
                {item.title}
              </span>
              <span className="shrink-0 text-[11px] font-medium text-patient-muted">
                {formatWhen(item.created_date)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}