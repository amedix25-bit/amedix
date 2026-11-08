import React from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ExternalLink, Library, MapPin } from "lucide-react";
import {
  guidanceForPulmNote,
  pulmLocalProtocolsFor,
  pulmonologyGuidanceBasis,
  PULM_LOCAL_PROTOCOL_NOTICE,
} from "@/lib/pulmonologyReferences";

const asObject = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : {});

// The guideline basis recorded with the note, in two labelled parts: the
// INTERNATIONAL recommendations the documentation structure follows, and the
// LOCALLY approved protocols of the institution. The two are never merged — an
// international recommendation is not a local approval, and the note states
// plainly when no local protocol is registered.
export default function PulmonologyGuidanceField({ value, noteKey, onChange }) {
  const state = asObject(value);
  const refs = guidanceForPulmNote(noteKey);
  const local = pulmLocalProtocolsFor(noteKey);
  const basis = pulmonologyGuidanceBasis(noteKey);

  const record = () =>
    onChange({
      text: basis,
      references: refs.map((r) => r.key),
      local_protocols: local.map((p) => p.key),
      recorded_datetime: new Date().toISOString(),
    });

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
                  ({r.edition}
                  {r.publication_year ? `, ${r.publication_year}` : ""}; {r.population})
                </span>
                {r.status !== "current" && (
                  <span className="ml-1 inline-flex items-center gap-1 text-warning">
                    <AlertTriangle className="h-3 w-3" /> edition to be re-checked
                  </span>
                )}
                {r.source_url && (
                  <a href={r.source_url} target="_blank" rel="noreferrer" className="ml-1 text-primary underline-offset-2 hover:underline">
                    source
                  </a>
                )}
                {r.last_verified_date && (
                  <span className="text-muted-foreground"> · checked {r.last_verified_date}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-1.5 rounded-md border border-border bg-card p-2">
        <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          <MapPin className="h-3 w-3" /> Locally approved protocols
        </p>
        {local.length === 0 ? (
          <p className="text-[11px] text-muted-foreground">{PULM_LOCAL_PROTOCOL_NOTICE}</p>
        ) : (
          <ul className="space-y-1.5">
            {local.map((p) => (
              <li key={p.key} className="text-[11px] leading-relaxed">
                <span className="font-medium">{p.title}</span>
                <span className="text-muted-foreground">
                  {" "}
                  — {p.issuing_body}; approval {p.approval_reference}; adopted {p.approved_date}; review {p.review_date}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="text-[10px] text-muted-foreground">
        AMedix links to each issuing body and never copies or redistributes the document. A guideline is documentation
        support: the clinical decision, and the reason for departing from it, remain the treating clinician's and are
        recorded in the note.
      </p>

      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] text-muted-foreground">
          {state.text ? "Basis recorded with this note." : "Not yet recorded with this note."}
        </span>
        <button
          type="button"
          onClick={record}
          disabled={!refs.length && !local.length}
          className="rounded-md border border-border bg-card px-2 py-1 text-[11px] hover:bg-muted disabled:opacity-50"
        >
          {state.text ? "Re-record basis" : "Record basis with note"}
        </button>
      </div>
    </div>
  );
}