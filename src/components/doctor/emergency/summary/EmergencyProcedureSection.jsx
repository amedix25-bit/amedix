import React from "react";
import { Badge } from "@/components/ui/badge";
import { Section, Provenance, Empty } from "./EmergencySummaryUi";

// Major surgery and implantable devices relevant to emergency management —
// pacemakers, valves, vascular access, transplants, previous anaesthetic
// problems, difficult airway and malignant hyperthermia.
export default function EmergencyProcedureSection({ data = {} }) {
  const items = data.items || [];
  const devices = data.devices || [];
  const flags = data.anaesthesia_flags || [];
  const relevantFlags = flags.filter((f) => f.difficult_airway || f.malignant_hyperthermia || f.complications || f.history);

  return (
    <Section title="Procedures, surgery and medical devices" status={items.length ? "documented" : "not_documented"} meta={`${items.length} recorded`}>
      {items.length === 0 && devices.length === 0 && <Empty>No surgical history or implanted device documented.</Empty>}

      {devices.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-800">Implanted devices</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {devices.map((d, i) => (
              <Badge key={`${d.device}-${i}`} variant="outline" className="border-amber-300 bg-card text-[11px] text-amber-900">
                <span dir="auto">{d.device}</span>
                {d.date ? <span className="ml-1 font-normal">· {d.date}</span> : null}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {items.map((p) => (
        <div key={p.id} className="border-b border-border/60 py-1.5 last:border-0">
          <p className="flex flex-wrap items-baseline justify-between gap-2 text-sm font-medium">
            <span dir="auto">
              {p.procedure}
              {p.procedure_ar ? <span className="text-muted-foreground" dir="rtl"> · {p.procedure_ar}</span> : null}
            </span>
            <span className="text-xs text-muted-foreground">{p.date || "date not documented"}</span>
          </p>
          {[p.reason, p.outcome, p.complications].filter(Boolean).length > 0 && (
            <p className="text-xs text-muted-foreground" dir="auto">
              {[p.reason ? `Reason: ${p.reason}` : "", p.outcome ? `Outcome: ${p.outcome}` : "", p.complications ? `Complications: ${p.complications}` : ""].join(" · ")}
            </p>
          )}
          {p.anaesthesia_complications ? <p className="text-xs text-red-800" dir="auto">Anaesthesia: {p.anaesthesia_complications}</p> : null}
          {p.difficult_airway ? <p className="text-xs font-semibold text-red-800">Documented difficult airway</p> : null}
          {p.malignant_hyperthermia ? <p className="text-xs font-semibold text-red-800">Documented malignant hyperthermia susceptibility</p> : null}
          <Provenance item={p} />
        </div>
      ))}

      {relevantFlags.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Anaesthetic history</p>
          {relevantFlags.map((f, i) => (
            <p key={`${f.procedure}-${i}`} className="text-sm" dir="auto">
              {[f.procedure, f.history, f.complications].filter(Boolean).join(" · ")}
            </p>
          ))}
        </div>
      )}
      <Provenance item={{ fhir: data.fhir }} />
    </Section>
  );
}