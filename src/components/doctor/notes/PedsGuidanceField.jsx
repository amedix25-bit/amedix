import React, { useEffect } from "react";
import { BookOpen, GitCompare } from "lucide-react";
import {
  pedsNoteBasis,
  pedsAttributionText,
  PEDS_GUIDELINE_CONFLICTS,
  PEDS_LAST_REVIEWED,
} from "@/lib/pedsReferences";

// The guideline attribution the note records about itself, plus the documented
// conflicts between bodies that apply to this note type: which body's guidance is
// followed, in which edition, for which population, and which document was NOT
// blended into it.
export default function PedsGuidanceField({ noteKey, value, onChange }) {
  const entry = pedsNoteBasis(noteKey);
  const text = pedsAttributionText(noteKey);
  const stored = value && typeof value === "object" ? value.text : "";

  const basisKeys = (entry?.basis || []).map((b) => b.key);
  const conflicts = PEDS_GUIDELINE_CONFLICTS.filter((c) =>
    c.positions.some((p) => basisKeys.includes(p.source)),
  );

  // Recorded once, into the note itself — the panel is not a second place to type
  // the same thing.
  useEffect(() => {
    if (!text || stored === text) return;
    onChange?.({ noteKey, text, reviewed: PEDS_LAST_REVIEWED, conflictKeys: conflicts.map((c) => c.key) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        <p className="text-[10px] text-muted-foreground mt-1">
          Requirements are AMedix&#39;s own wording of what the cited documents require to be recorded. Publisher text is
          not reproduced. Register last reviewed {PEDS_LAST_REVIEWED}.
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

      {conflicts.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <GitCompare className="w-3.5 h-3.5 text-primary" />
            Documents that differ on this note
          </p>
          {conflicts.map((conflict) => (
            <div key={conflict.key} className="rounded-md border border-warning/40 bg-warning/5 px-2.5 py-2">
              <p className="text-[11px] font-semibold text-foreground">{conflict.topic}</p>
              {conflict.positions.map((p) => (
                <p key={`${conflict.key}-${p.organization}`} className="text-[11px] text-muted-foreground leading-snug">
                  <span className="font-medium text-foreground">{p.organization}:</span> {p.position}
                </p>
              ))}
              <p className="text-[11px] text-muted-foreground leading-snug mt-1">
                <span className="font-medium text-foreground">Recorded resolution:</span> {conflict.resolution}
              </p>
            </div>
          ))}
          <p className="text-[10px] text-muted-foreground">
            The note records which document the department follows. Two positions are never blended into one instruction.
          </p>
        </div>
      )}
    </div>
  );
}