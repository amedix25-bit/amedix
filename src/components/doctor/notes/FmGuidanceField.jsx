import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, Library, MapPin, AlertTriangle } from "lucide-react";
import { fmGuidanceForNote, fmLocalProtocolsFor, fmGuidanceBasis, FM_LOCAL_PROTOCOL_NOTICE } from "@/lib/fmReferences";

const asObject = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : {});

// The guideline basis recorded with the note, in two labelled parts: the
// INTERNATIONAL recommendations the documentation structure follows, and the
// LOCALLY approved protocols of the institution. The two are never merged — an
// international recommendation is not a local approval, and the note states plainly
// when no local protocol is registered.
export default function FmGuidanceField({ value, noteKey, onChange }) {
  const state = asObject(value);
  const refs = fmGuidanceForNote(noteKey);
  const local = fmLocalProtocolsFor(noteKey);
  const basis = fmGuidanceBasis(noteKey);

  useEffect(() => {
    if (state.text !== basis) {
      onChange({ ...state, text: basis, references: refs.map((r) => r.key), local_protocols: local.map((p) => p.key) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [basis]);

  return (
    <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-2.5">
      <div className="flex items-start justify-between gap-2">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <Library className="h-3.5 w-3.5 text-primary" /> Guideline basis of this note
        </p>
        <Link to="/clinical-references" className="flex shrink-0 items-center gap-1 text-[11px] text-primary">
          References library <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      <div className="space-y-1.5">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          International recommendations
        </p>
        {refs.length === 0 ? (
          <p className="text-[11px] text-muted-foreground">No international recommendation is registered for this note type.</p>
        ) : (
          <ul className="space-y-1.5">
            {refs.map((r) => (
              <li key={r.key} className="text-[11px] leading-relaxed">
                <span className="font-medium">{r.issuing_organization}</span> — {r.title}
                <span className="text-muted-foreground">
                  {" "}
                  ({r.version || "current edition"}
                  {r.publication_year ? `, ${r.publication_year}` : ""}; {r.population})
                </span>
                {r.source_url && (
                  <a
                    href={r.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-1 text-primary underline-offset-2 hover:underline"
                  >
                    source
                  </a>
                )}
                <span className="ml-1 inline-flex items-center gap-1 text-warning">
                  <AlertTriangle className="h-3 w-3" /> not yet re-checked for this deployment
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-1 rounded-md border border-border bg-card p-2">
        <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          <MapPin className="h-3 w-3" /> Locally approved protocols
        </p>
        <p className="text-[11px] text-muted-foreground leading-relaxed">{FM_LOCAL_PROTOCOL_NOTICE}</p>
      </div>

      <p className="text-[10px] text-muted-foreground leading-relaxed">
        Signing this note records the basis above with the note. A later edition of a guideline does not rewrite a signed
        note — it applies to the next note written.
      </p>
    </div>
  );
}