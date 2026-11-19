import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/doctor/dictation/DictationTextarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown } from "lucide-react";
import { uroStagingFields, URO_STAGING_NOTICE, URO_MDT_NOTICE, uroCancer } from "@/lib/uroOncology";
import { asObject } from "@/lib/uroFieldKit";

// The staging, tumour-board and surveillance record for one tumour type. AMedix
// records the categories the clinician documents and never derives a stage group,
// a risk group, a nomogram or a prognosis. A category left blank is reported as
// not documented — never as N0, M0 or low risk.

const bucketOf = (key) => {
  if (["tnm_edition", "t_category", "n_category", "m_category", "grade_documented"].includes(key)) return "Classification documented";
  if (key.startsWith("mdt_")) return "Tumour board record";
  if (key.startsWith("surveillance_") || key === "next_surveillance_date") return "Surveillance";
  if (key === "staging_note") return "Clinician's staging note";
  return "Tumour-specific documentation";
};

const ORDER = [
  "Classification documented",
  "Tumour-specific documentation",
  "Tumour board record",
  "Surveillance",
  "Clinician's staging note",
];

function FieldInput({ field, value, onChange }) {
  if (field.type === "textarea") {
    return <Textarea rows={3} value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder="Not documented" />;
  }
  if (field.type === "select") {
    return (
      <Select value={value || undefined} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Not documented" />
        </SelectTrigger>
        <SelectContent>
          {field.options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }
  if (field.type === "multi") {
    const chosen = Array.isArray(value) ? value : [];
    return (
      <div className="flex flex-wrap gap-1.5">
        {field.options.map((option) => {
          const active = chosen.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(active ? chosen.filter((v) => v !== option) : [...chosen, option])}
              className={`rounded-md border px-2 py-1 text-[11px] transition-colors ${
                active ? "border-primary bg-primary/10 font-medium text-primary" : "border-border bg-card text-muted-foreground hover:bg-muted/60"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
    );
  }
  if (field.type === "number") {
    return (
      <div className="flex items-center gap-2">
        <Input type="number" step="any" min={field.min} max={field.max} value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
        {field.unit ? <span className="shrink-0 text-[11px] text-muted-foreground">{field.unit}</span> : null}
      </div>
    );
  }
  if (field.type === "date") {
    return <Input type="date" value={value || ""} onChange={(e) => onChange(e.target.value)} />;
  }
  return <Input value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder="Not documented" />;
}

export default function UroStagingField({ value, onChange, cancerKey, fields }) {
  const state = asObject(value);
  const cancer = uroCancer(cancerKey);
  const all = Array.isArray(fields) && fields.length ? fields : uroStagingFields(cancerKey);

  const grouped = ORDER.map((bucket) => ({ bucket, rows: all.filter((f) => bucketOf(f.key) === bucket) })).filter((g) => g.rows.length);

  return (
    <div className="space-y-3">
      {cancer ? (
        <p className="rounded-md bg-muted/50 px-2.5 py-2 text-[11px] leading-relaxed text-foreground">
          <span className="font-semibold">{cancer.label}</span> — record the categories exactly as reported by the
          histopathology and imaging in use at your institution, and state the classification edition in the note.
        </p>
      ) : null}

      {grouped.map((group) => (
        <div key={group.bucket} className="overflow-hidden rounded-lg border border-border">
          <div className="flex items-center gap-1.5 bg-muted/40 px-3 py-2">
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-semibold uppercase tracking-wide text-primary">{group.bucket}</span>
          </div>
          <div className="space-y-2.5 px-3 pb-3 pt-3">
            {group.rows.map((field) => (
              <div key={field.key} className="space-y-1">
                <Label className="text-xs font-medium">{field.label}</Label>
                <FieldInput field={field} value={state[field.key]} onChange={(next) => onChange({ ...state, [field.key]: next })} />
              </div>
            ))}
          </div>
        </div>
      ))}

      <p className="text-[11px] leading-relaxed text-muted-foreground">{URO_STAGING_NOTICE}</p>
      <p className="text-[11px] leading-relaxed text-muted-foreground">{URO_MDT_NOTICE}</p>
    </div>
  );
}