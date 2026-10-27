import React, { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, Plus, X, Check, Stethoscope } from "lucide-react";
import ExaminationSectionCard from "@/components/doctor/examination/ExaminationSectionCard";
import {
  getExaminationType,
  computeOverallStatus,
  OVERALL_STATUS_LABELS,
} from "@/lib/examinations";
import {
  examinationOptionsFor,
  parseExaminationValue,
} from "@/lib/examinations/clinicalExaminations";

const OVERALL_STYLES = {
  normal: "bg-emerald-100 text-emerald-700",
  abnormal: "bg-red-100 text-red-700",
  partially_completed: "bg-amber-100 text-amber-700",
};

// "Select Examination" — the clinician searches and selects one or more
// examinations appropriate to the specialty, then documents each of them with
// its structured sections (Normal / Abnormal / Not assessed, findings, notes).
// Nothing is preselected and nothing is assumed: an undocumented section stays
// Not Documented, so an examination is never falsely recorded as normal.
//
// `types` are examination type keys; when omitted every engine type is offered.
export default function SelectExamination({ value, onChange, types, specialtyKey }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const parsed = parseExaminationValue(value);

  const options = useMemo(() => {
    const list = examinationOptionsFor(specialtyKey, types);
    return list.length > 0 ? list : examinationOptionsFor("internal_medicine");
  }, [specialtyKey, types]);

  const search = query.trim().toLowerCase();
  const visible = search
    ? options.filter((o) => `${o.label} ${o.description}`.toLowerCase().includes(search))
    : options;

  const emit = (next) => {
    onChange(next.selected.length === 0 ? "" : JSON.stringify(next));
  };

  const toggleType = (key) => {
    const selected = parsed.selected.includes(key)
      ? parsed.selected.filter((k) => k !== key)
      : [...parsed.selected, key];
    emit({ selected, data: parsed.data });
  };

  const removeType = (key) => {
    const data = { ...parsed.data };
    delete data[key];
    emit({ selected: parsed.selected.filter((k) => k !== key), data });
  };

  const setSection = (typeKey, sectionKey, sectionData) => {
    const typeData = { ...(parsed.data[typeKey] || {}), [sectionKey]: sectionData };
    emit({ selected: parsed.selected, data: { ...parsed.data, [typeKey]: typeData } });
  };

  return (
    <div className="rounded-lg border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left"
      >
        <span className="text-sm font-medium inline-flex items-center gap-1.5">
          <Stethoscope className="w-4 h-4 text-primary" />
          Select Examination
        </span>
        <span className="text-xs text-muted-foreground">
          {parsed.selected.length > 0
            ? `${parsed.selected.length} selected — click to change`
            : "Search and select"}
        </span>
      </button>

      {open && (
        <div className="border-t border-border p-3 space-y-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search examinations (abdominal, cardiovascular, neurological…)"
              className="h-9 text-sm pl-8"
            />
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-56 overflow-y-auto">
            {visible.map((o) => {
              const active = parsed.selected.includes(o.key);
              return (
                <button
                  key={o.key}
                  type="button"
                  onClick={() => toggleType(o.key)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border transition-colors ${
                    active
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-foreground border-border hover:bg-accent"
                  }`}
                >
                  {active ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                  {o.label}
                </button>
              );
            })}
            {visible.length === 0 && (
              <p className="text-xs text-muted-foreground">No examination matches “{query}”.</p>
            )}
          </div>
        </div>
      )}

      {parsed.selected.length > 0 && (
        <div className="border-t border-border p-3 space-y-3">
          {parsed.selected.map((typeKey) => {
            const type = getExaminationType(typeKey);
            if (!type) return null;
            const typeData = parsed.data[typeKey] || {};
            const overall = computeOverallStatus(type, typeData);
            return (
              <div key={typeKey} className="rounded-lg border border-border overflow-hidden">
                <div className="flex items-center justify-between gap-2 px-3 py-2 bg-muted/40">
                  <p className="text-sm font-medium">{type.label}</p>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                        OVERALL_STYLES[overall] || "bg-muted text-muted-foreground"
                      }`}
                    >
                      {OVERALL_STATUS_LABELS[overall] || "Not Assessed"}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeType(typeKey)}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label={`Remove ${type.label}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="p-3 space-y-2">
                  {(type.sections || []).map((spec) => (
                    <ExaminationSectionCard
                      key={spec.key}
                      spec={spec}
                      data={typeData[spec.key]}
                      onChange={(d) => setSection(typeKey, spec.key, d)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
          <p className="text-xs text-muted-foreground">
            Sections left blank stay Not Documented. Record “Not assessed” where an examination was not performed —
            nothing is recorded as normal unless you mark it Normal.
          </p>
        </div>
      )}
    </div>
  );
}