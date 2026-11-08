import React, { useMemo } from "react";
import { AlertTriangle, Pill, Plus, ShieldCheck } from "lucide-react";
import AllergyTreatmentEntry from "@/components/doctor/notes/AllergyTreatmentEntry";
import {
  DOSING_RULE,
  TREATMENT_CLASSES,
  TREATMENT_NOTICE,
  emptyTreatmentEntry,
  treatmentDocumentationGaps,
} from "@/lib/allergyTreatment";

// Treatment & management documentation for Allergy & Immunology.
//
// Records what the clinician decided — agent, indication, route, adult and
// paediatric doses as documented, monitoring, cautions and rationale — and
// shows the documentation gaps that remain. It never calculates a dose, never
// places an order and never converts a plan into a diagnosis. Ordering happens
// in the existing AMedix prescription flow, where the existing medication
// safety, allergy and contraindication checks and clinician approval apply.
export default function AllergyTreatmentField({ value = [], onChange }) {
  const entries = Array.isArray(value) ? value : [];
  const gaps = useMemo(() => treatmentDocumentationGaps(entries), [entries]);

  const addClass = (key) => {
    const entry = emptyTreatmentEntry(key);
    entry.reference_keys = (TREATMENT_CLASSES.find((c) => c.key === key)?.references || []).slice();
    onChange([...entries, entry]);
  };

  const update = (index, patch) =>
    onChange(entries.map((e, i) => (i === index ? { ...e, ...patch } : e)));

  const remove = (index) => onChange(entries.filter((_, i) => i !== index));

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border bg-muted/40 p-2.5 space-y-1">
        <p className="text-xs font-medium flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-primary" /> Documented plan — AMedix never prescribes or calculates
        </p>
        <p className="text-[11px] text-muted-foreground leading-relaxed">{TREATMENT_NOTICE}</p>
        <p className="text-[11px] text-muted-foreground">{DOSING_RULE}</p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {TREATMENT_CLASSES.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => addClass(c.key)}
            className="text-[11px] border border-border rounded-full px-2.5 py-1 hover:bg-muted/60 inline-flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> {c.label}
          </button>
        ))}
      </div>

      {entries.length === 0 && (
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Pill className="w-3.5 h-3.5" /> No treatment documented yet. Add the classes that apply to this plan.
        </p>
      )}

      {entries.map((entry, i) => (
        <AllergyTreatmentEntry
          key={`${entry.treatment_class}-${i}`}
          entry={entry}
          index={i}
          onChange={update}
          onRemove={remove}
        />
      ))}

      {gaps.length > 0 && (
        <div className="rounded-lg border border-amber-300/70 dark:border-amber-800/60 bg-amber-50/70 dark:bg-amber-950/20 p-2.5 space-y-1">
          <p className="text-[11px] font-medium text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> Documentation gaps in this plan
          </p>
          {gaps.map((g) => (
            <p key={g.key} className="text-[11px] text-amber-800/90 dark:text-amber-300/90">· {g.text}</p>
          ))}
          <p className="text-[10px] text-amber-800/70 dark:text-amber-300/70">
            Advisory only. Nothing is blocked, changed or ordered; the treating clinician decides and documents.
          </p>
        </div>
      )}
    </div>
  );
}