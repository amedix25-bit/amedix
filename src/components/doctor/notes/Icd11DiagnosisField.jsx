import React, { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ICD11_MMS,
  RHEUM_ICD11,
  DIAGNOSIS_ROLES,
  DIAGNOSIS_STATUSES,
  SPECIFICITY,
  matchesIcd11,
} from "@/lib/rheumIcd11";
import { AlertTriangle, ExternalLink, Plus, Search, ShieldCheck, X } from "lucide-react";

const EMPTY_MANUAL = { code: "", display: "", specificity: SPECIFICITY.SUB, source: "" };

const newEntry = (item, entries) => ({
  code: item.code,
  display: item.display,
  definition: item.definition || "",
  specificity: item.specificity || SPECIFICITY.SUB,
  version: `${ICD11_MMS.label} (${ICD11_MMS.release})`,
  criteria_reference: item.criteria || "",
  role: entries.some((e) => e.role === "Primary") ? "Secondary" : "Primary",
  status: "Suspected",
  basis: "",
  follow_up: "",
  manual: item.manual || false,
});

// Searchable ICD-11 diagnosis selection. A code is only ever taken from the
// verified catalogue or entered by the clinician from the WHO browser — the
// app never generates a code. Selecting a code never confirms a diagnosis:
// it is recorded as Suspected until the clinician documents otherwise.
export default function Icd11DiagnosisField({ value = [], onChange }) {
  const entries = Array.isArray(value) ? value : [];
  const [query, setQuery] = useState("");
  const [manualOpen, setManualOpen] = useState(false);
  const [manual, setManual] = useState(EMPTY_MANUAL);

  const results = useMemo(() => RHEUM_ICD11.filter((i) => matchesIcd11(i, query)).slice(0, 8), [query]);
  const allCodes = new Set(entries.map((e) => e.code));

  const add = (item) => {
    onChange([...entries, newEntry(item, entries)]);
    setQuery("");
  };

  const addManual = () => {
    if (!manual.code.trim() || !manual.display.trim() || !manual.source.trim()) return;
    add({ ...manual, manual: true, definition: "Code and official term entered by the clinician from the WHO ICD-11 browser." });
    setManual(EMPTY_MANUAL);
    setManualOpen(false);
  };

  const update = (index, patch) =>
    onChange(
      entries.map((e, i) => {
        if (i !== index) {
          // Only one primary diagnosis is retained.
          return patch.role === "Primary" && e.role === "Primary" ? { ...e, role: "Secondary" } : e;
        }
        return { ...e, ...patch };
      })
    );

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border bg-muted/40 p-2.5 space-y-1">
        <p className="text-xs font-medium flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-primary" /> Diagnoses are documented, never auto-confirmed
        </p>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Codes come from {ICD11_MMS.label} ({ICD11_MMS.release}) or are entered from the WHO browser. A keyword, antibody,
          laboratory result or imaging finding alone never confirms a diagnosis.
        </p>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
        <Input
          className="pl-9"
          value={query}
          placeholder="Search ICD-11 — rheumatoid arthritis, lupus, gout, ANCA, axial spondyloarthritis..."
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {query.trim() && (
        <div className="rounded-lg border border-border divide-y divide-border max-h-72 overflow-y-auto">
          {results.length === 0 && (
            <p className="p-3 text-xs text-muted-foreground">
              No catalogue match. Enter the verified code and official term from the WHO ICD-11 browser below.
            </p>
          )}
          {results.map((item) => (
            <button
              type="button"
              key={item.code}
              disabled={allCodes.has(item.code)}
              onClick={() => add(item)}
              className="w-full text-left p-3 hover:bg-muted/60 disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-semibold text-primary">{item.code}</span>
                <span className="text-sm font-medium">{item.display}</span>
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground border border-border rounded px-1.5 py-0.5">
                  {item.specificity.split(" — ")[0]}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.definition}</p>
            </button>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => setManualOpen((s) => !s)}
        className="text-xs text-primary font-medium flex items-center gap-1"
      >
        <Plus className="w-3.5 h-3.5" /> Enter a code from the WHO browser
      </button>

      {manualOpen && (
        <div className="rounded-lg border border-border p-3 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Input placeholder="ICD-11 code, e.g. FA20.0" value={manual.code} onChange={(e) => setManual({ ...manual, code: e.target.value })} />
            <Input placeholder="Official display term" value={manual.display} onChange={(e) => setManual({ ...manual, display: e.target.value })} />
          </div>
          <Input placeholder="Source / release the code was verified against" value={manual.source} onChange={(e) => setManual({ ...manual, source: e.target.value })} />
          <Select value={manual.specificity} onValueChange={(v) => setManual({ ...manual, specificity: v })}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Specificity" /></SelectTrigger>
            <SelectContent>
              {Object.values(SPECIFICITY).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex items-center justify-between gap-2">
            <a
              href={ICD11_MMS.browser_url}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-primary flex items-center gap-1"
            >
              Open the WHO ICD-11 browser <ExternalLink className="w-3 h-3" />
            </a>
            <Button type="button" size="sm" onClick={addManual} disabled={!manual.code.trim() || !manual.display.trim() || !manual.source.trim()}>
              Add diagnosis
            </Button>
          </div>
        </div>
      )}

      {entries.length === 0 && (
        <p className="text-xs text-muted-foreground">
          No diagnosis recorded yet. Add the working, confirmed or differential diagnoses for this assessment.
        </p>
      )}

      {entries.map((e, i) => (
        <div key={`${e.code}-${i}`} className="rounded-lg border border-border p-3 space-y-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-semibold text-primary">{e.code}</span>
                <span className="text-sm font-medium">{e.display}</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {e.specificity?.split(" — ")[0]} · {e.version}
              </p>
            </div>
            <button type="button" onClick={() => onChange(entries.filter((_, idx) => idx !== i))} aria-label="Remove diagnosis">
              <X className="w-4 h-4 text-muted-foreground hover:text-destructive" />
            </button>
          </div>

          {e.manual && (
            <p className="text-[11px] text-amber-700 dark:text-amber-400 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Manually entered — verify against the WHO browser.
            </p>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Diagnosis role</Label>
              <Select value={e.role} onValueChange={(v) => update(i, { role: v })}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>{DIAGNOSIS_ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Diagnostic status</Label>
              <Select value={e.status} onValueChange={(v) => update(i, { status: v })}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>{DIAGNOSIS_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          {e.criteria_reference && (
            <p className="text-[11px] text-muted-foreground">Reference criteria: {e.criteria_reference}</p>
          )}

          <div className="space-y-1">
            <Label className="text-xs">
              Clinical basis for this diagnosis
              {["Confirmed", "Resolved", "In remission"].includes(e.status) && (
                <span className="text-destructive font-semibold"> · Required for {e.status.toLowerCase()}</span>
              )}
            </Label>
            <Textarea
              rows={2}
              value={e.basis ?? ""}
              placeholder="Clinical features, criteria met, duration, response — and what was excluded."
              onChange={(ev) => update(i, { basis: ev.target.value })}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Outstanding workup / follow-up for this diagnosis</Label>
            <Input value={e.follow_up ?? ""} onChange={(ev) => update(i, { follow_up: ev.target.value })} />
          </div>

          {["Confirmed", "Resolved", "In remission"].includes(e.status) && !String(e.basis || "").trim() && (
            <p className="text-[11px] text-destructive flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Document the clinical basis before saving a {e.status.toLowerCase()} diagnosis.
            </p>
          )}
        </div>
      ))}
    </div>
  );
}