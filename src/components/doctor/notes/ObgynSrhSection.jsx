import React, { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, ChevronRight, Lock, ShieldCheck, Info } from "lucide-react";
import ObgynSrhField from "@/components/doctor/notes/ObgynSrhField";
import { srhGroupsForDoc, SRH_SOURCE_OPTIONS, SRH_SOURCE_KEY } from "@/lib/obgynSrhSchema";

// Structured, expandable Sexual & Reproductive History for OB/GYN notes —
// separate from the Clinical Examination section. Doctors expand only the
// groups relevant to the encounter; entered values survive collapsing because
// all values live in the parent note's state. Nothing is pre-filled and no
// history is inferred — every answer is clinician-documented with the patient.
export default function ObgynSrhSection({ docKey, values, onChange }) {
  const groups = useMemo(() => srhGroupsForDoc(docKey), [docKey]);
  const [open, setOpen] = useState(() => new Set());

  const v = values || {};
  const setVal = (key, val) => onChange({ ...v, [key]: val });

  const toggle = (key) =>
    setOpen((s) => {
      const n = new Set(s);
      if (n.has(key)) n.delete(key);
      else n.add(key);
      return n;
    });

  return (
    <div className="space-y-3">
      {/* Sensitive-information guidance — consent for intimate physical
          examinations is recorded separately in the Clinical Examination
          section, never inside this sexual history. */}
      <div className="rounded-lg border border-indigo-200 bg-indigo-50/60 p-3 space-y-1.5">
        <p className="text-xs font-medium text-indigo-900 flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 shrink-0" /> Sensitive history — private &amp; trauma-informed
        </p>
        <p className="text-[11px] text-indigo-900/80 leading-relaxed">
          Offer the patient a private opportunity to discuss sexual health. Sensitive questions are not asked in front of a partner
          or accompanying person unless the patient explicitly requests their presence and it is appropriate. Follow applicable
          safeguarding, confidentiality and mandatory-reporting requirements. Consent for intimate physical examination is recorded
          separately in the Clinical Examination section.
        </p>
      </div>

      {/* Information source — patient-reported vs verified, per encounter. */}
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Information Source</Label>
          <Select value={v[SRH_SOURCE_KEY] || ""} onValueChange={(val) => setVal(SRH_SOURCE_KEY, val)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Not documented" /></SelectTrigger>
            <SelectContent>
              {SRH_SOURCE_OPTIONS.map((o) => (
                <SelectItem key={o} value={o}>{o}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Expandable history groups — collapsed by default, values preserved
          when collapsed because they live in the note's state. */}
      {groups.map((group) => {
        const filled = group.fields.filter((f) => String(v[f.key] ?? "").trim() !== "").length;
        const isOpen = open.has(group.key);
        return (
          <div key={group.key} className="rounded-lg border border-border overflow-hidden">
            <button
              type="button"
              className="w-full flex items-center justify-between gap-3 px-3 py-2.5 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
              onClick={() => toggle(group.key)}
            >
              <span className="flex items-center gap-2 min-w-0">
                {isOpen ? <ChevronDown className="w-4 h-4 shrink-0 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 shrink-0 text-muted-foreground" />}
                <span className="text-sm font-medium truncate">{group.label}</span>
                {!isOpen && filled > 0 && (
                  <span className="shrink-0 text-[11px] text-muted-foreground">{filled} documented</span>
                )}
              </span>
            </button>
            {isOpen && (
              <div className="p-3 space-y-2">
                <p className="text-[11px] text-muted-foreground flex items-start gap-1.5">
                  <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  Complete only what is clinically relevant — every field also supports Not Assessed, Not Applicable or Prefers Not to Answer.
                </p>
                {group.fields.map((f) => (
                  <ObgynSrhField key={f.key} field={f} value={v[f.key]} onChange={setVal} />
                ))}
              </div>
            )}
          </div>
        );
      })}

      {groups.length === 0 && (
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5" />
          Sexual &amp; reproductive history is not part of this encounter type.
        </p>
      )}
    </div>
  );
}