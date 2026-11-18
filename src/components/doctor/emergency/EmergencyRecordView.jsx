import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Droplet, Loader2, RefreshCw, ShieldAlert, Square } from "lucide-react";
import { dateTimeLabel, remainingLabel } from "@/lib/emergencyQr";

function Section({ title, children, empty }) {
  const hasRows = Array.isArray(children) ? children.length > 0 : !!children;
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">{title}</p>
      {hasRows ? children : <p className="text-sm text-muted-foreground">{empty || "None recorded."}</p>}
    </div>
  );
}

const row = "flex flex-wrap items-baseline justify-between gap-2 border-b border-border/60 py-1.5 last:border-0 text-sm";

// The minimum necessary emergency view. It renders exactly what the server
// released for this one session — documents, imaging archives and private
// notes are not part of the bundle.
export default function EmergencyRecordView({ record, onRefresh, onEnd, busy, error, onExpired }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const bundle = record?.bundle || {};
  const patient = bundle.patient || {};
  const remaining = remainingLabel(record?.access_expires);
  const expired = remaining === "Expired";

  useEffect(() => {
    if (expired && onExpired) onExpired();
  }, [expired, onExpired]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-2 font-semibold text-red-800">
              <ShieldAlert className="w-4 h-4" /> Emergency access active
            </p>
            <p className="font-heading text-xl font-bold text-primary mt-1">{patient.name || "—"}</p>
            <p className="text-sm text-muted-foreground">
              CIN {patient.cin || "—"} · DOB {patient.date_of_birth || "—"} · {patient.gender || "—"}
            </p>
          </div>
          <div className="text-sm text-red-900 space-y-1 text-right">
            <p className="font-mono text-xs">{record?.session_ref}</p>
            <p>
              {expired ? "Access expired" : "Expires in"} <strong>{remaining}</strong>
            </p>
            <p className="text-xs opacity-80">Started {dateTimeLabel(record?.access_start)}</p>
            <p className="text-xs opacity-80">Ends {dateTimeLabel(record?.access_expires)}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="bg-card border-red-300 text-red-800">
            <Droplet className="w-3 h-3 mr-1" /> Blood group {patient.blood_type || "Unknown"}
          </Badge>
          {(bundle.categories || []).map((c) => (
            <Badge key={c} variant="secondary" className="text-[11px]">
              {c}
            </Badge>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <Button size="sm" variant="outline" onClick={() => onRefresh()} disabled={busy || expired}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Refresh
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onEnd()} disabled={busy}>
            <Square className="w-4 h-4" /> End access now
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {(bundle.alerts || []).length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-800 mb-1">Emergency alerts</p>
          <ul className="text-sm text-amber-900 list-disc pl-5 space-y-0.5">
            {bundle.alerts.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Critical allergies" empty="No allergies recorded.">
          {(bundle.allergies || []).map((a, i) => (
            <div key={`${a.allergen}-${i}`} className={row}>
              <span className="font-medium">{a.allergen || "—"}</span>
              <span className="text-xs text-muted-foreground">
                {[a.type, a.severity, a.reaction, a.source === "patient_reported" ? "reported by patient" : ""]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </div>
          ))}
        </Section>

        <Section title="Current medications" empty="No current medications recorded.">
          {(bundle.medications || []).map((m, i) => (
            <div key={`${m.name}-${i}`} className={row}>
              <span className="font-medium">{m.name || "—"}</span>
              <span className="text-xs text-muted-foreground">
                {[m.dose, m.frequency, m.route].filter(Boolean).join(" · ") || "—"}
              </span>
            </div>
          ))}
        </Section>

        <Section title="Major medical conditions" empty="No conditions recorded.">
          {(bundle.conditions || []).map((c, i) => (
            <div key={`${c.name}-${i}`} className={row}>
              <span className="font-medium">{c.name || "—"}</span>
              <span className="text-xs text-muted-foreground">{[c.status, c.since].filter(Boolean).join(" · ")}</span>
            </div>
          ))}
        </Section>

        <Section title="Surgical history" empty="No surgical history recorded.">
          {(bundle.surgeries || []).map((s, i) => (
            <div key={`${s.procedure}-${i}`} className={row}>
              <span className="font-medium">{s.procedure || "—"}</span>
              <span className="text-xs text-muted-foreground">{s.date || "—"}</span>
            </div>
          ))}
        </Section>

        <Section title="Recent investigations" empty="No recent investigations recorded.">
          {(bundle.lab_results || []).map((l, i) => (
            <div key={`lab-${i}`} className={row}>
              <span className="font-medium">{l.test || "—"}</span>
              <span className="text-xs text-muted-foreground">{[l.date, l.laboratory].filter(Boolean).join(" · ")}</span>
            </div>
          ))}
          {(bundle.lab_reports || []).map((r, i) => (
            <div key={`report-${i}`} className="border-b border-border/60 py-2 last:border-0">
              <p className="text-sm font-medium">{r.tests || "Laboratory report"}</p>
              <p className="text-xs text-muted-foreground">{r.date || "—"}</p>
              <p className="text-sm mt-1 whitespace-pre-wrap break-words">{r.summary}</p>
            </div>
          ))}
        </Section>
      </div>

      <p className="text-xs text-muted-foreground">{bundle.access_policy}</p>
    </div>
  );
}