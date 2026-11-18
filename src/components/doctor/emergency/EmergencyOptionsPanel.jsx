import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CalendarDays, IdCard, Siren, Stethoscope } from "lucide-react";
import { dateTimeLabel } from "@/lib/emergencyQr";

// After a patient Emergency QR was validated the doctor must choose between
// emergency access and the ordinary appointment pathway, which stays on the
// existing patient-consent flow.
export default function EmergencyOptionsPanel({ scan, hospitalSession, onEmergency, onRegular, onRescan }) {
  const patient = scan?.patient || {};
  const underHospital = scan?.pathway === "hospital_er";
  // The server decides eligibility: Emergency Medicine / Trauma Surgery, or any
  // doctor inside a live hospital ER authorization.
  const emergencyEligible = scan?.emergency_eligible === true;

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <IdCard className="w-5 h-5 text-primary" />
        <p className="font-semibold">Patient identified by QR</p>
      </div>

      <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-1">
        <p className="font-heading text-lg font-bold text-primary">{patient.name || "—"}</p>
        <p className="text-sm text-muted-foreground">CIN {patient.cin || "—"}</p>
        <p className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="w-3.5 h-3.5" /> {patient.date_of_birth || "—"}
          </span>
          <span className="inline-flex items-center gap-1">
            <Stethoscope className="w-3.5 h-3.5" /> {patient.gender || "—"}
          </span>
        </p>
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
        <Badge variant="outline" className="border-emerald-300 text-emerald-700 bg-emerald-100 shrink-0">
          {underHospital ? "Hospital ER pathway" : "Patient QR pathway"}
        </Badge>
        <p className="text-xs text-emerald-800">
          {underHospital
            ? `Validated inside your hospital emergency authorization${hospitalSession?.hospital_name ? ` at ${hospitalSession.hospital_name}` : ""}, expiring ${dateTimeLabel(hospitalSession?.session_expires)}.`
            : "Validated on your verified emergency specialty. Access expires automatically and is logged."}
        </p>
      </div>

      <div className={`grid gap-3 ${emergencyEligible ? "sm:grid-cols-2" : ""}`}>
        {emergencyEligible && (
          <Button size="lg" className="h-auto py-4 flex-col items-start gap-1" onClick={onEmergency}>
            <span className="inline-flex items-center gap-2 font-semibold">
              <Siren className="w-5 h-5" /> EMERGENCY ACCESS
            </span>
            <span className="text-[11px] font-normal opacity-90 text-left">
              Immediate minimum-necessary medical information. A reason and justification are required.
            </span>
          </Button>
        )}
        <Button size="lg" variant="outline" className="h-auto py-4 flex-col items-start gap-1" onClick={onRegular}>
          <span className="font-semibold">REGULAR APPOINTMENT</span>
          <span className="text-[11px] font-normal text-muted-foreground text-left">
            Uses the normal patient consent flow. No emergency privileges are granted.
          </span>
        </Button>
      </div>

      {!emergencyEligible && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800">
            Emergency access is limited to Emergency Medicine and Trauma Surgery doctors, and to any doctor inside a live
            hospital emergency authorization. Scan the hospital Emergency Department QR first, or continue with the
            regular appointment pathway.
          </p>
        </div>
      )}

      <div className="flex items-start gap-2 text-xs text-muted-foreground">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p>
          Scanning the QR alone granted no access. Emergency access is granted only for this patient, only after the
          clinical reason below is recorded, and never adds you to the patient's authorized doctors.
        </p>
      </div>

      <Button variant="ghost" size="sm" onClick={onRescan}>
        Scan a different QR
      </Button>
    </div>
  );
}