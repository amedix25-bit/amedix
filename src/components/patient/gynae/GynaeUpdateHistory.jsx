import React from "react";
import { History } from "lucide-react";
import { normalizeGynaeHistory, GYNAE_SECTION_LABELS } from "@/lib/gynaeObstetric";
import { usePatientLanguage } from "@/lib/patientLanguage";

// The update history of the patient's one Gynaecological & Obstetric History:
// every save (a part-finished save or a completed update) with its date, who
// made it and which parts changed. It is how previously recorded information
// is told apart from newly updated information.
export default function GynaeUpdateHistory({ history }) {
  const { t, isArabic } = usePatientLanguage();
  const g = normalizeGynaeHistory(history);
  const revisions = [...(g.revisions || [])].reverse();

  const when = (iso) =>
    iso
      ? new Date(iso).toLocaleString(isArabic ? "ar" : "en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";

  return (
    <div className="rounded-xl border border-border bg-muted/50 p-4">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-primary">
        <History className="w-3.5 h-3.5" /> {t("Update history")}
      </p>
      {revisions.length === 0 ? (
        <p className="text-[11px] text-muted-foreground mt-1">{t("No updates yet.")}</p>
      ) : (
        <ul className="mt-2 space-y-1">
          {revisions.map((rev) => (
            <li key={rev.revision_id} className="text-[11px] text-muted-foreground">
              <span className="font-medium text-foreground">{when(rev.datetime)}</span>
              {" · "}
              {rev.status === "in_progress" ? t("Draft") : t("Completed")}
              {rev.sections_changed?.length
                ? ` · ${rev.sections_changed.map((key) => t(GYNAE_SECTION_LABELS[key])).join(", ")}`
                : ""}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}