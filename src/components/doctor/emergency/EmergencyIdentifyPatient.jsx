import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import QrScanner from "@/components/lab/technician/QrScanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, ArrowLeft, IdCard, Loader2, QrCode, ScanLine } from "lucide-react";
import { dateTimeLabel, scannedCin, scannedQrKind } from "@/lib/emergencyQr";

// The patient-identification step of the hospital emergency pathway. Access was
// already authorized by the hospital's Emergency Department QR; this step only
// establishes WHICH patient the access belongs to, using either the patient's
// existing AMedix medical card QR or their CIN. No access is granted here — the
// server still binds the session to the one patient that is identified.
const CIN_PATTERN = /^[A-HJ-NP-Z2-9]{3}-[A-HJ-NP-Z2-9]{3}-[A-HJ-NP-Z2-9]{3}$/;

function formatCin(value) {
  const raw = String(value || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 9);
  return raw.replace(/(.{3})(?=.)/g, "$1-");
}

export default function EmergencyIdentifyPatient({ hospitalSession, onIdentify, onBack, busy, error }) {
  const [mode, setMode] = useState(null);
  const [cin, setCin] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [localError, setLocalError] = useState("");
  const [resolving, setResolving] = useState(false);

  const shown = localError || error;

  const handleScanned = async (raw) => {
    const value = String(raw || "").trim();
    if (!value || resolving) return;
    setLocalError("");
    const kind = scannedQrKind(value);

    if (kind === "patient") {
      onIdentify({ token: value });
      return;
    }
    if (kind === "patient_cin") {
      onIdentify({ cin: scannedCin(value) });
      return;
    }
    if (kind === "hospital") {
      setLocalError("That is a hospital Emergency Department code. Scan the patient's own AMedix medical card.");
      setAttempt((a) => a + 1);
      return;
    }

    // A medical card QR carries the card's own verification token, which is
    // resolved server-side to the one patient it belongs to.
    setResolving(true);
    try {
      const response = await base44.functions.invoke("patientQrResolve", { value });
      const data = response.data || {};
      if (data.ok && data.patient_cin) {
        onIdentify({ cin: data.patient_cin });
        return;
      }
      const needsCin = ["card_revoked", "card_expired", "card_not_found"].includes(data.reason);
      setLocalError(
        (data.message || "This card could not be verified.") + (needsCin ? " Enter the patient's CIN instead." : "")
      );
    } catch (err) {
      setLocalError(
        err?.response?.data?.message || "This card could not be verified. Enter the patient's CIN instead."
      );
    } finally {
      setResolving(false);
      setAttempt((a) => a + 1);
    }
  };

  const submitCin = () => {
    const value = formatCin(cin);
    if (!CIN_PATTERN.test(value)) {
      setLocalError("A CIN has the format 7F3-829-461. Check the card and enter all nine characters.");
      return;
    }
    setLocalError("");
    onIdentify({ cin: value });
  };

  return (
    <div className="rounded-2xl border-2 border-red-200 bg-card p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-heading text-lg font-bold text-primary">Identify Emergency Patient</p>
          <p className="text-xs text-muted-foreground mt-1">
            {hospitalSession?.hospital_name
              ? `Emergency authorization active at ${hospitalSession.hospital_name} · ${hospitalSession.department || "Emergency Department"} · valid until ${dateTimeLabel(hospitalSession.session_expires)}.`
              : "Emergency authorization active."}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onBack} disabled={busy}>
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        Emergency access is never granted without identifying the patient. Use whichever is fastest at the bedside.
      </p>

      {!mode && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Button
            size="lg"
            className="h-auto py-5 flex-col items-start gap-1"
            onClick={() => {
              setLocalError("");
              setMode("card");
            }}
            disabled={busy}
          >
            <span className="inline-flex items-center gap-2 font-semibold">
              <QrCode className="w-5 h-5" /> Scan Patient Medical Card
            </span>
            <span className="text-[11px] font-normal opacity-90 text-left">
              Open the camera and scan the QR code on the patient's AMedix medical card.
            </span>
          </Button>

          <Button
            size="lg"
            variant="outline"
            className="h-auto py-5 flex-col items-start gap-1"
            onClick={() => {
              setLocalError("");
              setMode("cin");
            }}
            disabled={busy}
          >
            <span className="inline-flex items-center gap-2 font-semibold">
              <IdCard className="w-5 h-5" /> Enter Patient CIN
            </span>
            <span className="text-[11px] font-normal text-muted-foreground text-left">
              Type the patient's Clinical Identification Number to open their record.
            </span>
          </Button>
        </div>
      )}

      {mode === "card" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="inline-flex items-center gap-2 text-sm font-semibold">
              <ScanLine className="w-4 h-4 text-primary" /> Scan Patient Medical Card
            </p>
            <Button variant="ghost" size="sm" onClick={() => setMode(null)} disabled={busy || resolving}>
              Choose another method
            </Button>
          </div>
          <QrScanner
            key={attempt}
            onScan={handleScanned}
            label="Point the camera at the QR code on the patient's medical card"
          />
          {resolving && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Reading the card…
            </p>
          )}
        </div>
      )}

      {mode === "cin" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="inline-flex items-center gap-2 text-sm font-semibold">
              <IdCard className="w-4 h-4 text-primary" /> Enter Patient CIN
            </p>
            <Button variant="ghost" size="sm" onClick={() => setMode(null)} disabled={busy}>
              Choose another method
            </Button>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="emergency-cin">Patient CIN</Label>
            <Input
              id="emergency-cin"
              value={cin}
              onChange={(e) => setCin(formatCin(e.target.value))}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitCin();
              }}
              placeholder="7F3-829-461"
              inputMode="text"
              autoCapitalize="characters"
              autoComplete="off"
              className="font-mono text-lg tracking-wider"
              maxLength={11}
            />
          </div>
          <Button onClick={submitCin} disabled={busy || !cin.trim()}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <IdCard className="w-4 h-4" />}
            Identify patient
          </Button>
        </div>
      )}

      {shown && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{shown}</p>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        The patient is identified from their own AMedix record — a scan never opens another patient's information, and
        the emergency session is bound to this one patient only.
      </p>
    </div>
  );
}