import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Shield, Check, X, ScanLine, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePatientLanguage } from "@/lib/patientLanguage";

const nowIso = () => new Date().toISOString();
const today = () => new Date().toISOString().slice(0, 10);

// Patient → Access & Privacy → Radiologist Access Requests.
// Same patient-controlled model as Doctor Access: pending requests can be
// accepted or declined, the eye icon suspends/restores access, and a
// radiologist can be removed from the list. Every decision notifies the
// radiologist in their portal.
export default function PatientRadiologistAccessControl({ profile }) {
  const { t } = usePatientLanguage();
  const [requests, setRequests] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    if (!profile?.id) return;
    try {
      const reqs = await base44.entities.RadiologistAccessRequest.filter(
        { patient_id: profile.id },
        "-date_requested"
      );
      setRequests(reqs);
    } catch (err) {
      console.error(err);
      setRequests([]);
    }
  }, [profile?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const notifyRadiologist = async (req, title, message) => {
    try {
      await base44.entities.RadiologistNotification.create({
        radiologist_user_id: req.radiologist_user_id,
        type: "patient_authorization",
        title,
        message,
        patient_id: req.patient_id,
        patient_name: req.patient_name,
        target: "my_patients",
        related_id: req.id,
        datetime: nowIso(),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const updateAccess = async (req, status) => {
    setBusyId(req.id);
    try {
      const patch = { status };
      if (status === "approved" || status === "declined") patch.date_responded = today();
      await base44.entities.RadiologistAccessRequest.update(req.id, patch);

      if (status === "approved") {
        await notifyRadiologist(req, "Access granted", `${profile.full_name} granted you access to their medical record.`);
      } else if (status === "declined") {
        await notifyRadiologist(req, "Access declined", `${profile.full_name} declined your access request.`);
      } else if (status === "suspended") {
        await notifyRadiologist(req, "Access suspended", `${profile.full_name} temporarily suspended your access.`);
      } else if (status === "revoked") {
        await notifyRadiologist(req, "Access removed", `${profile.full_name} removed you from their Radiologist Access list.`);
      }
    } catch (err) {
      console.error(err);
    }
    await load();
    setBusyId(null);
  };

  const toggleEye = (req) =>
    req.status === "approved" ? updateAccess(req, "suspended") : updateAccess(req, "approved");

  if (requests === null) {
    return (
      <div className="flex items-center text-muted-foreground text-sm">
        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t("Loading...")}
      </div>
    );
  }

  const pending = requests.filter((r) => r.status === "pending");
  const radiologistAccess = requests.filter((r) => r.status === "approved" || r.status === "suspended");
  const declined = requests.filter((r) => r.status === "declined");

  const subline = (req) =>
    [req.radiologist_specialization, req.radiologist_hospital].filter(Boolean).join(" · ") || null;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
          <ScanLine className="w-4 h-4 text-primary" />
          {t("Radiologist Access")}
        </h3>
      </div>

      {pending.length > 0 && (
        <div>
          <h4 className="font-semibold text-sm mb-3">{t("Pending Radiologist Requests")}</h4>
          <div className="space-y-3">
            {pending.map((req) => (
              <div key={req.id} className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium">{req.radiologist_name}</p>
                    {subline(req) && <p className="text-sm text-muted-foreground">{subline(req)}</p>}
                    <p className="text-xs text-muted-foreground mt-1">{t("Requested on")} {req.date_requested}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" onClick={() => updateAccess(req, "approved")} disabled={busyId === req.id}>
                      <Check className="w-4 h-4 mr-1" />
                      {t("Accept")}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => updateAccess(req, "declined")} disabled={busyId === req.id}>
                      <X className="w-4 h-4 mr-1" />
                      {t("Decline")}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        {radiologistAccess.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm border border-dashed border-border rounded-xl">
            <Shield className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>{t("No radiologists currently have access")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {radiologistAccess.map((req) => {
              const granted = req.status === "approved";
              return (
                <div key={req.id} className="rounded-xl border border-border bg-card p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium flex flex-wrap items-center gap-2">
                        {req.radiologist_name}
                        {granted ? (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {t("Access Granted")}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            {t("Access Suspended")}
                          </span>
                        )}
                      </p>
                      {subline(req) && <p className="text-sm text-muted-foreground">{subline(req)}</p>}
                      <p className="text-xs text-muted-foreground mt-1">{t("Access granted on")} {req.date_responded || "—"}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleEye(req)}
                      disabled={busyId === req.id}
                      title={granted ? t("Turn off this radiologist's access") : t("Restore this radiologist's access")}
                      className={`w-10 h-10 rounded-full flex items-center justify-center border shrink-0 transition-colors disabled:opacity-50 ${
                        granted
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted text-muted-foreground border-border"
                      }`}
                    >
                      {granted ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                    </button>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateAccess(req, "revoked")}
                      disabled={busyId === req.id}
                    >
                      <X className="w-4 h-4 mr-1" />
                      {t("Remove Radiologist")}
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
          <h4 className="font-semibold text-sm mb-3 text-muted-foreground">{t("Declined Radiologist Requests")}</h4>
          <div className="space-y-2">
            {declined.map((req) => (
              <div
                key={req.id}
                className="rounded-lg border border-border bg-muted/30 p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">{req.radiologist_name}</p>
                  <p className="text-xs text-muted-foreground">{t("Declined on")} {req.date_responded || req.date_requested}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => updateAccess(req, "approved")} disabled={busyId === req.id}>
                  <Check className="w-4 h-4 mr-1" />
                  {t("Re-accept Access")}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}