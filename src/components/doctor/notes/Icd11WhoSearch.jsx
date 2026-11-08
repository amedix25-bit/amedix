import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ExternalLink, Globe, Loader2, Search, ShieldCheck } from "lucide-react";
import { SPECIFICITY } from "@/lib/rheumIcd11";

const today = () => new Date().toISOString().slice(0, 10);

// Official WHO ICD-11 API search.
//
// This is the only place a code becomes VERIFIED: every result is exactly what
// the WHO service returned, and what the service returned is stored on the
// entry (release, WHO entity URI, retrieval time). When the workspace has no WHO
// subscription credentials the panel says so and the clinician uses the bundled
// catalogue or the WHO browser instead — an unverified code is never dressed up
// as verified, and no code is ever completed or inferred.
export default function Icd11WhoSearch({ onSelect }) {
  const [query, setQuery] = useState("");
  const [state, setState] = useState({ loading: false, error: "", notConfigured: "", results: [], release: "", retrievedAt: "" });

  const search = async () => {
    const q = query.trim();
    if (q.length < 2) return;
    setState({ loading: true, error: "", notConfigured: "", results: [], release: "", retrievedAt: "" });
    try {
      const res = await base44.functions.invoke("icd11WhoSearch", { mode: "search", query: q, limit: 15 });
      const data = res.data || {};
      if (data.configured === false) {
        setState({ loading: false, error: "", notConfigured: data.message || "WHO ICD-11 API is not configured.", results: [], release: "", retrievedAt: "" });
        return;
      }
      if (data.error) {
        setState({ loading: false, error: data.error, notConfigured: "", results: [], release: "", retrievedAt: "" });
        return;
      }
      setState({
        loading: false,
        error: "",
        notConfigured: "",
        results: Array.isArray(data.results) ? data.results : [],
        release: data.release || "",
        retrievedAt: data.retrieved_at || "",
      });
    } catch (e) {
      setState({ loading: false, error: e?.response?.data?.error || e.message || "WHO ICD-11 search failed.", notConfigured: "", results: [], release: "", retrievedAt: "" });
    }
  };

  const pick = (r) => {
    // Only a codable, complete WHO result can be selected. Everything the entry
    // records about its own verification comes from the API response.
    if (!r.codable) return;
    onSelect({
      code: r.code,
      display: r.display,
      synonyms: [],
      specificity: r.is_leaf ? SPECIFICITY.SUB : SPECIFICITY.BLOCK,
      definition: "",
      release: state.release,
      source: `WHO ICD-11 API — ${r.uri}`,
      verified_date: today(),
      mapping_state: "verified",
      hierarchy: { uri: r.uri, parent: "", chapter: r.chapter || "" },
      category: r.chapter || "",
      coding_note: r.is_leaf
        ? ""
        : "WHO returns this as a grouping entry — check whether a more specific subcategory applies before relying on it.",
      manual: false,
    });
    setState((s) => ({ ...s, results: [] }));
    setQuery("");
  };

  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-xs font-semibold text-primary flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5" /> Search the official WHO ICD-11 API
        </p>
        <a
          href="https://icd.who.int/browse/2024-01/mms/en"
          target="_blank"
          rel="noreferrer"
          className="text-[11px] text-primary flex items-center gap-1"
        >
          WHO browser <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      <div className="flex gap-2">
        <Input
          value={query}
          placeholder="Diagnosis or code — e.g. anaphylaxis, urticaria, 4A84"
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              search();
            }
          }}
        />
        <Button type="button" size="sm" onClick={search} disabled={state.loading || query.trim().length < 2}>
          {state.loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
          Search
        </Button>
      </div>

      <p className="text-[11px] text-muted-foreground">
        Results are returned by the WHO service itself and stored with their release, WHO entity URI and retrieval time.
        Selecting a result records a <span className="font-medium">suspected</span> diagnosis — it never confirms one.
      </p>

      {state.notConfigured && (
        <div className="rounded-md border border-amber-300/70 dark:border-amber-700/60 bg-amber-50/70 dark:bg-amber-950/20 p-2.5">
          <p className="text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {state.notConfigured}
          </p>
        </div>
      )}

      {state.error && (
        <p className="text-[11px] text-destructive flex items-start gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {state.error}
        </p>
      )}

      {state.results.length > 0 && (
        <div className="rounded-md border border-border divide-y divide-border bg-card max-h-72 overflow-y-auto">
          <div className="px-2.5 py-1.5 flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-[10px] gap-1">
              <ShieldCheck className="w-3 h-3" /> WHO ICD-11 MMS {state.release}
            </Badge>
            <span className="text-[10px] text-muted-foreground">
              retrieved {state.retrievedAt ? new Date(state.retrievedAt).toLocaleString() : "just now"}
            </span>
          </div>
          {state.results.map((r) => (
            <button
              type="button"
              key={r.uri || `${r.code}-${r.display}`}
              onClick={() => pick(r)}
              disabled={!r.codable}
              className="w-full text-left px-2.5 py-2 hover:bg-muted/60 disabled:opacity-50 disabled:hover:bg-transparent"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-semibold text-primary">{r.code || "—"}</span>
                <span className="text-sm">{r.display}</span>
                {!r.codable && (
                  <span className="text-[10px] text-muted-foreground border border-border rounded px-1.5 py-0.5">
                    grouping entry — no code
                  </span>
                )}
                {r.is_leaf && (
                  <span className="text-[10px] text-muted-foreground border border-border rounded px-1.5 py-0.5">
                    most specific
                  </span>
                )}
              </div>
              {r.chapter && <p className="text-[11px] text-muted-foreground mt-0.5">{r.chapter}</p>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}