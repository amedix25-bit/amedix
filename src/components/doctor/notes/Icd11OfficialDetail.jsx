import React from "react";
import { AlertTriangle, ExternalLink, Globe2, History } from "lucide-react";

const str = (v) => String(v ?? "").trim();
const list = (v) => (Array.isArray(v) ? v.filter((x) => str(x)) : []);

const TermGroup = ({ title, terms, tone }) => {
  const items = list(terms);
  if (!items.length) return null;
  return (
    <div>
      <p className={`text-[10px] font-semibold uppercase tracking-wide ${tone}`}>{title}</p>
      <ul className="mt-0.5 space-y-0.5">
        {items.map((t, i) => (
          <li key={`${t}-${i}`} className="text-[11px] leading-snug">
            {t}
          </li>
        ))}
      </ul>
    </div>
  );
};

// What the WHO record itself says about one coded diagnosis: the official
// definition, the inclusion and exclusion terms, the index synonyms, the
// classification path and the provenance (release, language, retrieval time, WHO
// entity URI). Everything shown here came back from the WHO service — nothing is
// paraphrased, translated or completed by AMedix.
export default function Icd11OfficialDetail({ entry }) {
  if (!entry) return null;
  const ancestors = Array.isArray(entry.ancestors) ? entry.ancestors.filter((a) => a && (a.display || a.code)) : [];
  const history = Array.isArray(entry.coding_history) ? entry.coding_history : [];
  const hasDetail =
    str(entry.definition) ||
    list(entry.inclusions).length ||
    list(entry.exclusions).length ||
    list(entry.index_terms).length ||
    ancestors.length;

  if (!hasDetail && entry.detail_status !== "detail_unavailable") return null;

  return (
    <div className="space-y-2 rounded-md border border-border bg-muted/40 px-2.5 py-2">
      <div className="flex flex-wrap items-center gap-2">
        <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          <Globe2 className="h-3 w-3" /> Official WHO record
        </p>
        {entry.language && (
          <span className="text-[10px] text-muted-foreground">
            term language: {entry.language === "ar" ? "العربية" : "English"}
          </span>
        )}
        {entry.retrieved_at && (
          <span className="text-[10px] text-muted-foreground">
            retrieved {new Date(entry.retrieved_at).toLocaleString()}
          </span>
        )}
        {entry.who_uri && (
          <a href={entry.who_uri} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[10px] text-primary">
            WHO entity <ExternalLink className="h-2.5 w-2.5" />
          </a>
        )}
        {entry.who_browser_url && (
          <a href={entry.who_browser_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[10px] text-primary">
            Browser page <ExternalLink className="h-2.5 w-2.5" />
          </a>
        )}
      </div>

      {entry.detail_status === "detail_unavailable" && (
        <p className="flex items-start gap-1.5 text-[11px] text-amber-700 dark:text-amber-400">
          <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
          The entry detail could not be read from the WHO service{str(entry.detail_error) ? `: ${entry.detail_error}` : "."} The
          code, the official term and the release are exactly what the search returned; the definition, inclusion and
          exclusion terms were not retrieved and are left empty rather than completed.
        </p>
      )}

      {str(entry.definition) && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Definition</p>
          <p className="mt-0.5 text-[11px] leading-relaxed">{entry.definition}</p>
        </div>
      )}

      {str(entry.long_definition) && str(entry.long_definition) !== str(entry.definition) && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Coding note / long definition</p>
          <p className="mt-0.5 text-[11px] leading-relaxed">{entry.long_definition}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <TermGroup title="Inclusion terms" terms={entry.inclusions} tone="text-emerald-700 dark:text-emerald-400" />
        <TermGroup title="Exclusion terms" terms={entry.exclusions} tone="text-destructive" />
      </div>

      <TermGroup title="Also indexed as" terms={entry.index_terms} tone="text-muted-foreground" />

      {ancestors.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Classification path</p>
          <p className="mt-0.5 text-[11px] leading-relaxed">
            {ancestors
              .slice()
              .reverse()
              .map((a) => `${a.display}${a.code ? ` (${a.code})` : ""}`)
              .join(" → ")}
            {entry.code ? ` → ${entry.display} (${entry.code})` : ""}
          </p>
        </div>
      )}

      {history.length > 0 && (
        <div>
          <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            <History className="h-3 w-3" /> Coding history (append-only)
          </p>
          <ul className="mt-0.5 space-y-0.5">
            {history.map((h, i) => (
              <li key={`${h.datetime}-${i}`} className="text-[11px] leading-snug">
                <span className="text-muted-foreground">{new Date(h.datetime).toLocaleString()}</span> —{" "}
                {str(h.from_code) || "no code"} → {str(h.to_code) || "no code"}
                {str(h.to_display) ? ` (${h.to_display})` : ""}
                {str(h.note) ? ` · ${h.note}` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}