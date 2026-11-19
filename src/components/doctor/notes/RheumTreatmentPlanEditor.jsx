import React, { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/doctor/dictation/DictationTextarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, ChevronUp, Info, Plus, Search, X } from "lucide-react";
import { ADHERENCE_OPTIONS, ROUTES, classLabel, drugNote, getDrug, monitoringRequirements, searchDrugs } from "@/lib/rheumTreatment";

// Structured treatment plan entries for one rheumatology assessment. Every
// field is typed by the clinician: the plan records a decision that has been
// made, it does not calculate a regimen or create a prescription.
const emptyEntry = (drug, custom = "") => ({
  id: `${drug ? drug.key : "custom"}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  drug_key: drug ? drug.key : "",
  drug: drug ? drug.name : custom,
  indication: "",
  dose: "",
  route: drug && drug.routes.length === 1 ? drug.routes[0] : "",
  frequency: "",
  start_date: "",
  duration: "",
  target: "",
  expected_response: "",
  contraindications: "",
  counselling: drug && drug.counsel ? drug.counsel.join("; ") : "",
  adverse_effects: "",
  adherence: "Not documented",
  planned_review: "",
  monitoring: monitoringRequirements(drug ? drug.key : "").map((r) => ({ test: r.test, last_date: "", result: "" })),
});

function EntryCard({ entry, onPatch, onRemove }) {
  const [open, setOpen] = useState(false);
  const drug = getDrug(entry.drug_key);
  const note = drugNote(entry.drug_key);

  return (
    <div className="rounded-lg border border-border p-3 space-y-2.5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium flex flex-wrap items-center gap-1.5">
            {entry.drug}
            {drug && <Badge variant="secondary" className="text-[10px]">{classLabel(drug.cls)}</Badge>}
            {drug && drug.immunosuppressant && <Badge variant="outline" className="text-[10px]">Immunosuppressive</Badge>}
          </p>
          {note && <p className="text-[11px] text-muted-foreground mt-0.5">{note}</p>}
        </div>
        <button type="button" onClick={onRemove} aria-label="Remove treatment">
          <X className="w-4 h-4 text-muted-foreground hover:text-destructive" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="space-y-1 sm:col-span-2">
          <Label className="text-xs">Indication</Label>
          <Input value={entry.indication} onChange={(e) => onPatch({ indication: e.target.value })} placeholder="The clinical indication documented for this treatment" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Dose (as decided by the clinician)</Label>
          <Input value={entry.dose} onChange={(e) => onPatch({ dose: e.target.value })} placeholder="Enter the prescribed dose" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Route</Label>
          <Select value={entry.route || undefined} onValueChange={(v) => onPatch({ route: v })}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Select..." /></SelectTrigger>
            <SelectContent>{(drug && drug.routes.length ? drug.routes : ROUTES).map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Frequency</Label>
          <Input value={entry.frequency} onChange={(e) => onPatch({ frequency: e.target.value })} placeholder="e.g. once weekly" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Start date</Label>
          <Input type="date" value={entry.start_date} onChange={(e) => onPatch({ start_date: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Duration (when applicable)</Label>
          <Input value={entry.duration} onChange={(e) => onPatch({ duration: e.target.value })} placeholder="e.g. until review, or 12 weeks" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Planned review</Label>
          <Input type="date" value={entry.planned_review} onChange={(e) => onPatch({ planned_review: e.target.value })} />
        </div>
      </div>

      <button type="button" onClick={() => setOpen((s) => !s)} className="text-xs text-primary font-medium flex items-center gap-1">
        {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        {open ? "Hide" : "Show"} treatment target, counselling & safety detail
      </button>

      {open && (
        <div className="space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Treatment target</Label>
              <Input value={entry.target} onChange={(e) => onPatch({ target: e.target.value })} placeholder="e.g. remission or low disease activity" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Expected response</Label>
              <Input value={entry.expected_response} onChange={(e) => onPatch({ expected_response: e.target.value })} placeholder="What improvement is expected, and by when" />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Contraindications & precautions documented</Label>
            <Textarea rows={2} value={entry.contraindications} onChange={(e) => onPatch({ contraindications: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Counselling given</Label>
            <Textarea rows={2} value={entry.counselling} onChange={(e) => onPatch({ counselling: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Adverse effects / intolerance</Label>
              <Textarea rows={2} value={entry.adverse_effects} onChange={(e) => onPatch({ adverse_effects: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Adherence</Label>
              <Select value={entry.adherence} onValueChange={(v) => onPatch({ adherence: v })}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>{ADHERENCE_OPTIONS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          {drug && (
            <p className="text-[11px] text-muted-foreground flex items-start gap-1.5">
              <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" /> Reference: {drug.ref || "Approved product information"}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function RheumTreatmentPlanEditor({ entries = [], onChange }) {
  const [query, setQuery] = useState("");
  const [custom, setCustom] = useState("");

  const results = useMemo(() => (query.trim() ? searchDrugs(query).slice(0, 8) : []), [query]);
  const chosen = new Set(entries.map((e) => e.drug_key).filter(Boolean));

  const patch = (id, patchObj) => onChange(entries.map((e) => (e.id === id ? { ...e, ...patchObj } : e)));

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            className="pl-9"
            value={query}
            placeholder="Search treatments — methotrexate, adalimumab, prednisolone, allopurinol, physiotherapy..."
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {query.trim() && (
        <div className="rounded-lg border border-border divide-y divide-border max-h-56 overflow-y-auto">
          {results.length === 0 && <p className="p-3 text-xs text-muted-foreground">No catalogue entry matches. Add it as an unlisted treatment below.</p>}
          {results.map((d) => (
            <button
              type="button"
              key={d.key}
              disabled={chosen.has(d.key) && d.cls !== "non_pharm"}
              onClick={() => { onChange([...entries, emptyEntry(d)]); setQuery(""); }}
              className="w-full text-left p-2.5 hover:bg-muted/60 disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <p className="text-sm font-medium">{d.name}</p>
              <p className="text-[11px] text-muted-foreground">{classLabel(d.cls)}</p>
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2">
        <Input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Add a treatment not in the catalogue" />
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!custom.trim()}
          onClick={() => { onChange([...entries, emptyEntry(null, custom.trim())]); setCustom(""); }}
        >
          <Plus className="w-3.5 h-3.5 mr-1" /> Add
        </Button>
      </div>

      {entries.length === 0 ? (
        <p className="text-xs text-muted-foreground">No treatment documented in this assessment.</p>
      ) : (
        entries.map((e) => (
          <EntryCard
            key={e.id}
            entry={e}
            onPatch={(p) => patch(e.id, p)}
            onRemove={() => onChange(entries.filter((x) => x.id !== e.id))}
          />
        ))
      )}
    </div>
  );
}