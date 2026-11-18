import React from "react";
import { Badge } from "@/components/ui/badge";
import { dateTimeLabel } from "@/lib/emergencyQr";

const tone = (event) => {
  if (event === "access_granted") return "border-emerald-300 bg-emerald-50 text-emerald-800";
  if (["access_denied", "rate_limited", "qr_revoked", "session_revoked"].includes(event))
    return "border-red-300 bg-red-50 text-red-800";
  if (["notification_failed", "suspicious_activity"].includes(event))
    return "border-amber-300 bg-amber-50 text-amber-800";
  return "border-border text-muted-foreground";
};

const label = (value) => String(value || "").replace(/_/g, " ");

// The hospital's read-only view of the immutable emergency audit trail.
export default function EmergencyAuditList({ entries }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="font-heading text-lg font-bold">Emergency audit history</p>
      <p className="text-xs text-muted-foreground mt-1">
        Written by the server for every emergency event. Neither doctors nor the hospital can edit or delete it.
      </p>
      <div className="mt-4 space-y-2 max-h-96 overflow-y-auto pr-1">
        {(entries || []).length === 0 && <p className="text-sm text-muted-foreground">No emergency events recorded yet.</p>}
        {(entries || []).map((e) => (
          <div key={e.id} className="rounded-lg border border-border p-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Badge variant="outline" className={`text-[10px] uppercase ${tone(e.event_type)}`}>
                {label(e.event_type)}
              </Badge>
              <span className="text-[11px] text-muted-foreground">{dateTimeLabel(e.datetime)}</span>
            </div>
            <p className="text-xs mt-1.5">
              {e.doctor_name ? `${e.doctor_name} — ` : ""}
              {e.detail || label(e.event_type)}
            </p>
            {(e.denial_reason || e.patient_name || e.session_ref) && (
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {[e.patient_name, e.session_ref, e.denial_reason].filter(Boolean).join(" · ")}
              </p>
            )}
            {e.suspicious && (
              <p className="text-[11px] text-amber-700 mt-0.5">Flagged for review — care was not delayed.</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}