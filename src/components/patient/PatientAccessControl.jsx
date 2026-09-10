import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Shield, Check, X, UserCog, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const nowIso = () => new Date().toISOString();
const today = () => new Date().toISOString().slice(0, 10);
// Patient → Access & Privacy → Doctor Access Requests.
// Pending doctor requests can be Accepted or Declined. Accepted doctors stay
// in the Doctor Access list, where the eye icon is the actual access control:
// eye open = the doctor can view the record, eye crossed = Access Suspended
// (the doctor stays in the list but cannot view anything). Declined requests
// stay recorded with a Re-accept option. Every change is written to the
// patient's access log with the date and time.
export default function PatientAccessControl({ patientId }) {
  const [requests, setRequests] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    if (!patientId) return;
    try {
      const reqs = await base44.entities.AccessRequest.filter({ patient_id: patientId }, "-date_requested");
      setRequests(reqs);
    } catch (err) {
      console.error(err);
      setRequests([]);
    }
  }, [patientId]);

  useEffect(() => {
    load();
  }, [load]);

  const logAction = async (req, action) => {
    try {
      await base44.entities.AccessAuditLog.create({
        patient_id: patientId,
        doctor_id: req.doctor_id,
        doctor_name: req.doctor_name,
        action,
        datetime: nowIso(),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const updateAccess = async (req, status, action) => {
    setBusyId(req.id);
    try {
      const patch = { status };
      if (status === "approved") patch.date_responded = today();
      if (status === "declined") patch.date_responded = today();
      await base44.entities.AccessRequest.update(req.id, patch);
      await logAction(req, action);
    } catch (err) {
      console.error(err);
    }
    await load();
    setBusyId(null);
  };

  const toggleEye = (req) =>
    req.status === "approved"
      ? updateAccess(req, "suspended", "access_suspended")
      : updateAccess(req, "approved", "access_restored");

  if (requests === null) {
    return (
      <div className="flex items-center text-muted-foreground text-sm">
        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading...
      </div>
    );
  }

  const pending = requests.filter((r) => r.status === "pending");
  const doctorAccess = requests.filter((r) => r.status === "approved" || r.status === "suspended");
  const declined = requests.filter((r) => r.status === "declined");

  const doctorSubline = (req) =>
    [req.doctor_specialization, req.doctor_hospital].filter(Boolean).join(" · ") || null;

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-primary mt-0.5" />
          <div>
            <p className="font-medium text-sm">Your medical record is private</p>
            <p className="text-xs text-muted-foreground mt-1">
              Doctors can only access your records with your approval. Use the eye icon to
              suspend or restore a doctor's access at any time — the doctor stays in your list.
            </p>
          </div>
        </div>
      </div>

      {pending.length > 0 && (
        <div>
          <h3 className="font-semibold text-sm mb-3">Pending Access Requests</h3>
          <div className="space-y-3">
            {pending.map((req) => (
              <div key={req.id} className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium">{req.doctor_name}</p>
                    {doctorSubline(req) && (
                      <p className="text-sm text-muted-foreground">{doctorSubline(req)}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">Requested on {req.date_requested}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      onClick={() => updateAccess(req, "approved", "access_granted")}
                      disabled={busyId === req.id}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateAccess(req, "declined", "access_declined")}
                      disabled={busyId === req.id}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Decline
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="font-semibold text-sm mb-3">Doctor Access</h3>
        {doctorAccess.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <UserCog className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>No doctors currently have access</p>
          </div>
        ) : (
          <div className="space-y-3">
            {doctorAccess.map((req) => {
              const granted = req.status === "approved";
              return (
                <div key={req.id} className="rounded-xl border border-border bg-card p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium flex flex-wrap items-center gap-2">
                        {req.doctor_name}
                        {granted ? (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Access Granted
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            Access Suspended
                          </span>
                        )}
                      </p>
                      {doctorSubline(req) && (
                        <p className="text-sm text-muted-foreground">{doctorSubline(req)}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">Access granted on {req.date_responded || "—"}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleEye(req)}
                      disabled={busyId === req.id}
                      title={granted ? "Turn off this doctor's access" : "Restore this doctor's access"}
                      className={`w-10 h-10 rounded-full flex items-center justify-center border shrink-0 transition-colors disabled:opacity-50 ${
                        granted
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted text-muted-foreground border-border"
                      }`}
                    >
                      {granted ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {granted
                      ? "This doctor can currently view your medical information."
                      : "This doctor cannot view your medical information until you turn access back on."}
                  </p>
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateAccess(req, "revoked", "access_revoked")}
                      disabled={busyId === req.id}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Remove Doctor
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {declined.length > 0 && (
        <div>
          <h3 className="font-semibold text-sm mb-3 text-muted-foreground">Declined Requests</h3>
          <div className="space-y-2">
            {declined.map((req) => (
              <div
                key={req.id}
                className="rounded-lg border border-border bg-muted/30 p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">{req.doctor_name}</p>
                  <p className="text-xs text-muted-foreground">Declined on {req.date_responded || req.date_requested}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateAccess(req, "approved", "access_granted")}
                  disabled={busyId === req.id}
                >
                  <Check className="w-4 h-4 mr-1" />
                  Re-accept Access
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}