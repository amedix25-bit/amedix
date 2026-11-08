import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ExternalLink, Globe, Loader2, Search, ShieldCheck } from "lucide-react";
import { SPECIFICITY } from "@/lib/rheumIcd11";

const today = () => new Date().toISOString().slice(0, 10);

// Official WHO ICD-11 API search — the classification entry point for the whole
// app, used by every specialty's diagnosis field.
//
// This is the only place a code becomes VERIFIED: every result is exactly what
// the WHO service returned, and the entry records the release, the WHO entity
// URI, the retrieval time and the language the official term was requested in.
// Selecting a result additionally reads the WHO record itself, so the note
// carries the official definition, inclusion and exclusion terms and the
// classification path the service reports. Nothing is generated, completed,
// crosswalked or translated by AMedix, and no ICD-10 code appears anywhere.
export default function Icd11WhoSearch({ onSelect }) {
  const [query, setQuery] = useState("");
  const [lang, setLang] = useState("en");
  const [busyUri, setBusyUri] = useState("");
  const [state, setState] = useState({
    loading: false,
    error: "",
    notConfigured: "",
    results: [],
    release: "",
    retrievedAt: "",
    language: "en",
  });

  const search = async () => {
    const q = query.trim();
    if (q.length < 2) return;
    setState({ loading: true, error: "", notConfigured: "", results: [], release: "", retrievedAt: "", language: lang });
    try {
      const res = await base44.functions.invoke("icd11WhoSearch", { mode: "search", query: q, limit: 15, lang });
      const data = res.data || {};
      if (data.configured === false) {
        setState({ loading: false, error: "", notConfigured: data.message || "WHO ICD-11 API is not configured.", results: [], release: "", retrievedAt: "", language: lang });
        return;
      }
      if (data.error) {
        setState({ loading: false, error: data.error, notConfigured: "", results: [], release: "", retrievedAt: "", language: lang });
        return;
      }
      setState({
        loading: false,
        error: "",
        notConfigured: "",
        results: Array.isArray(data.results) ? data.results : [],
        release: data.release || "",
        retrievedAt: data.retrieved_at || "",
        language: data.language || lang,
      });
    } catch (e) {
      setState({
        loading: false,
        error: e?.response?.data?.error || e.message || "WHO ICD-11 search failed.",
        notConfigured: "",
        results: [],
        release: "",
        retrievedAt: "",
        language: lang,
      });
    }
  };

  const pick = async (r) => {
    // Only a codable, complete WHO result can be selected.
    if (!r.codable) return;
    setBusyUri(r.uri || r.code);
    let detail = null;
    let detailError = "";
    try {
      const res = await base44.functions.invoke("icd11WhoSearch", { mode: "entity", uri: r.uri, lang: state.language });
      const data = res.data || {};
      if (data.entry) detail = data.entry;
      else detailError = data.error || "The WHO service did not return the entry detail.";
    } catch (e) {
      detailError = e?.response?.data?.error || e.message || "The WHO entry detail could not be read.";
    }
    setBusyUri("");

    onSelect({
      code: r.code,
      display: r.display,
      synonyms: detail?.index_terms || [],
      specificity: r.is_leaf ? SPECIFICITY.SUB : SPECIFICITY.BLOCK,
      definition: detail?.definition || "",
      long_definition: detail?.long_definition || "",
      inclusions: detail?.inclusions || [],
      exclusions: detail?.exclusions || [],
      index_terms: detail?.index_terms || [],
      coding_note:
        detail?.coding_note ||
        (r.is_leaf
          ? ""
          : "WHO returns this as a grouping entry — check whether a more specific subcategory applies before relying on it."),
      ancestors: detail?.ancestors || [],
      who_uri: r.uri || detail?.uri || "",
      who_browser_url: detail?.browser_url || "",
      detail_status: detail ? "read" : detailError ? "detail_unavailable" : "search_only",
      detail_error: detailError,
      release: state.release,
      language: state.language,
      retrieved_at: state.retrievedAt,
      source: `WHO ICD-11 API — ${r.uri}`,
      verified_date: today(),
      mapping_state: "verified",
      hierarchy: { uri: r.uri, parent: "", chapter: r.chapter || "" },
      category: r.chapter || "",
      manual: false,
    });
    setState((s) => ({ ...s, results: [] }));
    setQuery("");
  };

  return (
    <div className="space-y-2 rounded-lg border border-primary/30 bg-primary/5 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-primary">
          <Globe className="h-3.5 w-3.5" /> Search the official WHO ICD-11 API
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
          <a href="https://icd.who.int/browse/2024-01/mms/en" target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[11px] text-primary">
            WHO browser <ExternalLink className="h-3 w-3" />
          </a>
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
        Results come from the WHO service itself and are stored with their release, WHO entity URI, retrieval time and
        the language the official term was requested in. Selecting a result also records the official definition, the
        inclusion and exclusion terms and the classification path the WHO record reports. It records a{" "}
        <span className="font-medium">suspected</span> diagnosis — it never confirms one.
      </p>

      {state.notConfigured && (
        <div className="rounded-md border border-amber-300/70 bg-amber-50/70 p-2.5 dark:border-amber-700/60 dark:bg-amber-950/20">
          <p className="flex items-start gap-1.5 text-[11px] text-amber-800 dark:text-amber-300">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {state.notConfigured}
          </p>
        </div>
      )}

      {state.error && (
        <p className="flex items-start gap-1.5 text-[11px] text-destructive">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {state.error}
        </p>
      )}

      {state.results.length > 0 && (
        <div className="max-h-72 divide-y divide-border overflow-y-auto rounded-md border border-border bg-card">
          <div className="flex flex-wrap items-center gap-2 px-2.5 py-1.5">
            <Badge variant="outline" className="gap-1 text-[10px]">
              <ShieldCheck className="h-3 w-3" /> WHO ICD-11 MMS {state.release}
            </Badge>
            <span className="text-[10px] text-muted-foreground">
              {state.language === "ar" ? "العربية" : "English"} · retrieved{" "}
              {state.retrievedAt ? new Date(state.retrievedAt).toLocaleString() : "just now"}
            </span>
          </div>
          {state.results.map((r) => {
            const busy = busyUri && busyUri === (r.uri || r.code);
            return (
              <button
                type="button"
                key={r.uri || `${r.code}-${r.display}`}
                onClick={() => pick(r)}
                disabled={!r.codable || Boolean(busyUri)}
                className="w-full px-2.5 py-2 text-left hover:bg-muted/60 disabled:opacity-50 disabled:hover:bg-transparent"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-primary">{r.code || "—"}</span>
                  <span className="text-sm">{r.display}</span>
                  {busy && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
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
                </div>
                {r.chapter && <p className="mt-0.5 text-[11px] text-muted-foreground">{r.chapter}</p>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}