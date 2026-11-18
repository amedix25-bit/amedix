import React from "react";
import { Droplet, ShieldAlert } from "lucide-react";
import { Section, StatusChip, Empty, formatStamp } from "./EmergencySummaryUi";

// Blood group is shown with its verification state, never as a transfusion
// instruction, and the hospital's own protocols always take precedence.
export default function EmergencyTransfusionSection({ data = {} }) {
  const transfusions = data.previous_transfusions || [];
  return (
    <Section title="Blood group and transfusion history" status={data.blood_group || transfusions.length ? "documented" : "not_documented"}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/50 px-2.5 py-1 text-sm font-semibold">
          <Droplet className="h-3.5 w-3.5 text-red-700" />
          {data.blood_group || "Not documented"}
        </span>
        {data.blood_group ? <StatusChip status={data.verified ? "documented" : "unverified"} /> : null}
        {data.source ? <span className="text-[11px] text-muted-foreground">{data.source}{data.recorded_at ? ` · ${formatStamp(data.recorded_at)}` : ""}</span> : null}
      </div>

      <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2">
        <p className="flex items-start gap-2 text-[11px] text-amber-900">
          <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{data.warning}</span>
        </p>
      </div>

      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Previous transfusions</p>
      {transfusions.length === 0 ? (
        <Empty>No previous transfusion documented.</Empty>
      ) : (
        transfusions.map((t, i) => (
          <div key={`${t.date}-${i}`} className="border-b border-border/60 py-1.5 last:border-0">
            <p className="text-sm font-medium">
              {[t.type, t.amount].filter(Boolean).join(" · ") || "Transfusion recorded"}
              {t.date ? <span className="text-xs text-muted-foreground"> · {t.date}</span> : null}
            </p>
            <p className="text-xs text-muted-foreground" dir="auto">
              {[t.reason ? `Reason: ${t.reason}` : "", t.timing, t.procedure].filter(Boolean).join(" · ")}
            </p>
            {t.reactions ? <p className="text-xs font-medium text-red-800" dir="auto">Reaction: {t.reactions}</p> : null}
          </div>
        ))
      )}
      <p className="text-xs text-muted-foreground">
        Known red-cell antibodies: <span className="font-medium">{data.antibodies || "not documented"}</span>
      </p>
    </Section>
  );
}