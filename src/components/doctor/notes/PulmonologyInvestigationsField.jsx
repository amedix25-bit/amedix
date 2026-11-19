import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/doctor/dictation/DictationTextarea";
import { AlertTriangle, ChevronDown, Loader2, Paperclip, X } from "lucide-react";
import {
  PULM_INVESTIGATION_GROUPS,
  pulmInvestigationGaps,
  pulmInvestigationItems,
  pulmInvestigationValue,
} from "@/lib/pulmonologyInvestigations";

const asObject = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : {});

// Structured investigation documentation. Every test captures the same six
// things — indication, result, unit, interpretation, date and attachment — plus
// the AMedix request the result came through. Results themselves stay in the
// Laboratory and Radiology workflows; the note records the clinician's reading of
// them and points at the request it belongs to.
export default function PulmonologyInvestigationsField({ value, onChange }) {
  const items = pulmInvestigationItems(value);
  const [openTest, setOpenTest] = useState("");
  const [uploading, setUploading] = useState("");

  const entry = (key) => asObject(items[key]);
  const patch = (key, next) => onChange(pulmInvestigationValue({ ...items, [key]: { ...entry(key), ...next } }));
  const clear = (key) => {
    const next = { ...items };
    delete next[key];
    onChange(pulmInvestigationValue(next));
  };

  const attach = async (key, file) => {
    if (!file) return;
    setUploading(key);
    const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
    setUploading("");
    if (file_uri) patch(key, { attachment_uri: file_uri, attachment_name: file.name });
  };

  const documented = Object.values(items).filter((e) => asObject(e).result || asObject(e).interpretation).length;

  return (
    <div className="space-y-2">
      <p className="text-[11px] text-muted-foreground">
        {documented} of {PULM_INVESTIGATION_GROUPS.reduce((n, g) => n + g.tests.length, 0)} investigations documented. Each
        entry keeps its indication, result, unit, interpretation, date and attachment. Ordering, performing and result entry
        stay in the Laboratory and Radiology workflows — the request reference below links the note to them.
      </p>

      {PULM_INVESTIGATION_GROUPS.map((group) => (
        <div key={group.key} className="overflow-hidden rounded-lg border border-border">
          <div className="bg-muted/40 px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
            {group.label}
          </div>
          <div className="divide-y divide-border">
            {group.tests.map((test) => {
              const e = entry(test.key);
              const open = openTest === test.key;
              const gaps = pulmInvestigationGaps(e);
              const touched = Object.values(e).some((v) => String(v ?? "").trim());
              return (
                <div key={test.key}>
                  <button
                    type="button"
                    onClick={() => setOpenTest(open ? "" : test.key)}
                    aria-expanded={open}
                    className="flex w-full items-center justify-between gap-2 px-2.5 py-2 text-left hover:bg-muted/40"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform ${open ? "" : "-rotate-90"}`} />
                      <span className="truncate text-xs font-medium">{test.label}</span>
                      {e.attachment_name && <Paperclip className="h-3 w-3 shrink-0 text-muted-foreground" />}
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      {touched && gaps.length > 0 && (
                        <span className="flex items-center gap-1 text-[10px] text-amber-700 dark:text-amber-400">
                          <AlertTriangle className="h-3 w-3" /> {gaps.length} context item{gaps.length === 1 ? "" : "s"} missing
                        </span>
                      )}
                      {touched && gaps.length === 0 && <span className="text-[10px] text-emerald-700 dark:text-emerald-400">documented</span>}
                    </span>
                  </button>

                  {open && (
                    <div className="space-y-2.5 border-t border-border bg-card px-2.5 py-2.5">
                      <p className="text-[10px] text-muted-foreground">
                        {test.unit ? `Reported in ${test.unit}.` : "Reported as the performing service documents it."}
                        {test.captures?.length ? ` Captures: ${test.captures.join(", ")}.` : ""}
                      </p>
                      <div className="space-y-1">
                        <Label className="text-xs">Indication</Label>
                        <Textarea rows={2} value={e.indication ?? ""} onChange={(ev) => patch(test.key, { indication: ev.target.value })} />
                      </div>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                        <div className="space-y-1 sm:col-span-2">
                          <Label className="text-xs">Result</Label>
                          <Input value={e.result ?? ""} onChange={(ev) => patch(test.key, { result: ev.target.value })} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Unit</Label>
                          <Input value={e.unit ?? ""} placeholder={test.unit || ""} onChange={(ev) => patch(test.key, { unit: ev.target.value })} />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Interpretation as documented</Label>
                        <Textarea
                          rows={2}
                          value={e.interpretation ?? ""}
                          placeholder="What you concluded from the result — never generated by the app."
                          onChange={(ev) => patch(test.key, { interpretation: ev.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Date</Label>
                          <Input type="date" value={e.date ?? ""} onChange={(ev) => patch(test.key, { date: ev.target.value })} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">AMedix request reference</Label>
                          <Input
                            value={e.request_ref ?? ""}
                            placeholder="Laboratory or imaging request reference"
                            onChange={(ev) => patch(test.key, { request_ref: ev.target.value })}
                          />
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="flex cursor-pointer items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1 text-[11px] hover:bg-muted">
                          {uploading === test.key ? <Loader2 className="h-3 w-3 animate-spin" /> : <Paperclip className="h-3 w-3" />}
                          {e.attachment_name ? "Replace attachment" : "Attach report"}
                          <input type="file" className="hidden" onChange={(ev) => attach(test.key, ev.target.files?.[0])} />
                        </label>
                        {e.attachment_name && (
                          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            {e.attachment_name}
                            <button type="button" onClick={() => patch(test.key, { attachment_uri: "", attachment_name: "" })} aria-label="Remove attachment">
                              <X className="h-3 w-3 hover:text-destructive" />
                            </button>
                          </span>
                        )}
                        <button type="button" onClick={() => clear(test.key)} className="ml-auto text-[11px] text-muted-foreground hover:text-destructive">
                          Clear this investigation
                        </button>
                      </div>
                      {gaps.length > 0 && touched && (
                        <p className="text-[11px] text-amber-700 dark:text-amber-400">
                          Still to document: {gaps.map((g) => ({ indication: "indication", result: "result", interpretation: "interpretation", date: "date" })[g]).join(", ")}.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}