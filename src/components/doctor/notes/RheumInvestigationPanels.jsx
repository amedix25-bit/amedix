import React, { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/doctor/dictation/DictationTextarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  INVESTIGATION_PANELS,
  INVESTIGATION_STATUSES,
  INTERPRETATIONS,
  SIGNIFICANT,
  searchInvestigations,
} from "@/lib/rheumInvestigations";
import { AlertTriangle, FlaskConical, Plus, Search, X } from "lucide-react";

// Configurable investigation panels for Rheumatology. Nothing is ordered or
// preselected: the panels are a search index, and an investigation enters the
// note only when the clinician selects it and documents the indication,
// result, units, reference range, interpretation and follow-up action.
// Clinically significant abnormalities are surfaced at the top for review.
export default function RheumInvestigationPanels({ value = [], onChange }) {
  const entries = Array.isArray(value) ? value : [];
  const [query, setQuery] = useState("");
  const [panelFilter, setPanelFilter] = useState("all");
  const [customOpen, setCustomOpen] = useState(false);
  const [custom, setCustom] = useState({ name: "", panel: INVESTIGATION_PANELS[0].label });

  const results = useMemo(() => {
    const list = searchInvestigations(query);
    return (panelFilter === "all" ? list : list.filter((i) => i.panel_key === panelFilter)).slice(0, 10);
  }, [query, panelFilter]);

  const significant = entries.filter((e) => e.interpretation === SIGNIFICANT);
  const chosen = new Set(entries.map((e) => e.name));

  const add = ({ name, panel }) => {
    onChange([
      ...entries,
      { name, panel, status: "Ordered", indication: "", result: "", units: "", reference_range: "", interpretation: "Awaiting result", follow_up: "" },
    ]);
    setQuery("");
  };

  const update = (index, patch) => onChange(entries.map((e, i) => (i === index ? { ...e, ...patch } : e)));

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border bg-muted/40 p-2.5">
        <p className="text-xs font-medium flex items-center gap-1.5">
          <FlaskConical className="w-3.5 h-3.5 text-primary" /> Select only the investigations that are indicated
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          Nothing is ordered automatically. Each investigation records its indication, result, units, reference range,
          interpretation and follow-up.
        </p>
      </div>

      {significant.length > 0 && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-2.5 space-y-1">
          <p className="text-xs font-semibold text-destructive flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> Clinically significant abnormalities — for clinician review
          </p>
          {significant.map((e, i) => (
            <p key={`${e.name}-${i}`} className="text-xs">
              {e.name}
              {e.result ? `: ${e.result}${e.units ? ` ${e.units}` : ""}` : ""}
              {e.follow_up ? ` — action: ${e.follow_up}` : ""}
            </p>
          ))}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            className="pl-9"
            value={query}
            placeholder="Search investigations — CBC, ESR, RF, anti-CCP, ANA, complement, urate, MRI, DXA..."
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Select value={panelFilter} onValueChange={setPanelFilter}>
          <SelectTrigger className="w-full sm:w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All panels</SelectItem>
            {INVESTIGATION_PANELS.map((p) => <SelectItem key={p.key} value={p.key}>{p.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {query.trim() && (
        <div className="rounded-lg border border-border divide-y divide-border max-h-64 overflow-y-auto">
          {results.length === 0 && <p className="p-3 text-xs text-muted-foreground">No investigation matches that search. Add it as a custom investigation below.</p>}
          {results.map((item) => (
            <button
              type="button"
              key={`${item.panel_key}-${item.key}`}
              disabled={chosen.has(item.label)}
              onClick={() => add({ name: item.label, panel: item.panel })}
              className="w-full text-left p-2.5 hover:bg-muted/60 disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <p className="text-sm font-medium">{item.label}</p>
              <p className="text-[11px] text-muted-foreground">{item.panel}</p>
            </button>
          ))}
        </div>
      )}

      <button type="button" onClick={() => setCustomOpen((s) => !s)} className="text-xs text-primary font-medium flex items-center gap-1">
        <Plus className="w-3.5 h-3.5" /> Add an investigation not listed
      </button>

      {customOpen && (
        <div className="rounded-lg border border-border p-3 space-y-2">
          <Input placeholder="Investigation name" value={custom.name} onChange={(e) => setCustom({ ...custom, name: e.target.value })} />
          <Select value={custom.panel} onValueChange={(v) => setCustom({ ...custom, panel: v })}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>{INVESTIGATION_PANELS.map((p) => <SelectItem key={p.key} value={p.label}>{p.label}</SelectItem>)}</SelectContent>
          </Select>
          <Button
            type="button"
            size="sm"
            disabled={!custom.name.trim()}
            onClick={() => {
              add({ name: custom.name.trim(), panel: custom.panel });
              setCustom({ name: "", panel: INVESTIGATION_PANELS[0].label });
              setCustomOpen(false);
            }}
          >
            Add investigation
          </Button>
        </div>
      )}

      {entries.length === 0 ? (
        <p className="text-xs text-muted-foreground">No investigations selected for this assessment.</p>
      ) : (
        entries.map((e, i) => (
          <div key={`${e.name}-${i}`} className="rounded-lg border border-border p-3 space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium">{e.name}</p>
                <p className="text-[11px] text-muted-foreground">{e.panel}</p>
              </div>
              <button type="button" onClick={() => onChange(entries.filter((_, idx) => idx !== i))} aria-label="Remove investigation">
                <X className="w-4 h-4 text-muted-foreground hover:text-destructive" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Status</Label>
                <Select value={e.status} onValueChange={(v) => update(i, { status: v })}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>{INVESTIGATION_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Interpretation</Label>
                <Select value={e.interpretation} onValueChange={(v) => update(i, { interpretation: v })}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>{INTERPRETATIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Indication for this investigation</Label>
              <Textarea rows={2} value={e.indication ?? ""} onChange={(ev) => update(i, { indication: ev.target.value })} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Input placeholder="Result / findings" value={e.result ?? ""} onChange={(ev) => update(i, { result: ev.target.value })} />
              <Input placeholder="Units" value={e.units ?? ""} onChange={(ev) => update(i, { units: ev.target.value })} />
              <Input placeholder="Reference range" value={e.reference_range ?? ""} onChange={(ev) => update(i, { reference_range: ev.target.value })} />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Follow-up action</Label>
              <Input value={e.follow_up ?? ""} onChange={(ev) => update(i, { follow_up: ev.target.value })} />
            </div>
          </div>
        ))
      )}
    </div>
  );
}