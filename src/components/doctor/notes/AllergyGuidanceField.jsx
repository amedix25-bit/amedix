import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { BookOpen, AlertTriangle } from "lucide-react";
import { allergyNoteBasis } from "@/lib/allergyReferences";

// The attribution text that travels with the note itself, so an exported record
// keeps the evidence base it was written from — including the edition, the
// population it applies to and the date the edition was last checked.
export const allergyAttributionText = (noteKey) => {
  const entry = allergyNoteBasis(noteKey);
  if (!entry) return "";
  const refs = entry.basis.map(
    (b) =>
      `${b.organization} — ${b.title} (${b.edition}); population: ${b.population}; applied to: ${b.applies}; edition checked: ${b.current_as_of}${b.status ? `; status: ${b.status}` : ""}${b.url ? `; ${b.url}` : ""}`,
  );
  return [`${entry.note} — guideline basis`, entry.states, ...refs].join("\n");
};

// The guideline attribution the note records about itself: which body's guidance
// its content and prompts were built from, in which edition, for which
// population, and when that edition was last checked. Where bodies differ the
// note says so instead of implying a single universal recommendation.
export default function AllergyGuidanceField({ noteKey, value, onChange }) {
  const entry = allergyNoteBasis(noteKey);
  const text = allergyAttributionText(noteKey);
  const stored = value && typeof value === "object" ? value.text : "";

  // Recorded once, into the note itself — the panel is not a second place to
  // type the same thing.
  useEffect(() => {
    if (!text || stored === text) return;
    onChange?.({ noteKey, text });
  }, [text, stored]);

  if (!entry) return null;

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border bg-muted/40 px-3 py-2">
        <p className="text-xs font-semibold text-primary flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5" />
          {entry.note} — guideline basis
        </p>
        <p className="text-[11px] text-muted-foreground mt-1">{entry.states}</p>
        <Link to="/clinical-references" className="text-[11px] text-primary font-medium inline-block mt-1">
          Open the Clinical References Library
        </Link>
      </div>

      <ul className="space-y-2">
        {entry.basis.map((ref) => {
          const outdated = ref.status && !/^current/i.test(ref.status);
          return (
            <li key={`${ref.organization}-${ref.title}`} className="rounded-md border border-border px-2.5 py-2">
              <p className="text-[11px] font-semibold text-foreground">
                {ref.organization} — {ref.title}
              </p>
              <p className="text-[11px] text-muted-foreground">{ref.edition}</p>
              <p className="text-[11px] text-muted-foreground">Population: {ref.population}</p>
              <p className="text-[11px] text-muted-foreground">Applied here to: {ref.applies}</p>
              <p className="text-[11px] text-muted-foreground">Edition checked: {ref.current_as_of}</p>
              {outdated ? (
                <p className="text-[11px] text-warning flex items-start gap-1 mt-0.5">
                  <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                  {ref.status} — do not treat this edition as current guidance.
                </p>
              ) : null}
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
          );
        })}
      </ul>

      <p className="text-[11px] text-muted-foreground">
        The attribution above is recorded with the note so an exported record keeps its evidence base. A guideline is not
        a protocol: the clinician&apos;s own institutional policy and the individual patient decide management, and any
        departure is documented in the note.
      </p>
    </div>
  );
}