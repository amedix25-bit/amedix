import React from "react";
import { Button } from "@/components/ui/button";
import { Activity, ClipboardPlus } from "lucide-react";
import { Section, StatusChip, Empty, formatStamp } from "./EmergencySummaryUi";

// Historical measurements are clearly labelled and never copied into the
// current emergency assessment — old values are not today's observations.
export default function EmergencyVitalsSection({ data = {}, onDocumentVitals }) {
  const historical = data.historical || {};
  const current = data.current || {};
  return (
    <>
      <Section title="Most recent historical measurements" status={historical.status} meta={historical.at ? formatStamp(historical.at) : ""}>
        {historical.status === "not_documented" ? (
          <Empty>No documented measurement found in the patient's AMedix records.</Empty>
        ) : (
          <>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-800">Historical — not the current emergency assessment</p>
            {(historical.measurements || []).length > 0 ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {(historical.measurements || []).map((m) => (
                  <div key={m.key} className="rounded-lg border border-border bg-muted/40 px-2.5 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{m.label}</p>
                    <p className="text-lg font-semibold leading-tight">
                      {m.value} <span className="text-xs font-normal text-muted-foreground">{m.unit}</span>
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatStamp(m.at)} · {m.source} · LOINC {m.loinc} · {m.ucum}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm" dir="auto">{historical.raw}</p>
            )}
            <p className="text-[11px] text-muted-foreground">
              {[historical.author ? `Recorded by ${historical.author}` : "", historical.at ? formatStamp(historical.at) : "", historical.source].filter(Boolean).join(" · ")}
            </p>
          </>
        )}
      </Section>

      <Section title="Current emergency assessment" status={current.status} meta={current.at ? formatStamp(current.at) : ""} defaultOpen>
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          <Activity className="h-3.5 w-3.5" /> This emergency episode
        </div>
        {current.status === "not_documented" ? (
          <Empty>No current measurement documented yet. Historical values above are not a substitute for a fresh assessment.</Empty>
        ) : (
          <>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {(current.measurements || []).map((m) => (
                <div key={m.key} className="rounded-lg border border-border bg-card px-2.5 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{m.label}</p>
                  <p className="text-lg font-semibold leading-tight">
                    {m.value} <span className="text-xs font-normal text-muted-foreground">{m.unit}</span>
                  </p>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">
              {[current.author ? `Documented by ${current.author}` : "", current.at ? formatStamp(current.at) : "", current.source].filter(Boolean).join(" · ")}
            </p>
          </>
        )}
        <div className="grid gap-1.5 sm:grid-cols-2">
          {[
            ["Pain score", "not documented"],
            ["Glasgow Coma Scale", "when indicated"],
            ["Neurological observations", "not documented"],
          ].map(([label, hint]) => (
            <p key={label} className="flex items-baseline justify-between gap-2 rounded border border-dashed border-border px-2 py-1 text-xs">
              <span>{label}</span>
              <span className="text-muted-foreground">{hint}</span>
            </p>
          ))}
        </div>
        <Button size="sm" variant="outline" onClick={onDocumentVitals} className="gap-2">
          <ClipboardPlus className="h-4 w-4" /> Document current vitals in the emergency encounter
        </Button>
      </Section>
    </>
  );
}