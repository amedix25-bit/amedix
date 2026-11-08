import React from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ExternalLink, Library } from "lucide-react";
import { guidanceForPulmNote } from "@/lib/pulmonologyReferences";

const asObject = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : {});

// The guideline basis recorded with the note. The note keeps its own attribution
// so an exported or printed record still states which documents it was written
// against, and any edition that has to be re-checked at the source is shown as
// such rather than presented as current guidance.
export default function PulmonologyGuidanceField({ value, noteKey, onChange }) {
  const state = asObject(value);
  const refs = guidanceForPulmNote(noteKey);

  const basis = refs
    .map((r) => `${r.issuing_organization} — ${r.title} (${r.edition})${r.status !== "current" ? " — edition to be re-checked" : ""}`)
    .join("; ");

  const record = () => onChange({ text: basis, references: refs.map((r) => r.key), recorded_datetime: new Date().toISOString() });

  return (
    <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-2.5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <Library className="h-3.5 w-3.5 text-primary" /> Guideline basis of this note
        </p>
        <Link to="/clinical-references" className="text-[11px] text-primary flex items-center gap-1 shrink-0">
          References library <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      {refs.length === 0 ? (
        <p className="text-[11px] text-muted-foreground">
          No guideline is registered as the basis of this note type. The note therefore records only the clinician's own
          documentation.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {refs.map((r) => (
            <li key={r.key} className="text-[11px] leading-relaxed">
              <span className="font-medium">{r.issuing_organization}</span> — {r.title}
              <span className="text-muted-foreground"> ({r.edition}; {r.population})</span>
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
            </li>
          ))}
        </ul>
      )}

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
          disabled={!refs.length}
          className="rounded-md border border-border bg-card px-2 py-1 text-[11px] hover:bg-muted disabled:opacity-50"
        >
          {state.text ? "Re-record basis" : "Record basis with note"}
        </button>
      </div>
    </div>
  );
}