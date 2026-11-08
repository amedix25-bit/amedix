import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Database, Layers, Loader2, Search, ShieldCheck } from "lucide-react";
import { localEntryToDiagnosis, arabicSourceLabel } from "@/lib/icd11Local";

// Local ICD-11 search — the classification entry point for every specialty's
// diagnosis field.
//
// It reads the workspace's own ICD-11 database: no WHO API subscription and no
// credentials are involved. Every result is an entry imported from an official
// source and stored with its release, so selecting one records the code, the
// official English term, the Arabic term with its provenance, the inclusion and
// exclusion terms, the coding note and the classification path exactly as the
// dataset holds them.
//
// It records a SUSPECTED diagnosis. It never confirms one, and when the dataset
// does not hold the term it says so instead of offering a nearby code.
export default function Icd11LocalSearch({ onSelect }) {
  const [query, setQuery] = useState("");
  const [lang, setLang] = useState("en");
  const [busy, setBusy] = useState("");
  const [state, setState] = useState({
    loading: false,
    error: "",
    datasetReady: true,
    message: "",
    results: [],
    release: "",
    retrievedAt: "",
  });

  const search = async () => {
    const q = query.trim();
    if (q.length < 2) return;
    setState({ loading: true, error: "", datasetReady: true, message: "", results: [], release: "", retrievedAt: "" });
    try {
      const res = await base44.functions.invoke("icd11LocalSearch", { mode: "search", query: q, limit: 15, lang });
      const data = res.data || {};
      setState({
        loading: false,
        error: data.error || "",
        datasetReady: data.dataset_ready !== false,
        message: data.message || "",
        results: Array.isArray(data.results) ? data.results : [],
        release: data.release || "",
        retrievedAt: data.retrieved_at || "",
      });
    } catch (e) {
      setState({
        loading: false,
        error: e?.response?.data?.error || e.message || "The local ICD-11 search failed.",
        datasetReady: true,
        message: "",
        results: [],
        release: "",
        retrievedAt: "",
      });
    }
  };

  const pick = async (r) => {
    if (!r.codable) return;
    setBusy(r.uri || r.code);
    try {
      const res = await base44.functions.invoke(
        "icd11LocalSearch",
        r.uri ? { mode: "entity", uri: r.uri, lang } : { mode: "entity", code: r.code, lang },
      );
      const data = res.data || {};
      if (data.entry) {
        onSelect(localEntryToDiagnosis(data.entry, { language: lang, release: data.release || state.release }));
        setState((s) => ({ ...s, results: [] }));
        setQuery("");
      } else {
        setState((s) => ({ ...s, error: data.error || "The entry could not be read from the local dataset." }));
      }
    } catch (e) {
      setState((s) => ({ ...s, error: e?.response?.data?.error || e.message || "The entry could not be read." }));
    }
    setBusy("");
  };

  return (
    <div className="space-y-2 rounded-lg border border-primary/30 bg-primary/5 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-primary">
          <Database className="h-3.5 w-3.5" /> Search the AMedix ICD-11 database
        </p>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-md border border-border bg-card p-0.5">
            {[
              { code: "en", label: "English" },
              { code: "ar", label: "العربية" },
            ].map((option) => (
              <button
                key={option.code}
                type="button"
                onClick={() => setLang(option.code)}
                className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                  lang === option.code ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          {state.release && (
            <Badge variant="outline" className="gap-1 text-[10px]">
              <ShieldCheck className="h-3 w-3" /> MMS {state.release}
            </Badge>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <Input
          value={query}
          placeholder={
            lang === "ar"
              ? "التشخيص أو الرمز — مثال: الربو، CA23"
              : "Diagnosis, synonym, abbreviation or code — e.g. asthma, COPD, CA23"
          }
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              search();
            }
          }}
        />
        <Button type="button" size="sm" onClick={search} disabled={state.loading || query.trim().length < 2}>
          {state.loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
          Search
        </Button>
      </div>

      <p className="text-[11px] text-muted-foreground">
        Searched in the workspace's own ICD-11 classification database — no API subscription or credentials are used.
        Arabic is shown only where the dataset carries it: an official WHO Arabic term is marked as official, and an
        AMedix working translation is marked as such. Selecting a result records a{" "}
        <span className="font-medium">suspected</span> diagnosis — it never confirms one.
      </p>

      {!state.datasetReady && (
        <div className="rounded-md border border-amber-300/70 bg-amber-50/70 p-2.5 dark:border-amber-700/60 dark:bg-amber-950/20">
          <p className="flex items-start gap-1.5 text-[11px] text-amber-800 dark:text-amber-300">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {state.message}
          </p>
        </div>
      )}

      {state.error && (
        <p className="flex items-start gap-1.5 text-[11px] text-destructive">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {state.error}
        </p>
      )}

      {state.datasetReady && state.message && !state.results.length && (
        <p className="flex items-start gap-1.5 text-[11px] text-amber-800 dark:text-amber-300">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {state.message}
        </p>
      )}

      {state.results.length > 0 && (
        <div className="max-h-72 divide-y divide-border overflow-y-auto rounded-md border border-border bg-card">
          {state.results.map((r) => {
            const isBusy = busy && busy === (r.uri || r.code);
            return (
              <button
                type="button"
                key={r.uri || `${r.code}-${r.display}`}
                onClick={() => pick(r)}
                disabled={!r.codable || Boolean(busy)}
                className="w-full px-2.5 py-2 text-left hover:bg-muted/60 disabled:opacity-50 disabled:hover:bg-transparent"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-primary">{r.code || "—"}</span>
                  <span className="text-sm">{r.display}</span>
                  {isBusy && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
                  {!r.codable && (
                    <span className="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      grouping entry — no code
                    </span>
                  )}
                  {r.is_leaf && (
                    <span className="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      most specific
                    </span>
                  )}
                  {r.has_exclusions && (
                    <span className="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      exclusions recorded
                    </span>
                  )}
                  {r.has_postcoordination && (
                    <span className="flex items-center gap-0.5 rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      <Layers className="h-2.5 w-2.5" /> postcoordination
                    </span>
                  )}
                </div>
                {r.display_ar && (
                  <p className="mt-0.5 text-[12px]" dir="rtl">
                    {r.display_ar}{" "}
                    <span className="text-[10px] text-muted-foreground">— {arabicSourceLabel(r.display_ar_source)}</span>
                  </p>
                )}
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {r.chapter}
                  {r.matched_on ? ` · matched on ${r.matched_on.replace("_", " ")}` : ""}
                  {r.matched_on === "partial" ? " — partial text match, confirm the term" : ""}
                </p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}