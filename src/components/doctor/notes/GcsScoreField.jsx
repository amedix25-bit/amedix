import React from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShieldCheck } from "lucide-react";

// Glasgow Coma Scale — the three components exactly as the examiner documented
// them. The app adds the three numbers up and shows the sum; it does not assign
// a severity category, because the band is a clinical interpretation of a total
// that is only meaningful when each component was actually assessed.
const EYE = ["4 — Spontaneous", "3 — To speech", "2 — To pain", "1 — None"];
const VERBAL = ["5 — Oriented", "4 — Confused", "3 — Inappropriate words", "2 — Incomprehensible sounds", "1 — None", "NT — Intubated"];
const MOTOR = ["6 — Obeys commands", "5 — Localising", "4 — Withdrawal", "3 — Abnormal flexion", "2 — Extension", "1 — None"];

const score = (v) => {
  const n = parseInt(String(v || "").split(" — ")[0], 10);
  return Number.isFinite(n) ? n : null;
};

export default function GcsScoreField({ value, onChange }) {
  const v = value && typeof value === "object" ? value : {};
  const eye = score(v.eye);
  const verbal = score(v.verbal);
  const motor = score(v.motor);
  const complete = eye !== null && verbal !== null && motor !== null;
  const verbalNotTestable = v.verbal === "NT — Intubated";

  const set = (patch) => onChange({ ...v, ...patch });

  const Row = ({ label, options, field }) => (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Select value={v[field] || undefined} onValueChange={(val) => set({ [field]: val })}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select..." />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o} value={o}>
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div className="space-y-3 rounded-lg border border-border p-3">
      <Row label="Eye opening (E)" options={EYE} field="eye" />
      <Row label="Verbal response (V)" options={VERBAL} field="verbal" />
      <Row label="Motor response (M)" options={MOTOR} field="motor" />
      <div className="rounded-md bg-muted/60 px-2.5 py-2 text-xs">
        {complete ? (
          <span className="font-medium">
            GCS {eye + verbal + motor} (E{eye} V{verbal} M{motor}) — sum of the documented components
          </span>
        ) : verbalNotTestable ? (
          <span className="font-medium">GCS not calculable — verbal response not testable (intubated)</span>
        ) : (
          <span className="text-muted-foreground">
            The total appears once all three components are documented. An unanswered component is never read as normal.
          </span>
        )}
        <p className="text-[11px] text-muted-foreground mt-1 flex items-start gap-1">
          <ShieldCheck className="w-3 h-3 mt-0.5 shrink-0" />
          Component scores are recorded as examined by the clinician. AMedix does not grade severity, predict outcome or
          decide care from this total.
        </p>
      </div>
    </div>
  );
}