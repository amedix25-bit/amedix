import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ChevronDown, Loader2, ShieldCheck } from "lucide-react";
import { localEntryToDiagnosis } from "@/lib/icd11Local";

// A condition index that resolves the condition the clinician selected against the
// workspace's own ICD-11 database — no WHO API subscription or credentials are used.
// It is a shortcut into the local classification, not a code list: nothing is coded
// until the dataset returns the entry, and a condition the dataset does not hold is
// recorded without a code and flagged for coding review.
export default function Icd11ConditionIndex({ groups = [], onSelect, title = "Condition index", hint = "" }) {
  const [open, setOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState("");
  const [lang, setLang] = useState("en");
  const [busy, setBusy] = useState("");
  const [state, setState] = useState({ condition: null, results: [], release: "", retrievedAt: "", notConfigured: "", error: "" });

  const reset = () => setState({ condition: null, results: [], release: "", retrievedAt: "", notConfigured: "", error: "" });

  const lookup = async (condition) => {
    setBusy(condition.key);
    reset();
    try {
      const res = await base44.functions.invoke("icd11LocalSearch", { mode: "search", query: condition.whoQuery, limit: 8, lang });
      const data = res.data || {};
      if (data.dataset_ready === false) {
        setState((s) => ({ ...s, condition, notConfigured: data.message || "No ICD-11 release is loaded in this workspace." }));
      } else if (data.error) {
        setState((s) => ({ ...s, condition, error: data.error }));
      } else {
        setState({
          condition,
          results: Array.isArray(data.results) ? data.results : [],
          release: data.release || "",
          retrievedAt: data.retrieved_at || "",
          notConfigured: "",
          error: "",
        });
      }
    } catch (e) {
      setState((s) => ({ ...s, condition, error: e?.response?.data?.error || e.message || "The local ICD-11 lookup failed." }));
    }
    setBusy("");
  };

  const pick = async (result) => {
    const condition = state.condition;
    if (!condition || !result.codable) return;
    setBusy(`${condition.key}:${result.uri || result.code}`);
    let entry = null;
    let detailError = "";
    try {
      const res = await base44.functions.invoke(
        "icd11LocalSearch",
        result.uri ? { mode: "entity", uri: result.uri, lang } : { mode: "entity", code: result.code, lang },
      );
      const data = res.data || {};
      if (data.entry) entry = data.entry;
      else detailError = data.error || "The local dataset did not return the entry detail.";
    } catch (e) {
      detailError = e?.response?.data?.error || e.message || "The entry could not be read from the local dataset.";
    }
    setBusy("");
    if (!entry) {
      setState((s) => ({ ...s, error: detailError, results: [] }));
      return;
    }
    onSelect({
      ...localEntryToDiagnosis(entry, { language: lang, release: state.release }),
      clinician_term: condition.label,
    });
    reset();
  };

  // No code is invented when the service is unavailable: the documented condition
  // is kept, without a code, and flagged so coding review picks it up.
  const withoutCode = (reason) => {
    const condition = state.condition;
    if (!condition) return;
    onSelect({
      code: "",
      display: condition.label,
      clinician_term: condition.label,
      definition: "No ICD-11 code assigned — the condition is recorded exactly as documented.",
      coding_note: `Unmapped — ${reason}`,
      mapping_state: "unresolved",
      specificity: "Pending review — no code assigned",
      source: "Documented in the note — coding review required",
    });
    reset();
  };

  return (
    <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-2.5">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-center justify-between gap-2 text-left">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "" : "-rotate-90"}`} /> {title}
        </span>
        <span className="text-[10px] text-muted-foreground">resolves the condition in the local ICD-11 database</span>
      </button>

      {open && (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] text-muted-foreground">{hint}</p>
            <div className="flex shrink-0 items-center gap-1 rounded-md border border-border bg-card p-0.5">
              {[
                { code: "en", label: "EN" },
                { code: "ar", label: "AR" },
              ].map((o) => (
                <button
                  key={o.code}
                  type="button"
                  onClick={() => setLang(o.code)}
                  className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${lang === o.code ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {groups.map((g) => (
            <div key={g.key} className="rounded-md border border-border bg-card">
              <button
                type="button"
                onClick={() => setOpenGroup((k) => (k === g.key ? "" : g.key))}
                className="flex w-full items-center justify-between gap-2 px-2.5 py-1.5 text-left text-[11px] font-medium"
              >
                {g.label}
                <ChevronDown className={`h-3 w-3 transition-transform ${openGroup === g.key ? "" : "-rotate-90"}`} />
              </button>
              {openGroup === g.key && (
                <div className="flex flex-wrap gap-1.5 border-t border-border p-2">
                  {g.conditions.map((c) => (
                    <button
                      key={c.key}
                      type="button"
                      disabled={Boolean(busy)}
                      onClick={() => lookup(c)}
                      className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] hover:bg-muted disabled:opacity-50"
                    >
                      {c.label}
                      {busy === c.key && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {state.condition && (
            <div className="space-y-2 rounded-md border border-primary/30 bg-primary/5 p-2.5">
              <p className="text-[11px] font-medium text-primary">
                {state.condition.label} · local ICD-11 search “{state.condition.whoQuery}”
              </p>
              {state.condition.note && <p className="text-[11px] text-muted-foreground">{state.condition.note}</p>}

              {state.notConfigured && (
                <div className="space-y-2">
                  <p className="flex items-start gap-1.5 text-[11px] text-amber-800 dark:text-amber-300">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {state.notConfigured}
                  </p>
                  <Button type="button" size="sm" variant="outline" onClick={() => withoutCode("no ICD-11 release loaded in this workspace")}>
                    Record without a code — coding review required
                  </Button>
                </div>
              )}

              {state.error && (
                <div className="space-y-2">
                  <p className="flex items-start gap-1.5 text-[11px] text-destructive">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {state.error}
                  </p>
                  <Button type="button" size="sm" variant="outline" onClick={() => withoutCode("the local ICD-11 lookup failed")}>
                    Record without a code — coding review required
                  </Button>
                </div>
              )}

              {!state.notConfigured && !state.error && state.results.length === 0 && (
                <div className="space-y-2">
                  <p className="text-[11px] text-muted-foreground">
                    No entry in the imported ICD-11 dataset matches this term. Refine it in the search box, or record the condition
                    without a code.
                  </p>
                  <Button type="button" size="sm" variant="outline" onClick={() => withoutCode("the term is not in the imported ICD-11 dataset")}>
                    Record without a code — coding review required
                  </Button>
                </div>
              )}

              {state.results.length > 0 && (
                <div className="divide-y divide-border overflow-hidden rounded-md border border-border bg-card">
                  <p className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] text-muted-foreground">
                    <ShieldCheck className="h-3 w-3" /> ICD-11 MMS {state.release} (local database) · retrieved{" "}
                    {state.retrievedAt ? new Date(state.retrievedAt).toLocaleString() : "just now"}
                  </p>
                  {state.results.map((r) => (
                    <button
                      key={r.uri || `${r.code}-${r.display}`}
                      type="button"
                      disabled={!r.codable || Boolean(busy)}
                      onClick={() => pick(r)}
                      className="flex w-full flex-wrap items-center gap-2 px-2.5 py-2 text-left hover:bg-muted/60 disabled:opacity-50 disabled:hover:bg-transparent"
                    >
                      <span className="font-mono text-xs font-semibold text-primary">{r.code || "—"}</span>
                      <span className="text-sm">{r.display}</span>
                      {!r.codable && <span className="text-[10px] text-muted-foreground">grouping entry — no code</span>}
                      {busy === `${state.condition.key}:${r.uri}` && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}