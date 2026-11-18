import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, Clock, RefreshCw, ShieldOff, UserRound } from "lucide-react";
import { dateTimeLabel, remainingLabel } from "@/lib/emergencyQr";

const deliveryBadge = (status) => {
  if (status === "delivered") return { label: "Delivered", cls: "border-emerald-300 bg-emerald-50 text-emerald-800" };
  if (status === "pending") return { label: "Pending", cls: "border-amber-300 bg-amber-50 text-amber-800" };
  return { label: "Failed", cls: "border-red-300 bg-red-50 text-red-800" };
};

// Live Emergency QR activity: every scan made with this hospital's ER QR, and
// every active emergency session. Monitoring and accountability only — none of
// this approves or delays a doctor's emergency authorization.
export default function EmergencyActivityList({ alerts, sessions, onRetry, onRevokeSession, busyId }) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="font-heading text-lg font-bold">Emergency QR activity</p>
        <p className="text-xs text-muted-foreground mt-1">
          Every scan is recorded the moment it happens, with the doctor's identity, licence and specialty.
        </p>

        <div className="mt-4 space-y-3">
          {(alerts || []).length === 0 && <p className="text-sm text-muted-foreground">No emergency QR scans yet.</p>}
          {(alerts || []).map((a) => {
            const badge = deliveryBadge(a.delivery_status);
            const live = new Date(a.session_expires || 0).getTime() > Date.now();
            return (
              <div key={a.id} className="rounded-xl border border-border p-3 space-y-1.5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold flex items-center gap-2">
                      <UserRound className="w-4 h-4 text-primary shrink-0" />
                      {a.doctor_name || "Doctor"}
                    </p>
                    <p className="text-xs text-muted-foreground break-all">
                      Account {a.doctor_user_id || "—"} · Licence {a.doctor_license || "—"} ·{" "}
                      {a.doctor_specialty || "Specialty not recorded"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="outline" className={badge.cls}>
                      {badge.label}
                    </Badge>
                    {a.patient_access_initiated ? (
                      <Badge variant="outline" className="border-blue-300 bg-blue-50 text-blue-800">
                        Patient access initiated
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        No patient access yet
                      </Badge>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {dateTimeLabel(a.scanned_datetime)}
                  </span>
                  <span>{a.hospital_name || ""}</span>
                  <span>{a.department || "Emergency Department"}</span>
                  <span>Session {a.session_ref || "—"}</span>
                  <span>{live ? `Expires in ${remainingLabel(a.session_expires)}` : "Session ended"}</span>
                </p>
                {a.delivery_status === "failed" && (
                  <div className="flex flex-wrap items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                    <p className="text-xs text-red-700 flex-1 min-w-0">
                      Hospital notification not delivered: {a.last_error || "unknown reason"}. The scan is preserved in the
                      audit log and stays queued for retry.
                    </p>
                    <Button size="sm" variant="outline" onClick={() => onRetry(a)} disabled={busyId === a.id}>
                      {busyId === a.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                      Retry
                    </Button>
                  </div>
                )}
                {a.delivery_status === "delivered" && a.delivered_datetime && (
                  <p className="text-[11px] text-emerald-700 inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Notification delivered {dateTimeLabel(a.delivered_datetime)}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="font-heading text-lg font-bold">Active emergency sessions</p>
        <p className="text-xs text-muted-foreground mt-1">
          Temporary authorizations still inside their window. A session can be revoked immediately.
        </p>
        <div className="mt-4 space-y-2">
          {(sessions || []).length === 0 && <p className="text-sm text-muted-foreground">No active emergency sessions.</p>}
          {(sessions || []).map((s) => (
            <div key={s.id} className="rounded-xl border border-border p-3 flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold">{s.doctor_name || "Doctor"}</p>
                <p className="text-xs text-muted-foreground break-all">
                  {s.patient_name ? `Patient ${s.patient_name} · CIN ${s.patient_cin || "—"}` : "No patient access initiated"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {s.session_ref} · {s.patient_id ? "Patient-specific access" : "Hospital authorization"} · expires in{" "}
                  {remainingLabel(s.session_expires)}
                </p>
              </div>
              <Button size="sm" variant="ghost" className="text-destructive" onClick={() => onRevokeSession(s)} disabled={busyId === s.id}>
                <ShieldOff className="w-4 h-4" /> Revoke
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}