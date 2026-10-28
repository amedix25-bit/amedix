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

// Provenance travels with every coded entry, so the saved note records what the
// code was verified against — not only how it reads.
//
// `mapping_state` is the integrity switch and has exactly three values:
//   verified        the code comes from the verified ICD-11 catalogue, and the
//                   release it was checked against is stored beside it;
//   review_required the code was typed in by the clinician from the WHO browser
//                   and has not been checked against the catalogue;
//   unresolved      the diagnosis could not be mapped: NO code is stored, the
//                   clinical term is kept and the entry is flagged for review.
// The component never generates, completes or guesses a code.
const MAPPING_STATE = {
  VERIFIED: "verified",
  REVIEW: "review_required",
  UNRESOLVED: "unresolved",
};

const MAPPING_LABEL = {
  verified: "ICD-11 verified",
  review_required: "Review required",
  unresolved: "Unresolved — no code",
};

// A stem code ("5A00", "5A02") is legitimate, but when the catalogue already
// holds a subcategory under it the clinician is told, so specificity is a
// decision and never a guess.
const moreSpecificExists = (item, catalog) =>
  Boolean(item.code) &&
  !item.code.includes(".") &&
  (catalog || []).some((c) => c.code.startsWith(`${item.code}.`));

const newEntry = (item, entries, catalog) => ({
  code: item.code || "",
  display: item.display,
  definition: item.definition || "",
  specificity: item.specificity || SPECIFICITY.SUB,
  version: `${ICD11_MMS.label} (${item.release || ICD11_MMS.release})`,
  system: ICD11_MMS.system,
  system_uri: ICD11_MMS.system_uri,
  release: item.release || ICD11_MMS.release,
  source: item.source || "",
  verified_date: item.verified_date || "",
  coding_note:
    item.coding_note ||
    (item.primary === false
      ? "WHO carries this as a NON-primary tabulation entry — document it together with the diabetes type, never instead of it."
      : ""),
  manual: item.manual || false,
  mapping_state:
    item.mapping_state || (item.manual ? MAPPING_STATE.REVIEW : MAPPING_STATE.VERIFIED),
  specificity_hint: moreSpecificExists(item, catalog)
    ? "A more specific subcategory exists in the catalogue"
    : "",
  criteria_reference: item.criteria || "",
  role: entries.some((e) => e.role === "Primary") ? "Secondary" : "Primary",
  status: "Suspected",
  basis: "",
  follow_up: "",
});

