import React, { useState } from "react";
import { BookOpen, ChevronDown, ExternalLink, AlertTriangle } from "lucide-react";
import { getSurgeryReferenceSet, REFERENCE_LEVEL_LABELS } from "@/lib/surgeryReferences";

// Guideline basis for a General Surgery note type: which organization, which
// document, its publication date, the official source, what it supports in this
// template, whether it is a documentation standard, a recommendation or only a
// coding standard — plus the review date and the review flags. Records the
// basis of the documentation; it never states what the clinical decision must
// be, and returns nothing for non-surgery note types.
export default function SurgeryGuidelineBasis({ documentKey }) {
  const [open, setOpen] = useState(false);
  const set = getSurgeryReferenceSet(documentKey);
  if (!set) return null;

  const reviewed = new Date(`${set.reviewed}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

  return (
    <div className="rounded-lg border border-border bg-muted/30">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left"
      >
        <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <BookOpen className="w-3.5 h-3.5 text-primary" />
          Guideline basis &amp; references
          <span className="font-normal text-muted-foreground">· {set.references.length} sources · reviewed {reviewed}</span>
        </span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-3">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Supported in this note:</span> {set.fields}
          </p>
          <ul className="space-y-2">
            {set.references.map((r) => (
              <li key={r.id} className="rounded-md border border-border bg-card p-2.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-semibold text-foreground">{r.organization}</span>
                  <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground">
                    {REFERENCE_LEVEL_LABELS[r.level] || r.level}
                  </span>
                  <span className="text-[11px] text-muted-foreground">{r.version}</span>
                </div>
                <p className="text-xs text-foreground mt-0.5">{r.title}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{r.supports}</p>
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-primary hover:underline inline-flex items-center gap-1 mt-1 break-all"
                >
                  Official source <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
              </li>
            ))}
          </ul>

          <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-2.5">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Review flags
            </p>
            <ul className="list-disc list-inside space-y-1 mt-1">
              {set.flags.map((f) => (
                <li key={f} className="text-[11px] text-muted-foreground">
                  {f}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-[11px] text-muted-foreground">
            Documentation standards state what must be recorded; clinical recommendations are guidance and never override
            the treating clinician's judgement. AMedix does not certify compliance with any guideline and does not
            authorise any procedure.
          </p>
        </div>
      )}
    </div>
  );
}