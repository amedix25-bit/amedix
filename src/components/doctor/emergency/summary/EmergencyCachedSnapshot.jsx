import React from "react";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CloudOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatStamp, Empty } from "./EmergencySummaryUi";

// Shown only when the summary could not be refreshed. What the doctor already
// holds from the authorization moment is displayed as CACHED with its sync time,
// and the information that could not be retrieved is named — an unavailable
// record is never presented as checked.
export default function EmergencyCachedSnapshot({ record, reason, onRetry, busy }) {
  const bundle = record?.bundle || {};
  const patient = bundle.patient || {};
  const at = record?.access_start || record?.access_expires;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3">
        <CloudOff className="mt-0.5 h-4 w-4 shrink-0 text-amber-800" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-amber-900">Showing cached emergency information — not refreshed</p>
          <p className="text-xs text-amber-900/90">
            Cached at {formatStamp(at) || "authorization"}. {reason || "The summary could not be retrieved."} Information not retrieved: full
            medication history, immunizations, vital signs, transfusion and pregnancy detail, advance care planning and recent reports.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={onRetry} disabled={busy} className="gap-1">
          <RefreshCw className={busy ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} /> Retry
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card p-3">
        <p className="font-heading text-lg font-bold" dir="auto">{patient.name || "Patient"}</p>
        <p className="text-xs text-muted-foreground">
          CIN {patient.cin || "—"} · DOB {patient.date_of_birth || "—"} · {patient.gender || "—"} · Blood group {patient.blood_type || "unknown"}
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {(bundle.alerts || []).map((a) => (
            <Badge key={a} variant="outline" className="border-amber-300 bg-amber-50 text-[11px] text-amber-900">
              <AlertCircle className="mr-1 h-3 w-3" /> {a}
            </Badge>
          ))}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Allergies (cached)</p>
          {(bundle.allergies || []).length === 0 ? (
            <Empty>No allergy documented in the cached record.</Empty>
          ) : (
            (bundle.allergies || []).map((a, i) => (
              <p key={`${a.allergen}-${i}`} className="border-b border-border/60 py-1 text-sm last:border-0" dir="auto">
                <span className="font-medium">{a.allergen}</span>
                <span className="text-xs text-muted-foreground"> · {[a.type, a.severity, a.reaction].filter(Boolean).join(" · ")}</span>
              </p>
            ))
          )}
        </div>
        <div className="rounded-xl border border-border bg-card p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Current medications (cached)</p>
          {(bundle.medications || []).length === 0 ? (
            <Empty>No current medication in the cached record.</Empty>
          ) : (
            (bundle.medications || []).map((m, i) => (
              <p key={`${m.name}-${i}`} className="border-b border-border/60 py-1 text-sm last:border-0" dir="auto">
                <span className="font-medium">{m.name}</span>
                <span className="text-xs text-muted-foreground"> · {[m.dose, m.frequency, m.route].filter(Boolean).join(" · ")}</span>
              </p>
            ))
          )}
        </div>
        <div className="rounded-xl border border-border bg-card p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Conditions (cached)</p>
          {(bundle.conditions || []).length === 0 ? (
            <Empty>No condition in the cached record.</Empty>
          ) : (
            (bundle.conditions || []).map((c, i) => (
              <p key={`${c.name}-${i}`} className="border-b border-border/60 py-1 text-sm last:border-0" dir="auto">
                <span className="font-medium">{c.name}</span>
                <span className="text-xs text-muted-foreground"> · {[c.status, c.since].filter(Boolean).join(" · ")}</span>
              </p>
            ))
          )}
        </div>
        <div className="rounded-xl border border-border bg-card p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Surgical history (cached)</p>
          {(bundle.surgeries || []).length === 0 ? (
            <Empty>No surgery in the cached record.</Empty>
          ) : (
            (bundle.surgeries || []).map((s, i) => (
              <p key={`${s.procedure}-${i}`} className="border-b border-border/60 py-1 text-sm last:border-0" dir="auto">
                <span className="font-medium">{s.procedure}</span>
                <span className="text-xs text-muted-foreground"> · {s.date || "date not documented"}</span>
              </p>
            ))
          )}
        </div>
      </div>
    </div>
  );
}