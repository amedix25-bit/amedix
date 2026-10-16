import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Check, Eye, EyeOff, Loader2, Send, UserCog } from "lucide-react";
import { usePatientLanguage } from "@/lib/patientLanguage";

const nowIso = () => new Date().toISOString();
const today = () => new Date().toISOString().slice(0, 10);

// Patient Portal → Imaging → View Results → "Send to Doctor".
// Expands to the patient's My Doctors list (doctors who have access).
// The eye icon suspends/restores that doctor's record access, and Send
// shares this specific finalized report with the chosen doctor.
export default function SendImagingResultToDoctor({ patientId, result }) {
  const { t } = usePatientLanguage();
  const [requests, setRequests] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [sendingId, setSendingId] = useState(null);
  const [sentIds, setSentIds] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const reqs = await base44.entities.AccessRequest.filter({ patient_id: patientId }, "-date_requested");
        setRequests(reqs);
      } catch (err) {
        console.error(err);
        setRequests([]);
      }
    };
    load();
  }, [patientId]);

  const myDoctors = (requests || []).filter((r) => r.status === "approved" || r.status === "suspended");

  const toggleEye = async (req) => {
    const granted = req.status === "approved";
    setBusyId(req.id);
    try {
      const patch = { status: granted ? "suspended" : "approved" };
      if (!granted) patch.date_responded = today();
      await base44.entities.AccessRequest.update(req.id, patch);
      await base44.entities.AccessAuditLog.create({
        patient_id: patientId,
        patient_user_id: req.patient_user_id,
        doctor_id: req.doctor_id,
        doctor_name: req.doctor_name,
        action: granted ? "access_suspended" : "access_restored",
        datetime: nowIso(),
      });
    } catch (err) {
      console.error(err);
    }
    setRequests((prev) =>
      prev.map((r) => (r.id === req.id ? { ...r, status: granted ? "suspended" : "approved" } : r))
    );
    setBusyId(null);
  };

  const handleSend = async (req) => {
    setSendingId(req.id);
    try {
      const res = await base44.functions.invoke("shareImagingResultWithDoctor", {
        access_request_id: req.id,
        imaging_result_id: result.id,
      });
      if (res.data && (res.data.notification || res.data.alreadySent)) {
        setSentIds((prev) => [...prev, req.id]);
      }
    } catch (err) {
      console.error(err);
    }
    setSendingId(null);
  };

  return (
    <div className="mt-3 rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
      <p className="text-sm font-semibold flex items-center gap-2">
        <Send className="w-4 h-4 text-primary" />
        {t("Send to Doctor")}
      </p>
      <p className="text-xs text-muted-foreground">
        {t("Choose a doctor to share this report with. The eye icon suspends or restores a doctor's access.")}
      </p>

      {requests === null ? (
        <div className="flex items-center text-muted-foreground text-sm">
          <Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t("Loading your doctors...")}
        </div>
      ) : myDoctors.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground text-sm">
          <UserCog className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p>{t("No doctors currently have access to your record")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {myDoctors.map((req) => {
            const granted = req.status === "approved";
            const sent = sentIds.includes(req.id);
            const subline = [req.doctor_specialization, req.doctor_hospital].filter(Boolean).join(" · ");
            return (
              <div key={req.id} className="rounded-xl border border-border bg-card p-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{req.doctor_name}</p>
                  {subline && <p className="text-xs text-muted-foreground truncate">{subline}</p>}
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {granted ? t("Has access to your record") : t("Access suspended — turn the eye back on to send")}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {sent ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
                      <Check className="w-3.5 h-3.5" /> {t("Sent")}
                    </span>
                  ) : (
                    <Button size="sm" onClick={() => handleSend(req)} disabled={!granted || sendingId === req.id}>
                      {sendingId === req.id ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4 mr-1" />
                      )}
                      {t("Send")}
                    </Button>
                  )}
                  <button
                    type="button"
                    onClick={() => toggleEye(req)}
                    disabled={busyId === req.id}
                    title={granted ? t("Turn off this doctor's access") : t("Restore this doctor's access")}
                    className={`w-9 h-9 rounded-full flex items-center justify-center border shrink-0 transition-colors disabled:opacity-50 ${
                      granted
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted text-muted-foreground border-border"
                    }`}
                  >
                    {granted ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}