// Searchable ICD-11 diagnosis selection. A code is only ever taken from the
// verified catalogue or entered by the clinician from the WHO browser — the
// app never generates a code. Selecting a code never confirms a diagnosis:
// it is recorded as Suspected until the clinician documents otherwise.
export default function Icd11DiagnosisField({
  value = [],
  onChange,
  catalog = RHEUM_ICD11,
  searchPlaceholder = "Search ICD-11 — rheumatoid arthritis, lupus, gout, ANCA, axial spondyloarthritis...",
  // A specialty catalogue may be on a different release than the shared default.
  // The release shown to the clinician is the one the offered codes come from.
  catalogRelease = ICD11_MMS.release,
  catalogNote = null,
}) {
  const entries = Array.isArray(value) ? value : [];
  const [query, setQuery] = useState("");
  const [manualOpen, setManualOpen] = useState(false);
  const [manual, setManual] = useState(EMPTY_MANUAL);
  const [unmappedOpen, setUnmappedOpen] = useState(false);
  const [unmapped, setUnmapped] = useState({ display: "", reason: "" });

  const results = useMemo(() => catalog.filter((i) => matchesIcd11(i, query)).slice(0, 8), [query, catalog]);
  const allCodes = new Set(entries.map((e) => e.code));

  const add = (item) => {
    onChange([...entries, newEntry(item, entries, catalog)]);
    setQuery("");
  };

  // A diagnosis that cannot be mapped is still a diagnosis. It is recorded
  // without a code, with the reason, and flagged for coding review — the app
  // never substitutes an approximate or invented code.
  const addUnmapped = () => {
    if (!unmapped.display.trim() || !unmapped.reason.trim()) return;
    add({
      code: "",
      display: unmapped.display.trim(),
      definition: "No ICD-11 code assigned — the documented term is recorded exactly as entered.",
      coding_note: `Unmapped — ${unmapped.reason.trim()}`,
      mapping_state: MAPPING_STATE.UNRESOLVED,
      specificity: "Pending review — no code assigned",
    });
    setUnmapped({ display: "", reason: "" });
    setUnmappedOpen(false);
  };

  const addManual = () => {
    if (!manual.code.trim() || !manual.display.trim() || !manual.source.trim()) return;
    add({
      ...manual,
      manual: true,
      mapping_state: MAPPING_STATE.REVIEW,
      definition: "Code and official term entered by the clinician from the WHO ICD-11 browser.",
    });
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
          Codes come from the verified {ICD11_MMS.label} catalogue — the release and source are stored on each
          diagnosis — or are entered from the WHO browser and marked for review. This field records ICD-11 diagnoses
          only: laboratory, medication and procedure codes belong to their own systems and are never entered here.
          A keyword, laboratory result or imaging finding alone never confirms a diagnosis.
        </p>
        <p className="text-[11px] text-muted-foreground">
          {catalogNote ||
            `Catalogue release ${catalogRelease} · WHO ICD-11 MMS. No live WHO API is called — the bundled verified subset is used, and any code outside it is entered by the clinician.`}
        </p>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
        <Input
          className="pl-9"
          value={query}
          placeholder={searchPlaceholder}
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

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setManualOpen((s) => !s)}
          className="text-xs text-primary font-medium flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" /> Enter a code from the WHO browser
        </button>
        <button
          type="button"
          onClick={() => setUnmappedOpen((s) => !s)}
          className="text-xs font-medium flex items-center gap-1 text-amber-700 dark:text-amber-400"
        >
          <Plus className="w-3.5 h-3.5" /> Diagnosis that cannot be mapped
        </button>
      </div>

      {unmappedOpen && (
        <div className="rounded-lg border border-amber-300/70 dark:border-amber-700/60 bg-amber-50/60 dark:bg-amber-950/20 p-3 space-y-2">
          <p className="text-[11px] text-amber-800 dark:text-amber-300">
            The diagnosis is recorded as documented, with no code and a review-required flag. No code is invented or
            approximated.
          </p>
          <Input
            placeholder="Diagnosis as documented in the note"
            value={unmapped.display}
            onChange={(e) => setUnmapped({ ...unmapped, display: e.target.value })}
          />
          <Input
            placeholder="Why it could not be mapped (required)"
            value={unmapped.reason}
            onChange={(e) => setUnmapped({ ...unmapped, reason: e.target.value })}
          />
          <div className="flex justify-end">
            <Button
              type="button"
              size="sm"
              onClick={addUnmapped}
              disabled={!unmapped.display.trim() || !unmapped.reason.trim()}
            >
              Record as unresolved
            </Button>
          </div>
        </div>
      )}

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
                <span className="font-mono text-xs font-semibold text-primary">
                  {e.code || "No code"}
                </span>
                <span className="text-sm font-medium">{e.display}</span>
                <span className="text-[10px] uppercase tracking-wide border border-border rounded px-1.5 py-0.5 text-muted-foreground">
                  {ICD11_MMS.system} {e.release || ICD11_MMS.release}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {e.specificity?.split(" — ")[0]} · {e.version}
              </p>
            </div>
            <button type="button" onClick={() => onChange(entries.filter((_, idx) => idx !== i))} aria-label="Remove diagnosis">
              <X className="w-4 h-4 text-muted-foreground hover:text-destructive" />
            </button>
          </div>

          {e.mapping_state === MAPPING_STATE.VERIFIED ? (
            <p className="text-[11px] text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> {MAPPING_LABEL.verified} against the catalogue release
              {e.release ? ` ${e.release}` : ""}
              {e.verified_date ? ` · verified ${e.verified_date}` : ""}
            </p>
          ) : (
            <p className="text-[11px] text-amber-700 dark:text-amber-400 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> {MAPPING_LABEL[e.mapping_state] || MAPPING_LABEL.review_required}
              {e.mapping_state === MAPPING_STATE.REVIEW
                ? " — code typed in, not checked against the catalogue. Verify it in the WHO browser."
                : " — keep it on the coding review list and do not add a code until it is confirmed."}
            </p>
          )}

          {e.mapping_state === MAPPING_STATE.REVIEW && (
            <div className="space-y-1">
              <Label className="text-xs">Where the code was verified</Label>
              <Input
                value={e.source ?? ""}
                placeholder="WHO ICD-11 browser release and page, or the coding reference used"
                onChange={(ev) => update(i, { source: ev.target.value })}
              />
            </div>
          )}

          {e.specificity_hint && (
            <p className="text-[11px] text-amber-700 dark:text-amber-400 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> {e.specificity_hint} — choose it when the record supports it.
            </p>
          )}

          {e.coding_note && (
            <p className="text-[11px] rounded-md bg-muted/60 px-2 py-1.5">
              <span className="font-medium">Coding instruction:</span> {e.coding_note}
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