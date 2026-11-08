import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, BookOpen, CheckCircle2, ExternalLink, Loader2, Search, ShieldCheck } from "lucide-react";
import {
  REFERENCE_STATUS,
  REFERENCE_STATUS_LABEL,
  REFERENCE_STATUS_TONE,
  REFERENCES_LAST_VERIFIED,
  referenceStatusLabel,
} from "@/lib/clinicalReferences";

// Clinical References Library.
//
// The register states, for every source the clinical modules cite: who issued
// it, its official title and topic, the version and dates the issuing body
// states, the official source link, when AMedix last checked it, and its status.
// It links to the original publication and never hosts or redistributes it.
export default function ClinicalReferences() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const page = await base44.entities.ClinicalReference.list({ sort: "issuing_organization", limit: 200 });
        if (!active) return;
        const items = page.items || [];
        setRecords(
          [...items].sort(
            (a, b) =>
              String(a.issuing_organization || "").localeCompare(String(b.issuing_organization || "")) ||
              String(a.title || "").localeCompare(String(b.title || "")),
          ),
        );
      } catch (e) {
        if (active) setError(e?.message || "The reference register could not be loaded.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return records.filter((r) => {
      if (status !== "all" && r.status !== status) return false;
      if (!q) return true;
      return [r.issuing_organization, r.title, r.clinical_topic, r.version]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [records, query, status]);

  const counts = useMemo(
    () => ({
      current: records.filter((r) => r.status === REFERENCE_STATUS.CURRENT).length,
      superseded: records.filter((r) => r.status === REFERENCE_STATUS.SUPERSEDED).length,
      under_review: records.filter((r) => r.status === REFERENCE_STATUS.UNDER_REVIEW).length,
    }),
    [records],
  );

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" /> Clinical References Library
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Register last checked on {REFERENCES_LAST_VERIFIED}. Every guideline-based recommendation in a clinical note
          displays its source, edition and check date. A superseded or under-review source is flagged and is never
          presented as current guidance.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-muted/40 p-3">
        <p className="text-xs font-medium flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-primary" /> How this library is used
        </p>
        <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
          AMedix cites these sources and links to each issuing body's own publication. It does not copy, host or
          redistribute the documents, and access is governed by each body's own terms. All clinical decisions remain
          the responsibility of the treating clinician; nothing here diagnoses or prescribes.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            className="pl-9"
            value={query}
            placeholder="Search by organization, title, topic or version"
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="sm:w-56">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses ({records.length})</SelectItem>
            <SelectItem value={REFERENCE_STATUS.CURRENT}>Current ({counts.current})</SelectItem>
            <SelectItem value={REFERENCE_STATUS.UNDER_REVIEW}>Under review ({counts.under_review})</SelectItem>
            <SelectItem value={REFERENCE_STATUS.SUPERSEDED}>Superseded ({counts.superseded})</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading the reference register…
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive flex items-center gap-1.5">
          <AlertTriangle className="w-4 h-4" /> {error}
        </p>
      )}

      {!loading && !error && filtered.length === 0 && (
        <p className="text-sm text-muted-foreground py-8 text-center">No reference matches this search.</p>
      )}

      <div className="space-y-3">
        {filtered.map((r) => {
          const supersededBy = r.superseded_by_key
            ? records.find((x) => x.key === r.superseded_by_key)
            : null;
          return (
            <div key={r.id || r.key} className="rounded-lg border border-border bg-card p-3 sm:p-4 space-y-2">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    {r.issuing_organization}
                  </p>
                  <p className="text-sm font-semibold leading-snug">{r.title}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {[r.clinical_topic, r.version].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <span
                  className={`text-[10px] font-medium border rounded px-2 py-0.5 shrink-0 ${
                    REFERENCE_STATUS_TONE[r.status] || REFERENCE_STATUS_TONE.under_review
                  }`}
                >
                  {r.status === REFERENCE_STATUS.CURRENT && <CheckCircle2 className="w-3 h-3 inline mr-1" />}
                  {r.status !== REFERENCE_STATUS.CURRENT && <AlertTriangle className="w-3 h-3 inline mr-1" />}
                  {referenceStatusLabel(r.status)}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                <div>
                  <p className="text-muted-foreground">Publication year</p>
                  <p className="font-medium">{r.publication_year || "Not stated by issuing body"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Version</p>
                  <p className="font-medium">{r.version || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Publication / update date</p>
                  <p className="font-medium">{r.publication_date || r.update_date || "Not stated"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last verified</p>
                  <p className="font-medium">{r.last_verified_date || "—"}</p>
                </div>
              </div>

              {r.population && (
                <p className="text-[11px]">
                  <span className="text-muted-foreground">Population: </span>
                  {r.population}
                </p>
              )}
              {r.what_it_supports && (
                <p className="text-[11px]">
                  <span className="text-muted-foreground">Supports in AMedix: </span>
                  {r.what_it_supports}
                </p>
              )}
              {r.status_note && (
                <p className="text-[11px] text-muted-foreground italic">{r.status_note}</p>
              )}
              {supersededBy && (
                <p className="text-[11px] text-red-700 dark:text-red-400">
                  Superseded by: {supersededBy.title} ({supersededBy.version || supersededBy.publication_year || "—"})
                </p>
              )}

              <div className="flex items-center gap-3 flex-wrap pt-1">
                {r.source_url && (
                  <a
                    href={r.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-primary font-medium flex items-center gap-1"
                  >
                    Official source <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {r.access_note && (
                  <Badge variant="outline" className="text-[10px]">
                    {r.access_note}
                  </Badge>
                )}
              </div>
              {r.copyright_note && (
                <p className="text-[10px] text-muted-foreground">{r.copyright_note}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}