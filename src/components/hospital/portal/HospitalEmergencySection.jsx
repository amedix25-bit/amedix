import React, { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { AlertCircle, Loader2 } from "lucide-react";
import EmergencyQrPanel from "./EmergencyQrPanel";
import EmergencyActivityList from "./EmergencyActivityList";
import EmergencyAuditList from "./EmergencyAuditList";

const errorText = (err, fallback) =>
  (err && err.response && err.response.data && err.response.data.error) || fallback;

// The hospital's Emergency QR workspace: the rotating department QR, immediate
// scan alerts, live sessions with revocation, and the immutable audit history.
export default function HospitalEmergencySection({ profile }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [loading, setLoading] = useState(true);

  const call = async (payload) => (await base44.functions.invoke("emergencyHospital", payload)).data;

  const load = useCallback(async () => {
    try {
      const result = await call({ action: "activity" });
      setData(result);
      setError("");
    } catch (err) {
      setError(errorText(err, "The Emergency QR activity could not be loaded."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // While an active QR exists it is re-minted inside its rotation window. A
  // revoked QR is never re-issued automatically.
  useEffect(() => {
    if (!data?.credential) return undefined;
    const timer = setInterval(async () => {
      try {
        const fresh = await call({ action: "rotate_qr" });
        setData((prev) => (prev ? { ...prev, qr: fresh.qr } : prev));
      } catch (e) {
        /* the next tick retries */
      }
    }, 45000);
    return () => clearInterval(timer);
  }, [data?.credential?.id]);

  useEffect(() => {
    const timer = setInterval(load, 30000);
    return () => clearInterval(timer);
  }, [load]);

  const rotate = async () => {
    setBusy(true);
    setError("");
    try {
      const fresh = await call({ action: "rotate_qr" });
      setData((prev) => ({
        ...(prev || {}),
        qr: fresh.qr,
        credential: prev?.credential || { id: fresh.credential_id, status: "active" },
      }));
      await load();
    } catch (err) {
      setError(errorText(err, "The Emergency QR could not be issued."));
    } finally {
      setBusy(false);
    }
  };

  const revokeQr = async () => {
    setBusy(true);
    setError("");
    try {
      await call({ action: "revoke_qr", reason: "Revoked by the hospital from the Emergency QR workspace." });
      setData((prev) => (prev ? { ...prev, credential: null, qr: null } : prev));
      await load();
    } catch (err) {
      setError(errorText(err, "The Emergency QR could not be revoked."));
    } finally {
      setBusy(false);
    }
  };

  const revokeSession = async (session) => {
    setBusyId(session.id);
    setError("");
    try {
      await call({ action: "revoke_session", session_id: session.id, reason: "Revoked by the hospital." });
      await load();
    } catch (err) {
      setError(errorText(err, "That emergency session could not be revoked."));
    } finally {
      setBusyId("");
    }
  };

  const retryAlert = async (alert) => {
    setBusyId(alert.id);
    setError("");
    try {
      const result = await call({ action: "retry_alert", alert_id: alert.id });
      if (result.delivery_status !== "delivered") {
        setError(`The notification could not be delivered yet: ${result.error || "unknown reason"}.`);
      }
      await load();
    } catch (err) {
      setError(errorText(err, "The notification retry failed."));
    } finally {
      setBusyId("");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading emergency activity…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 flex items-start gap-2">
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800">
          Alerts here are for monitoring and accountability. They never approve, hold or delay a doctor's emergency
          authorization, and the QR never grants access to a patient record on its own.
        </p>
      </div>

      <EmergencyQrPanel
        qr={data?.qr}
        credential={data?.credential}
        rotationSeconds={data?.rotation_seconds}
        onRotate={rotate}
        onRevoke={revokeQr}
        busy={busy}
        error={error}
      />

      <EmergencyActivityList
        alerts={data?.alerts}
        sessions={data?.active_sessions}
        onRetry={retryAlert}
        onRevokeSession={revokeSession}
        busyId={busyId}
      />

      <EmergencyAuditList entries={data?.audit} />

      <p className="text-xs text-muted-foreground">
        {profile?.hospital_name} · Emergency Department · the QR shown is bound to this facility only.
      </p>
    </div>
  );
}