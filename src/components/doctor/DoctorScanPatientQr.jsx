import React, { useState } from "react";
import QrScanner from "@/components/lab/technician/QrScanner";
import { Button } from "@/components/ui/button";
import { AlertTriangle, QrCode, X } from "lucide-react";

// Matches the unique CIN format (e.g. 7F3-829-461) that patient QR codes encode.
const CIN_PATTERN = /[A-HJ-NP-Z2-9]{3}-[A-HJ-NP-Z2-9]{3}-[A-HJ-NP-Z2-9]{3}/;

/**
 * Dedicated patient QR-code scanner for the doctor portal.
 * The patient's QR code (Patient Home Page) encodes only their unique CIN,
 * so scanning resolves to the exact same account and medical record as
 * searching the CIN manually — it never creates a new profile or duplicate.
 * Gives clear feedback when a code is detected, invalid, or unreadable.
 */
export default function DoctorScanPatientQr({ onCinDetected, onCancel }) {
  const [attempt, setAttempt] = useState(0);
  const [feedback, setFeedback] = useState(null);

  const handleScan = (value) => {
    const raw = String(value || "").trim().toUpperCase();
    const match = raw.match(CIN_PATTERN);
    if (!match) {
      setFeedback(
        "This QR code is not a valid patient code. Ask the patient to open their Patient Home Page and show their personal QR code, then scan again."
      );
      setAttempt((a) => a + 1);
      return;
    }
    onCinDetected(match[0]);
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
          <p className="text-sm text-amber-700">{feedback}</p>
        </div>
      )}

      <QrScanner
        key={attempt}
        onScan={handleScan}
        label="Point the camera at the patient's QR code"
        onManualEntry={onCancel}
      />

      <p className="text-xs text-muted-foreground">
        Scanning simply identifies the patient's existing account by CIN — the same record, access and
        permissions as a CIN search. No new profile is ever created.
      </p>
    </div>
  );
}