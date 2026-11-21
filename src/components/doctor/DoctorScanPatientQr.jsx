import React, { useState } from "react";
import QrScanner from "@/components/lab/technician/QrScanner";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2, Loader2, QrCode, X } from "lucide-react";

/**
 * Dedicated patient QR-code scanner for the doctor portal.
 *
 * The card's QR carries the card's own verification token (never a name or a
 * diagnosis), so the scanned value is resolved on the server to the exact
 * patient it belongs to — the same account, record and access permissions as
 * searching the CIN manually. A scan identifies the patient only: clinical
 * data still requires the patient's authorization.
 */
export default function DoctorScanPatientQr({ onCinDetected, onCancel }) {
  const [attempt, setAttempt] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [busy, setBusy] = useState(false);
  const [resolved, setResolved] = useState(null);

  const retry = () => {
    setFeedback(null);
    setAttempt((a) => a + 1);
  };

  const handleScan = async (value) => {
    if (busy) return;
    setBusy(true);
    setFeedback(null);
    try {
      const response = await base44.functions.invoke("patientQrResolve", { value: String(value || "") });
      const data = response.data || {};
      if (data.ok && data.patient_cin) {
        setResolved(data);
        onCinDetected(data.patient_cin, { patientName: data.patient_name, source: data.source });
        return;
      }
      setFeedback(data.message || "This QR code could not be read as an AMedix patient code.");
    } catch (err) {
      const serverMessage = err?.response?.data?.message;
      setFeedback(
        serverMessage ||
          (err?.response?.status === 403
            ? "Only a verified doctor or radiologist can scan patient cards."
            : "The QR code could not be verified. Please try again.")
      );
    } finally {
      setBusy(false);
      setAttempt((a) => a + 1);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <QrCode className="w-5 h-5 text-primary" />
          <p className="font-semibold">Scan Patient QR Code</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onCancel} aria-label="Close scanner">
          <X className="w-4 h-4" />
        </Button>
      </div>

      {feedback && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <div className="space-y-2">
            <p className="text-sm text-amber-800">{feedback}</p>
            <Button size="sm" variant="outline" onClick={retry}>
              Try scanning again
            </Button>
          </div>
        </div>
      )}

      {resolved && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
          <p className="text-sm text-emerald-800">
            Card verified for <span className="font-semibold">{resolved.patient_name}</span> ({resolved.patient_cin}).
          </p>
        </div>
      )}

      {busy && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          Verifying this card...
        </div>
      )}

      <QrScanner
        key={attempt}
        onScan={handleScan}
        label="Point the camera at the patient's QR code"
        onManualEntry={onCancel}
      />

      <p className="text-xs text-muted-foreground">
        Scanning identifies the patient's existing account only. Their medical record opens only with the
        access the patient has granted you.
      </p>
    </div>
  );
}