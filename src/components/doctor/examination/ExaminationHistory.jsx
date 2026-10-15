import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { OVERALL_STATUS_LABELS } from "@/lib/examinations";

const OVERALL_STYLES = {
  normal: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  abnormal: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  partially_completed: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
};

const OverallBadge = ({ status }) => (
  <span
    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap ${
      OVERALL_STYLES[status] || OVERALL_STYLES.partially_completed
    }`}
  >
    {OVERALL_STATUS_LABELS[status] || "Partially Completed"}
  </span>
);

// Examination History — previous examinations as dated cards. Records are
// immutable: each version stays reviewable forever.
export default function ExaminationHistory({ patient, reloadKey, onView, onAmend }) {
  const [items, setItems] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!patient?.id) return;
      try {
        const list = await base44.entities.PatientExamination.filter(
          { patient_id: patient.id },
          "-created_datetime"
        );
        setItems(list);
      } catch (err) {
        console.error(err);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    setLoading(true);
    load();
  }, [patient?.id, reloadKey]);

  if (loading) {
    return (
      <div className="flex items-center text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        Loading examination history…
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No examinations documented for this patient yet. Start one with New Examination.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((e) => (
        <div
          key={e.id}
          className="rounded-xl border border-border bg-card p-4 flex flex-wrap items-center justify-between gap-3"
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium text-sm">{e.examination_type}</p>
              <OverallBadge status={e.overall_status} />
              {e.version > 1 && (
                <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium bg-secondary text-secondary-foreground">
                  v{e.version} · amended
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {e.examination_date}
              {e.examination_time ? ` · ${e.examination_time}` : ""} · Dr. {e.doctor_name} ·{" "}
              {e.clinical_location}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {e.examination_id} · Visit {e.encounter_id}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => onView(e)}>
              View Examination
            </Button>
            {onAmend && (
              <Button variant="ghost" size="sm" onClick={() => onAmend(e)}>
                Amend
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}