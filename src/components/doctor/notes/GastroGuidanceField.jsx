import React from "react";
import { BookOpen } from "lucide-react";
import { gastroNoteBasis } from "@/lib/gastroenterologyReferences";

// The guideline attribution the note records about itself: which body's guidance
// its content and prompts were built from, in which edition, and for which
// population. Where two bodies differ the note says so instead of implying a
// single universal recommendation.
export default function GastroGuidanceField({ noteKey }) {
  const entry = gastroNoteBasis(noteKey);
  if (!entry) return null;

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border bg-muted/40 px-3 py-2">
        <p className="text-xs font-semibold text-primary flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5" />
          {entry.note} — guideline basis
        </p>
        <p className="text-[11px] text-muted-foreground mt-1">{entry.states}</p>
      </div>

      <ul className="space-y-2">
        {entry.basis.map((ref) => (
          <li key={`${ref.organization}-${ref.title}`} className="rounded-md border border-border px-2.5 py-2">
            <p className="text-[11px] font-semibold text-foreground">
              {ref.organization} — {ref.title}
            </p>
            <p className="text-[11px] text-muted-foreground">{ref.edition}</p>
            <p className="text-[11px] text-muted-foreground">Population: {ref.population}</p>
            <p className="text-[11px] text-muted-foreground">Applied here to: {ref.applies}</p>
            {ref.url ? (
              <a
                href={ref.url}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-primary underline underline-offset-2"
              >
                {ref.organization} reference
              </a>
            ) : null}
          </li>
        ))}
      </ul>

      <p className="text-[11px] text-muted-foreground">
        The attribution above is recorded with the note so an exported record keeps its evidence base. A guideline is
        not a protocol: the clinician's own institutional policy and the individual patient decide management, and any
        departure is documented in the note.
      </p>
    </div>
  );
}