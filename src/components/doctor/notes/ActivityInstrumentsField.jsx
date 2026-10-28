import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, Info, Plus, X, History } from "lucide-react";
import {
  RHEUM_INSTRUMENTS,
  getInstrument,
  scoreInstrument,
  formatInstrumentEntry,
} from "@/lib/rheumInstruments";

// Validated rheumatology disease-activity and functional instruments.
// A score is produced only from completed inputs; when anything required is
// missing the panel says exactly what is missing instead of estimating a value,
// names the instrument and version used, and keeps every previous score for
// longitudinal comparison.
const fieldKey = "disease_activity";

const parseHistoryText = (text) => {
  if (typeof text !== "string") return [];
  return text
    .split("\n")
    .map((line) => {
      const m = line.match(/^(.+?) \((.+?)\) — ([\d.]+) · (.*?) · (\d{4}-\d{2}-\d{2})$/);
      return m ? { name: m[1], version: m[2], score: Number(m[3]), band: m[4], date: m[5] } : null;
    })
    .filter(Boolean);
};

export default function ActivityInstrumentsField({ value, onChange, instruments = [], patientId }) {
  const allowed = useMemo(
    () => (instruments.length ? instruments.map((k) => getInstrument(k)).filter(Boolean) : Object.values(RHEUM_INSTRUMENTS)),
    [instruments]
  );
  const entries = Array.isArray(value) ? value : [];
  const [selectedKey, setSelectedKey] = useState((allowed[0] || {}).key || "");
  const [draft, setDraft] = useState({});
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const instrument = getInstrument(selectedKey);

  // Previous scores, read back from this patient's earlier rheumatology notes
  // and documents, so the new score is always compared with the last one.
  useEffect(() => {
    let active = true;
    if (!patientId) return () => { active = false; };
    setHistoryLoading(true);
    Promise.all([
      base44.entities.ClinicalNote.filter({ patient_id: patientId, specialty: "rheumatology" }, { sort: "-created_date", limit: 30 }),
      base44.entities.ClinicalDocument.filter({ patient_id: patientId, specialty: "rheumatology" }, { sort: "-created_date", limit: 30 }),
    ])
      .then(([notes, docs]) => {
        if (!active) return;
        const collected = [];
        [...(notes.items || notes || []), ...(docs.items || docs || [])].forEach((rec) => {
          const stored = rec?.data?.[fieldKey]?.value;
          parseHistoryText(stored).forEach((h) => collected.push(h));
        });
        collected.sort((a, b) => (a.date < b.date ? 1 : -1));
        setHistory(collected);
      })
      .catch(() => {
        if (active) setHistory([]);
      })
      .finally(() => {
        if (active) setHistoryLoading(false);
      });
    return () => {
      active = false;
    };
  }, [patientId]);

  const setInput = (key, v) => setDraft((s) => ({ ...s, [key]: v }));

  const result = instrument ? scoreInstrument(instrument.key, draft) : { ok: false, missing: [] };
  const latestSame = history.find((h) => h.name === instrument?.name);

  const record = () => {
    if (!result.ok) return;
    const entry = {
      instrument: instrument.key,
      instrument_name: instrument.name,
      version: instrument.version,
      score: result.score,
      band: result.band,
      scored_datetime: new Date().toISOString(),
      mode: instrument.mode,
      inputs: { ...draft },
    };
    onChange([...entries, entry]);
    setDraft({});
  };

  const allInputs = instrument ? [...instrument.inputs, ...(instrument.resultInputs || [])] : [];

  return (
    <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={selectedKey} onValueChange={(v) => { setSelectedKey(v); setDraft({}); }}>
          <SelectTrigger className="w-full sm:w-72"><SelectValue placeholder="Select instrument" /></SelectTrigger>
          <SelectContent>
            {allowed.map((i) => <SelectItem key={i.key} value={i.key}>{i.name}</SelectItem>)}
          </SelectContent>
        </Select>
        {instrument?.mode === "recorded" && (
          <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800">Recorded from validated tool</Badge>
        )}
      </div>

      {instrument && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-foreground">{instrument.version}</p>
          <p className="text-xs text-muted-foreground">{instrument.population}</p>
          <p className="text-xs text-muted-foreground">{instrument.summary}</p>
          {instrument.note && (
            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md p-2 flex gap-1.5">
              <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />{instrument.note}
            </p>
          )}
        </div>
      )}

      {instrument && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {allInputs.map((input) => (
            <div key={input.key} className="space-y-1">
              <Label className="text-xs leading-snug">{input.label}</Label>
              {input.kind === "number" && (
                <Input
                  type="number"
                  inputMode="decimal"
                  value={draft[input.key] ?? ""}
                  onChange={(e) => setInput(input.key, e.target.value)}
                />
              )}
              {input.kind === "text" && (
                <Input value={draft[input.key] ?? ""} onChange={(e) => setInput(input.key, e.target.value)} />
              )}
              {(input.kind === "select" || input.kind === "choice") && (
                <Select value={draft[input.key] || undefined} onValueChange={(v) => setInput(input.key, v)}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent className="max-h-72">
                    {input.options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>
          ))}
        </div>
      )}

      {instrument && (result.missing.length > 0 || result.invalid.length > 0) && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-2.5 space-y-1">
          <p className="text-xs font-semibold text-amber-900 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> Not scored — the instrument needs every input
          </p>
          {result.missing.length > 0 && (
            <p className="text-xs text-amber-900">Missing: {result.missing.join(" · ")}</p>
          )}
          {result.invalid.map((m) => (
            <p key={m} className="text-xs text-destructive">{m}</p>
          ))}
        </div>
      )}

      {instrument && result.ok && (
        <div className="rounded-md border border-primary/25 bg-primary/5 p-2.5">
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-heading font-semibold text-primary">{result.score}</p>
            <p className="text-xs font-medium text-foreground">{instrument.name}</p>
          </div>
          <p className="text-xs text-muted-foreground">{result.band}</p>
          {latestSame && (
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
              <History className="w-3.5 h-3.5" />
              Previous {latestSame.score} on {latestSame.date} — change {Number((result.score - latestSame.score).toFixed(instrument.decimals))}
            </p>
          )}
        </div>
      )}

      <Button type="button" size="sm" onClick={record} disabled={!result.ok} className="gap-1.5">
        <Plus className="w-3.5 h-3.5" /> Record score
      </Button>

      {entries.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-foreground">Scores recorded in this note</p>
          {entries.map((e, i) => (
            <div key={`${e.instrument}-${i}`} className="flex items-start justify-between gap-2 rounded-md border border-border bg-card p-2">
              <div>
                <p className="text-xs font-medium">{formatInstrumentEntry(e)}</p>
                <p className="text-[11px] text-muted-foreground">{e.instrument_name} — {e.band}</p>
              </div>
              <button type="button" onClick={() => onChange(entries.filter((_, idx) => idx !== i))} aria-label="Remove score">
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>
          ))}
        </div>
      )}

      {history.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-semibold text-foreground">Previously recorded scores (earlier notes)</p>
          {history.slice(0, 6).map((h, i) => (
            <p key={`${h.name}-${h.date}-${i}`} className="text-xs text-muted-foreground">
              {h.name} — {h.score} · {h.band} · {h.date}
            </p>
          ))}
        </div>
      )}
      {historyLoading && <p className="text-xs text-muted-foreground">Loading previous scores…</p>}

      <p className="text-[11px] text-muted-foreground flex gap-1.5">
        <CheckCircle2 className="w-3 h-3 mt-0.5 shrink-0" />
        Scores are calculated only from the inputs entered here. Instruments measure activity and function; they are not classification criteria and never replace clinical judgement.
      </p>
    </div>
  );
}