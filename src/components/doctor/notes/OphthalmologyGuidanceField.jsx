import React, { useEffect } from "react";
import { BookOpen, AlertTriangle } from "lucide-react";
import {
  ophthNoteBasis,
  OPHTH_LAST_REVIEWED,
  OPHTH_REFERENCE_REGISTER,
} from "@/lib/ophthalmologyReferences";

// The attribution text that travels with the note itself, so an exported record
// keeps the evidence base it was written from.
export const ophthAttributionText = (noteKey) => {
  const entry = ophthNoteBasis(noteKey);
  if (!entry) return "";
  const refs = entry.basis.map(
    (b) =>
      `${b.organization} — ${b.title} (${b.edition}); population: ${b.population}; applied to: ${b.applies}${
        b.revision_verified ? "" : "; revision to be confirmed on the publisher's page"
      }${b.url ? `; ${b.url}` : ""}`,
  );
  return [
    `${entry.note} — guideline basis (AMedix own wording; publisher text is not reproduced)`,
    entry.states,
    ...refs,
    `Reference register last reviewed: ${OPHTH_LAST_REVIEWED}`,
  ].join("\n");
};

// The guideline attribution the note records about itself plus the department's
// reference register: which body's guidance the content and prompts follow, in
// which edition, for which population, and when it was last reviewed.
export default function OphthalmologyGuidanceField({ noteKey, value, onChange }) {
  const entry = ophthNoteBasis(noteKey);
  const text = ophthAttributionText(noteKey);
  const stored = value && typeof value === "object" ? value.text : "";

  // Recorded once, into the note itself — the panel is not a second place to
  // type the same thing.
  useEffect(() => {
    if (!text || stored === text) return;
    onChange?.({ noteKey, text });
  }, [text, stored]);

  if (!entry) return null;

  const register = OPHTH_REFERENCE_REGISTER.filter((r) =>
    entry.basis.some((b) => `${b.organization} — ${b.title}` === r.guideline),
  );
  const unverified = register.filter((r) => !r.revision_verified);

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border bg-muted/40 px-3 py-2">
        <p className="text-xs font-semibold text-primary flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5" />
          {entry.note} — guideline basis
        </p>
        <p className="text-[11px] text-muted-foreground mt-1">{entry.states}</p>
        <p className="text-[10px] text-muted-foreground mt-1">
          Requirements are AMedix&#39;s own wording of what the cited documents require to be recorded. Publisher text
          is not reproduced.
        </p>
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
            {!ref.revision_verified ? (
              <p className="text-[10px] text-warning mt-0.5">
                Current revision to be confirmed on the publisher&#39;s page at the next review.
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
        ))}
      </ul>

      <div className="rounded-md border border-border px-2.5 py-2">
        <p className="text-[11px] font-semibold text-foreground">Reference register — reviewed {OPHTH_LAST_REVIEWED}</p>
        <ul className="mt-1 space-y-1">
          {register.map((r) => (
            <li key={r.key} className="text-[10px] text-muted-foreground leading-relaxed">
              {r.guideline} — {r.type}, revision {r.revision}, governs: {r.applicable_notes.join("; ")}
            </li>
          ))}
        </ul>
        {unverified.length ? (
          <p className="flex items-start gap-1.5 text-[10px] text-warning mt-1.5">
            <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
            {unverified.length} {unverified.length === 1 ? "entry has" : "entries have"} a revision that must be
            confirmed against the publisher before this note is used as the department standard.
          </p>
        ) : null}
      </div>

      <p className="text-[11px] text-muted-foreground">
        The attribution above is recorded with the note so an exported record keeps its evidence base. A guideline is
        not a protocol: the clinician&#39;s own institutional policy and the individual patient decide management, and
        any departure is documented in the note.
      </p>
    </div>
  );
}