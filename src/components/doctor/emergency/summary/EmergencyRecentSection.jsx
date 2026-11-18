import React from "react";
import { Section, Empty, formatStamp } from "./EmergencySummaryUi";

const GROUP = ({ title, rows, render }) => (
  <div>
    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
    {rows.map(render)}
  </div>
);

// A compact timeline of what recently happened to this patient. Full documents
// stay in the authorized record — only the summary reaches the emergency screen.
export default function EmergencyRecentSection({ data = {} }) {
  const encounters = data.encounters || [];
  const labs = data.laboratory_reports || [];
  const imaging = data.imaging_reports || [];
  const results = data.laboratory_results || [];
  const empty = !encounters.length && !labs.length && !imaging.length && !results.length;

  return (
    <Section title="Recent clinical information" status={empty ? "not_documented" : "documented"} meta={`${encounters.length + labs.length + imaging.length} entr${encounters.length + labs.length + imaging.length === 1 ? "y" : "ies"}`}>
      {empty && <Empty>No recent encounter, laboratory or imaging report documented in AMedix.</Empty>}

      {encounters.length > 0 && (
        <GROUP
          title="Encounters and visits"
          rows={encounters}
          render={(e) => (
            <div key={e.id} className="border-b border-border/60 py-1.5 text-sm last:border-0">
              <p className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-medium" dir="auto">{[e.type, e.department].filter(Boolean).join(" · ") || "Encounter"}</span>
                <span className="text-xs text-muted-foreground">{formatStamp(e.at) || "date not documented"}</span>
              </p>
              {e.presentation ? <p className="text-xs text-muted-foreground" dir="auto">Presented with: {e.presentation}</p> : null}
              <p className="text-[11px] text-muted-foreground">{[e.hospital, e.doctor, e.specialty, e.status].filter(Boolean).join(" · ")}</p>
            </div>
          )}
        />
      )}

      {labs.length > 0 && (
        <GROUP
          title="Recent laboratory reports"
          rows={labs}
          render={(r) => (
            <div key={r.id} className="border-b border-border/60 py-1.5 text-sm last:border-0">
              <p className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-medium" dir="auto">{r.title}</span>
                <span className="text-xs text-muted-foreground">{formatStamp(r.at)}</span>
              </p>
              <p className="whitespace-pre-wrap break-words text-xs text-muted-foreground" dir="auto">{r.summary}</p>
              {r.source ? <p className="text-[11px] text-muted-foreground">{r.source}</p> : null}
            </div>
          )}
        />
      )}

      {imaging.length > 0 && (
        <GROUP
          title="Recent imaging reports"
          rows={imaging}
          render={(r) => (
            <div key={r.id} className="border-b border-border/60 py-1.5 text-sm last:border-0">
              <p className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-medium" dir="auto">{r.title}</span>
                <span className="text-xs text-muted-foreground">{formatStamp(r.at)}</span>
              </p>
              <p className="whitespace-pre-wrap break-words text-xs text-muted-foreground" dir="auto">{r.summary}</p>
              {r.source ? <p className="text-[11px] text-muted-foreground">{r.source}</p> : null}
            </div>
          )}
        />
      )}

      {results.length > 0 && (
        <GROUP
          title="Recorded laboratory results"
          rows={results}
          render={(r) => (
            <p key={r.id} className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border/60 py-1 text-xs last:border-0">
              <span dir="auto">{[r.title, r.source].filter(Boolean).join(" · ")}</span>
              <span className="text-muted-foreground">{formatStamp(r.at)}</span>
            </p>
          )}
        />
      )}
      <p className="text-[11px] text-muted-foreground">{data.note}</p>
    </Section>
  );
}