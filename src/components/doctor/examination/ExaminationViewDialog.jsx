import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getExaminationType, OVERALL_STATUS_LABELS } from "@/lib/examinations";
import { formatFieldValue } from "./ExaminationField";
import { SectionStatusBadge, SECTION_STATUS_STYLES } from "./ExaminationSectionCard";

const OVERALL_STYLES = {
  normal: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  abnormal: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  partially_completed: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
};

const OverallBadge = ({ status }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${OVERALL_STYLES[status] || OVERALL_STYLES.partially_completed}`}>
    {OVERALL_STATUS_LABELS[status] || "Partially Completed"}
  </span>
);

const fmtDatetime = (iso) => {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString();
  } catch (e) {
    return iso;
  }
};

// Read-only view of a saved examination. Completed records are immutable —
// corrections happen through the Amend action, which creates a new version.
export default function ExaminationViewDialog({ record, open, onOpenChange, onAmend }) {
  if (!record) return null;
  const type = getExaminationType(record.examination_type_key);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader className="text-left space-y-1.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <DialogTitle className="text-base">{record.examination_type}</DialogTitle>
            <OverallBadge status={record.overall_status} />
          </div>
          <DialogDescription className="text-xs">
            {record.patient_name} · CIN {record.patient_cin} · {record.examination_id}
          </DialogDescription>
          <p className="text-xs text-muted-foreground">
            {record.examination_date}
            {record.examination_time ? ` · ${record.examination_time}` : ""} · Dr. {record.doctor_name} ·{" "}
            {record.clinical_location} · Encounter {record.encounter_id}
            {record.version > 1 ? ` · Version ${record.version} (amended)` : ""}
          </p>
        </DialogHeader>

        {record.version > 1 && (
          <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 p-3 text-xs">
            <p className="font-medium text-amber-700 dark:text-amber-300">Amended version {record.version}</p>
            <p className="text-muted-foreground mt-0.5">
              Reason: {record.edit_reason || "—"} · by Dr. {record.edited_by_name}
              {record.edited_datetime ? ` · ${fmtDatetime(record.edited_datetime)}` : ""}
            </p>
            <p className="text-muted-foreground mt-0.5">The original version {record.version - 1} remains available in the examination history.</p>
          </div>
        )}

        <div className="space-y-3">
          {(record.sections || []).map((sec) => {
            const spec = type?.sections.find((s) => s.key === sec.key);
            const rows = spec
              ? [...(spec.fields || []), ...(spec.abnormalFields || [])]
                  .map((f) => ({ label: f.type === "cn" ? `${f.cnNumber} — ${f.cnName}` : f.label, text: formatFieldValue(f, (sec.values || {})[f.key]) }))
                  .filter((r) => r.text)
              : [];
            const hasContent = rows.length > 0 || (sec.notes && sec.notes.trim());
            return (
              <div key={sec.key} className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="flex items-center justify-between gap-2 p-3 border-b border-border bg-secondary/30">
                  <span className="font-medium text-sm">{sec.title}</span>
                  <SectionStatusBadge status={sec.status} />
                </div>
                {hasContent ? (
                  <div className="p-3 space-y-2">
                    {rows.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
                        {rows.map((r, i) => (
                          <div key={i} className="text-xs">
                            <span className="text-muted-foreground">{r.label}: </span>
                            <span className="font-medium">{r.text}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {sec.notes && sec.notes.trim() && (
                      <div className="text-xs">
                        <span className="text-muted-foreground">Notes: </span>
                        <span className="whitespace-pre-wrap">{sec.notes}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3 text-xs text-muted-foreground">
                    {sec.status === "normal" ? "Documented as Normal." : "Not documented."}
                  </div>
                )}
              </div>
            );
          })}

          {record.additional_notes && record.additional_notes.trim() && (
            <div className="rounded-xl border border-border bg-card p-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">Additional Notes</p>
              <p className="text-xs whitespace-pre-wrap">{record.additional_notes}</p>
            </div>
          )}

          {(record.audit_trail || []).length > 0 && (
            <div className="rounded-xl border border-border bg-card p-3">
              <p className="text-xs font-medium text-muted-foreground mb-1.5">Audit Trail</p>
              <div className="space-y-1">
                {record.audit_trail.map((a, i) => (
                  <p key={i} className="text-[11px] text-muted-foreground">
                    <span className={`inline-flex px-1.5 py-0.5 rounded-full font-medium mr-1.5 ${SECTION_STATUS_STYLES.partially_completed}`}>
                      {a.action}
                    </span>
                    {a.by_name ? `by Dr. ${a.by_name} · ` : ""}
                    {fmtDatetime(a.datetime)}
                    {a.details ? ` — ${a.details}` : ""}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-1">
          {onAmend && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAmend(record)}
            >
              Amend This Examination
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}