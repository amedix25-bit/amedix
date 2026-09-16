import React, { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Interactive dental Tooth Chart (FDI numbering) — a dedicated component, not
// ordinary paperwork. Entries (tooth, status, note) are saved inside the
// dental document's structured data and therefore attached to the patient's
// dental encounters and longitudinal treatment history. Previous dental
// documents' entries are overlaid so the chart always reflects the patient's
// dental treatment history.
export const TOOTH_STATUSES = [
  { key: "sound", label: "Sound", cls: "bg-white text-foreground border-border" },
  { key: "planned", label: "Planned Treatment", cls: "bg-white border-dashed border-primary text-primary" },
  { key: "caries", label: "Caries / Decay", cls: "bg-red-500/85 text-white border-red-500" },
  { key: "filled", label: "Filled / Restored", cls: "bg-blue-500/85 text-white border-blue-500" },
  { key: "crown", label: "Crown", cls: "bg-amber-400 text-amber-950 border-amber-500" },
  { key: "root_canal", label: "Root Canal Treated", cls: "bg-purple-500/85 text-white border-purple-500" },
  { key: "implant", label: "Implant", cls: "bg-teal-500/85 text-white border-teal-500" },
  { key: "missing", label: "Missing / Extracted", cls: "bg-slate-300 text-slate-600 border-slate-400 line-through" },
];

const QUADRANTS = [
  { label: "Upper Right", teeth: [18, 17, 16, 15, 14, 13, 12, 11] },
  { label: "Upper Left", teeth: [21, 22, 23, 24, 25, 26, 27, 28] },
  { label: "Lower Left", teeth: [31, 32, 33, 34, 35, 36, 37, 38] },
  { label: "Lower Right", teeth: [41, 42, 43, 44, 45, 46, 47, 48] },
];

const statusLabel = (key) => TOOTH_STATUSES.find((s) => s.key === key)?.label || key;
const statusCls = (key) => TOOTH_STATUSES.find((s) => s.key === key)?.cls || "bg-white text-foreground border-border";

export default function ToothChart({ value = [], onChange, history = {}, readOnly = false }) {
  const [selected, setSelected] = useState(null);
  const [status, setStatus] = useState("");
  const [note, setNote] = useState("");

  const entries = {};
  (value || []).forEach((e) => { if (e && e.tooth) entries[e.tooth] = e; });

  const selectTooth = (tooth) => {
    const existing = entries[tooth];
    setSelected(tooth);
    setStatus(existing?.status || "");
    setNote(existing?.note || "");
  };

  const apply = () => {
    if (!selected || !status) return;
    const others = (value || []).filter((e) => e.tooth !== selected);
    onChange([...others, { tooth: selected, status, note: (note || "").trim() }]);
    setSelected(null);
    setStatus("");
    setNote("");
  };

  const clearTooth = () => {
    onChange((value || []).filter((e) => e.tooth !== selected));
    setSelected(null);
    setStatus("");
    setNote("");
  };

  const toothTitle = (t) => {
    if (entries[t]) {
      const e = entries[t];
      return `Tooth ${t}: ${statusLabel(e.status)}${e.note ? ` — ${e.note}` : ""}`;
    }
    const h = history[t];
    if (h) {
      return `Tooth ${t}: previous — ${statusLabel(h.status)}${h.note ? ` — ${h.note}` : ""}${h.doc ? ` (${h.doc})` : ""}`;
    }
    return `Tooth ${t}`;
  };

  return (
    <div className="rounded-xl border border-border bg-background p-4 space-y-3">
      <div className="space-y-2">
        {QUADRANTS.map((q) => (
          <div key={q.label} className="flex items-center gap-2">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide w-16 shrink-0">
              {q.label}
            </span>
            <div className="flex gap-1">
              {q.teeth.map((t) => (
                <button
                  key={t}
                  type="button"
                  disabled={readOnly}
                  onClick={() => selectTooth(t)}
                  title={toothTitle(t)}
                  className={`relative h-10 w-9 rounded-md border text-xs font-medium transition-shadow disabled:cursor-default ${
                    statusCls(entries[t]?.status || "sound")
                  } ${selected === t ? "ring-2 ring-ring ring-offset-1" : ""} ${
                    !readOnly ? "hover:shadow-md cursor-pointer" : ""
                  }`}
                >
                  {t}
                  {!entries[t] && history[t] && (
                    <span
                      className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-primary"
                      title={toothTitle(t)}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-1.5">
        {TOOTH_STATUSES.map((s) => (
          <span key={s.key} className={`text-[10px] px-1.5 py-0.5 rounded-md border ${s.cls}`}>
            {s.label}
          </span>
        ))}
        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-primary text-primary-foreground">
          ● Previous dental history
        </span>
      </div>

      {/* Interactive per-tooth entry panel */}
      {!readOnly && selected != null && (
        <div className="rounded-lg border border-border bg-card p-3 space-y-2">
          <p className="text-sm font-semibold">Tooth {selected}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Status</span>
              <Select value={status || undefined} onValueChange={setStatus}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status..." />
                </SelectTrigger>
                <SelectContent>
                  {TOOTH_STATUSES.map((s) => (
                    <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Note (optional)</span>
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Occlusal caries, composite filling placed" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" size="sm" onClick={apply} disabled={!status}>Apply to Tooth {selected}</Button>
            {entries[selected] && (
              <Button type="button" size="sm" variant="outline" onClick={clearTooth}>Clear Tooth</Button>
            )}
            <Button type="button" size="sm" variant="ghost" onClick={() => setSelected(null)}>Close</Button>
          </div>
        </div>
      )}

      {/* Summary of charted findings */}
      {Object.keys(entries).length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Charted in this document
          </p>
          <div className="flex flex-wrap gap-1.5">
            {Object.values(entries).map((e) => (
              <span key={e.tooth} className="text-xs bg-secondary px-2 py-1 rounded-md">
                Tooth {e.tooth} — {statusLabel(e.status)}{e.note ? ` (${e.note})` : ""}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}