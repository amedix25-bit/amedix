import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Loader2, QrCode, ShieldAlert, Siren } from "lucide-react";
import EmergencyScanPanel from "./EmergencyScanPanel";
import EmergencyOptionsPanel from "./EmergencyOptionsPanel";
import EmergencyJustificationForm from "./EmergencyJustificationForm";
import EmergencyRecordView from "./EmergencyRecordView";
import EmergencyIdentifyPatient from "./EmergencyIdentifyPatient";
import { scannedCin, scannedQrKind } from "@/lib/emergencyQr";

const errorText = (err, fallback) =>
  (err && err.response && err.response.data && err.response.data.error) ||
  (err && err.data && err.data.error) ||
  fallback;

// The active emergency access is remembered on this device, so a phone call, a
// different tab or closing the app never forces the doctor to scan and
// re-justify the same patient. The server still decides whether it is live.
const ACCESS_KEY = "amedix_emergency_active_session";
const HOSPITAL_KEY = "amedix_emergency_hospital_session";

// Doctor entry point for BOTH emergency pathways:
//  · hospital Emergency Department QR → immediate authorization, open 24/7
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

  // Resume an access that is still live when the screen is opened again.
  useEffect(() => {
    let cancelled = false;
    const restore = async () => {
      const savedHospital = localStorage.getItem(HOSPITAL_KEY);
      if (savedHospital) {
        try {
          const held = JSON.parse(savedHospital);
          if (held && new Date(held.session_expires).getTime() > Date.now()) setHospitalSession(held);
          else localStorage.removeItem(HOSPITAL_KEY);
        } catch (e) {
          localStorage.removeItem(HOSPITAL_KEY);
        }
      }
      const savedId = localStorage.getItem(ACCESS_KEY);
      if (!savedId) return;
      setBusy(true);
      try {
        const data = await call({ action: "session_bundle", session_id: savedId });
        if (cancelled) return;
        setRecord({ ...data, session_id: data.session_id || savedId });
        setStage("record");
      } catch (err) {
        localStorage.removeItem(ACCESS_KEY);
        if (!cancelled) setNotice("Your previous emergency access has ended. Scan the patient's QR again if you still need it.");
      } finally {
        if (!cancelled) setBusy(false);
      }
    };
    restore();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scanPatient = async (raw, cin) => {
    const data = await call({
      action: "patient_qr_scan",
      token: cin ? "" : raw,
      cin,
      session_id: hospitalSession && new Date(hospitalSession.session_expires).getTime() > Date.now()
        ? hospitalSession.session_id
        : "",
    });
    setScan(data);
    setScanner(null);
    setStage("options");
  };

  // Hospital pathway: the authorization is already granted, so this step only
  // establishes WHICH patient it belongs to — the patient's medical card QR or
  // their CIN. Both resolve to the same one patient record on the server.
  const identifyPatient = async ({ token = "", cin = "" }) => {
    setBusy(true);
    setError("");
    try {
      await scanPatient(token, cin);
    } catch (err) {
      setError(errorText(err, "The patient could not be identified. Check the CIN or scan the card again."));
    } finally {
      setBusy(false);
    }
  };

  const scanHospital = async (raw) => {
    const data = await call({ action: "hospital_qr_scan", token: raw });
    localStorage.setItem(HOSPITAL_KEY, JSON.stringify(data));
    setHospitalSession(data);
    setNotice(data.message);
    setScanner(null);
    setStage("scan");
  };

  // ONE scan for every AMedix QR: a patient QR opens the emergency / appointment
  // choice, a hospital Emergency Department QR authorizes the doctor. The server
  // decides whether the QR is genuine and what the doctor may do with it.
  const handleScan = async (value) => {
    const raw = String(value || "").trim();
    setError("");
    setNotice("");
    if (!raw) return;
    const kind = scannedQrKind(raw);
    setBusy(true);
    try {
      if (kind === "hospital") {
        await scanHospital(raw);
      } else if (kind === "patient") {
        await scanPatient(raw, "");
      } else if (kind === "patient_cin") {
        await scanPatient(raw, scannedCin(raw));
      } else {
        // Shape not recognised in the browser — let the server decide.
        try {
          await scanPatient(raw, "");
        } catch (err) {
          if ((err && err.response && err.response.status) !== 400) throw err;
          await scanHospital(raw);
        }
      }
    } catch (err) {
      setError(
        errorText(err, "This QR code could not be read. Scan the patient's AMedix QR or the hospital Emergency Department QR again.")
      );
    } finally {
      setBusy(false);
    }
  };

  const submitAccess = async ({ reason, justification, patient_name, confirmed }) => {
    setBusy(true);
    setError("");
    try {
      const data = await call({
        action: "initiate_access",
        scan_ticket: scan?.scan_ticket,
        reason,
        justification,
        patient_name,
        confirmed,
      });
      localStorage.setItem(ACCESS_KEY, data.session_id);
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
      localStorage.removeItem(ACCESS_KEY);
      setRecord(null);
      setScan(null);
      setStage("scan");
      setError(errorText(err, "This emergency access has ended. Scan the patient's QR again."));
    } finally {
      setBusy(false);
    }
  };

  const endRecord = async () => {
    setBusy(true);
    try {
      await call({ action: "end_session", session_id: record?.session_id });
      localStorage.removeItem(ACCESS_KEY);
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
              The patient's single QR identifies them and offers two routes: emergency access for Emergency Medicine and
              Trauma Surgery doctors, or for any doctor inside a live hospital emergency authorization — otherwise the
              regular appointment pathway. The hospital Emergency Department QR authorizes any verified doctor
              immediately. Access is patient-specific, logged, and stays open 24/7 until the patient is checked out or
              you end it.
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
                  {hospitalSession.hospital_name} · {hospitalSession.department} · open 24/7 until the patient is checked
                  out
                </p>
                <p className="text-xs text-emerald-800 mt-1">
                  Select Gain Emergency Access to identify the patient — by scanning their medical card or entering their
                  CIN — then record the emergency reason.
                </p>
              </div>
            </div>
            <Badge variant="outline" className="border-emerald-300 bg-emerald-100 text-emerald-800 font-mono text-[10px]">
              {hospitalSession.session_ref}
            </Badge>
            <Button
              className="w-full bg-red-600 hover:bg-red-700"
              size="lg"
              disabled={busy}
              onClick={() => {
                setError("");
                setScan(null);
                setStage("identify");
              }}
            >
              <Siren className="w-5 h-5" /> Gain Emergency Access
            </Button>
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
        <Button
          size="lg"
          className="h-auto w-full py-5 flex-col items-start gap-1"
          onClick={() => setScanner("any")}
          disabled={busy}
        >
          <span className="inline-flex items-center gap-2 font-semibold">
            <QrCode className="w-5 h-5" /> Scan QR code
          </span>
          <span className="text-[11px] font-normal opacity-90 text-left">
            The patient's AMedix QR (portal or health card) or the hospital Emergency Department QR — after a patient QR
            you choose emergency or appointment access.
          </span>
        </Button>
      )}

      {scanner && (
        <EmergencyScanPanel
          title="Scan QR code"
          description="Scan the patient's AMedix QR or the rotating QR shown in the hospital Emergency Department. The server checks what the code is and what you are authorized to do."
          label="Point the camera at the AMedix QR code"
          onScan={handleScan}
          onClose={() => setScanner(null)}
        />
      )}

      {busy && !scanner && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> Checking your authorization…
        </div>
      )}

      {stage === "identify" && (
        <EmergencyIdentifyPatient
          hospitalSession={hospitalSession}
          onIdentify={identifyPatient}
          onBack={() => {
            setError("");
            setStage("scan");
          }}
          busy={busy}
          error={error}
        />
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
        Every scan, authorization, denial, revocation and notification is written to an immutable audit log. Access ends
        when the patient is checked out or you end it, and nothing here becomes permanent patient permission. Your active
        access is remembered on this device, so switching tabs or apps never asks you to scan again.
      </p>
    </div>
  );
}