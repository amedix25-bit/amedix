import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Hospital, IdCard, Loader2, QrCode, ShieldAlert } from "lucide-react";
import EmergencyScanPanel from "./EmergencyScanPanel";
import EmergencyOptionsPanel from "./EmergencyOptionsPanel";
import EmergencyJustificationForm from "./EmergencyJustificationForm";
import EmergencyRecordView from "./EmergencyRecordView";
import { dateTimeLabel, remainingLabel, scannedQrKind } from "@/lib/emergencyQr";

const errorText = (err, fallback) =>
  (err && err.response && err.response.data && err.response.data.error) ||
  (err && err.data && err.data.error) ||
  fallback;

// Doctor entry point for BOTH emergency pathways:
//  · hospital Emergency Department QR → immediate temporary authorization
//  · patient Emergency QR → Emergency Medicine / Trauma Surgery only
// Every check is repeated on the server; this screen only drives the flow.
export default function EmergencyAccessSection({ onOpenPatientSearch, doctorProfile, onStartEncounter }) {
  const [stage, setStage] = useState("scan");
  const [scanner, setScanner] = useState(null);
  const [hospitalSession, setHospitalSession] = useState(null);
  const [scan, setScan] = useState(null);
  const [record, setRecord] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const call = async (payload) => (await base44.functions.invoke("emergencyAccess", payload)).data;

  const handleScan = async (value) => {
    setError("");
    setNotice("");
    const kind = scannedQrKind(value);
    if (!kind) {
      setError("This is not an AMedix emergency QR code. Use the patient's AMedix health card Emergency QR or the QR shown in the Emergency Department.");
      return;
    }
    setBusy(true);
    try {
      if (kind === "hospital") {
        const data = await call({ action: "hospital_qr_scan", token: value });
        setHospitalSession(data);
        setNotice(data.message);
        setScanner(null);
        setStage("scan");
      } else {
        const data = await call({
          action: "patient_qr_scan",
          token: value,
          session_id: hospitalSession && new Date(hospitalSession.session_expires).getTime() > Date.now()
            ? hospitalSession.session_id
            : "",
        });
        setScan(data);
        setScanner(null);
        setStage("options");
      }
    } catch (err) {
      setError(errorText(err, "The emergency QR check could not be completed. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  const submitAccess = async ({ reason, justification, confirmed }) => {
    setBusy(true);
    setError("");
    try {
      const data = await call({
        action: "initiate_access",
        scan_ticket: scan?.scan_ticket,
        reason,
        justification,
        confirmed,
      });
      setRecord(data);
      setStage("record");
    } catch (err) {
      setError(errorText(err, "Emergency access could not be granted. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  const refreshRecord = async () => {
    setBusy(true);
    setError("");
    try {
      const data = await call({ action: "session_bundle", session_id: record?.session_id });
      setRecord({ ...record, ...data });
    } catch (err) {
      setError(errorText(err, "This emergency access has ended. Scan the patient's Emergency QR again."));
    } finally {
      setBusy(false);
    }
  };

  const endRecord = async () => {
    setBusy(true);
    try {
      await call({ action: "end_session", session_id: record?.session_id });
      setRecord(null);
      setScan(null);
      setStage("scan");
      setNotice("Emergency access ended. The session is closed and recorded in the audit log.");
    } catch (err) {
      setError(errorText(err, "The session could not be closed. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  const hospitalLive = hospitalSession && new Date(hospitalSession.session_expires).getTime() > Date.now();

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-start gap-3">
          <ShieldAlert className="w-6 h-6 text-red-600 shrink-0" />
          <div className="min-w-0">
            <h2 className="font-heading text-lg font-bold">Emergency Access</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Two separate routes. The hospital Emergency Department QR authorizes any verified doctor immediately. The
              patient's Emergency QR is limited to verified Emergency Medicine and Trauma Surgery doctors. Both give
              temporary, patient-specific, logged access only.
            </p>
          </div>
        </div>

        {hospitalLive && (
          <div className="mt-4 flex flex-wrap items-start justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
            <div className="flex items-start gap-2 min-w-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-emerald-900">Emergency authorization granted</p>
                <p className="text-xs text-emerald-800">
                  {hospitalSession.hospital_name} · {hospitalSession.department} · expires in{" "}
                  {remainingLabel(hospitalSession.session_expires)}
                </p>
                <p className="text-xs text-emerald-800 mt-1">
                  You may now initiate patient-specific emergency access. Each patient still needs their own Emergency QR
                  scan and justification.
                </p>
              </div>
            </div>
            <Badge variant="outline" className="border-emerald-300 bg-emerald-100 text-emerald-800 font-mono text-[10px]">
              {hospitalSession.session_ref}
            </Badge>
          </div>
        )}

        {notice && !hospitalLive && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
            {notice}
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
      </div>

      {stage === "scan" && !scanner && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Button
            size="lg"
            className="h-auto py-5 flex-col items-start gap-1"
            onClick={() => setScanner("hospital")}
            disabled={busy}
          >
            <span className="inline-flex items-center gap-2 font-semibold">
              <Hospital className="w-5 h-5" /> Scan hospital ER QR
            </span>
            <span className="text-[11px] font-normal opacity-90 text-left">
              Any verified doctor · immediate temporary authorization · hospital alerted
            </span>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-auto py-5 flex-col items-start gap-1"
            onClick={() => setScanner("patient")}
            disabled={busy}
          >
            <span className="inline-flex items-center gap-2 font-semibold">
              <IdCard className="w-5 h-5" /> Scan patient Emergency QR
            </span>
            <span className="text-[11px] font-normal text-muted-foreground text-left">
              {hospitalLive
                ? "Authorized by your live hospital emergency session"
                : "Emergency Medicine and Trauma Surgery doctors only"}
            </span>
          </Button>
        </div>
      )}

      {scanner && (
        <EmergencyScanPanel
          title={scanner === "hospital" ? "Hospital Emergency Department QR" : "Patient Emergency QR"}
          description={
            scanner === "hospital"
              ? "Scan the rotating QR displayed in the Emergency Department. It refreshes every two minutes."
              : "Scan the Emergency QR on the patient's AMedix health card."
          }
          label={scanner === "hospital" ? "Point the camera at the Emergency Department QR" : "Point the camera at the patient's Emergency QR"}
          onScan={handleScan}
          onClose={() => setScanner(null)}
        />
      )}

      {busy && !scanner && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> Checking your authorization…
        </div>
      )}

      {stage === "options" && (
        <EmergencyOptionsPanel
          scan={scan}
          hospitalSession={hospitalSession}
          onEmergency={() => {
            setError("");
            setStage("justify");
          }}
          onRegular={() => {
            setError("");
            setStage("regular");
          }}
          onRescan={() => {
            setScan(null);
            setStage("scan");
          }}
        />
      )}

      {stage === "regular" && (
        <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-primary" />
            <p className="font-semibold">Regular appointment pathway</p>
          </div>
          <p className="text-sm text-muted-foreground">
            No emergency privileges were granted. This patient's record stays on the normal consent flow: request access
            as usual and the patient approves it.
          </p>
          <p className="text-sm">
            Patient CIN: <span className="font-mono font-semibold">{scan?.patient?.cin || "—"}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => onOpenPatientSearch && onOpenPatientSearch(scan?.patient?.cin || "")}>
              Open Find Patient
            </Button>
            <Button variant="ghost" onClick={() => setStage("options")}>
              Back
            </Button>
          </div>
        </div>
      )}

      {stage === "justify" && (
        <EmergencyJustificationForm
          patient={scan?.patient}
          onSubmit={submitAccess}
          onBack={() => setStage("options")}
          busy={busy}
          error={error}
        />
      )}

      {stage === "record" && record && (
        <EmergencyRecordView
          record={record}
          onRefresh={refreshRecord}
          onEnd={endRecord}
          busy={busy}
          error={error}
          doctorProfile={doctorProfile}
          onStartEncounter={onStartEncounter}
        />
      )}

      <p className="text-xs text-muted-foreground">
        Every scan, authorization, denial, revocation and notification is written to an immutable audit log. Expired or
        revoked sessions must be re-authorized; nothing here becomes permanent patient permission.
        {hospitalSession ? ` Hospital authorization checked ${dateTimeLabel(hospitalSession.session_expires)}.` : ""}
      </p>
    </div>
  );
}