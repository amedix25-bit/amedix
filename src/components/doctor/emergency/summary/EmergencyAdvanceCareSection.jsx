import React from "react";
import { FileWarning } from "lucide-react";
import { Section, Empty } from "./EmergencySummaryUi";

// AMedix holds no advance care planning document today, so this section reports
// that fact explicitly instead of implying a directive exists or does not exist.
export default function EmergencyAdvanceCareSection({ data = {} }) {
  const directives = data.directives || [];
  return (
    <Section title="Advance care planning and patient preferences" status={data.status || "not_documented"} meta={`${directives.length} directive(s)`}>
      <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
        <FileWarning className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0 space-y-1">
          <p className="text-sm">
            Substitute decision-maker / legal guardian: <span className="font-medium">{data.substitute_decision_maker || "not documented"}</span>
          </p>
          <p className="text-[11px] text-muted-foreground">{data.note}</p>
        </div>
      </div>
      {directives.length === 0 ? (
        <Empty>No resuscitation preference, DNACPR order or treatment limitation is recorded for this patient.</Empty>
      ) : (
        directives.map((d, i) => (
          <div key={`${d.type}-${i}`} className="border-b border-border/60 py-1.5 last:border-0 text-sm">
            <p className="font-medium">{d.type || "Directive"}</p>
            <p className="text-xs text-muted-foreground">{[d.date, d.author, d.verification].filter(Boolean).join(" · ")}</p>
          </div>
        ))
      )}
    </Section>
  );
}