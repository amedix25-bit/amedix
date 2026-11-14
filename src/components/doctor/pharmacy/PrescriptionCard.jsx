import React, { useState } from "react";
import { Pill, ChevronDown, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { openPrescriptionPdf } from "@/lib/prescriptionPdf";
import PrescriptionStatusBadge from "@/components/pharmacy/PrescriptionStatusBadge";
import PrescriptionAvailability from "@/components/pharmacy/PrescriptionAvailability";
import DispensingHistory from "@/components/pharmacy/DispensingHistory";
import CancelPrescriptionButton from "@/components/doctor/pharmacy/CancelPrescriptionButton";
import SubstitutionReview from "@/components/doctor/pharmacy/SubstitutionReview";
import { prescriptionRemaining } from "@/components/pharmacy/PrescriptionActions";
import { inhalerSummary } from "@/lib/inhalerDevice";

// One prescription card — shared by the patient's record view and the
// Prescriptions tab of the Doctor Portal. Collapsed it shows only the
// medication name and dispensed status; clicking it expands the full
// details. showPatient adds the patient's name for lists that cover several
// patients.
export default function PrescriptionCard({ prescription, onIssued, showPatient }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((s) => !s)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-accent/40 transition-colors"
        aria-expanded={expanded}
      >
        <span className="font-semibold flex items-center gap-1.5 min-w-0 truncate">
          <Pill className="w-4 h-4 text-primary shrink-0" />
          <span className="truncate">
            {prescription.medication_name}
            {prescription.strength ? ` ${prescription.strength}` : ""}
          </span>
          {showPatient && prescription.patient_name && (
            <span className="text-xs text-muted-foreground font-normal hidden sm:inline truncate">
              · {prescription.patient_name}
            </span>
          )}
        </span>
        <span className="flex items-center gap-2 shrink-0">
          <PrescriptionStatusBadge status={prescription.status} />
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`} />
        </span>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-border/60">
          <p className="text-xs text-muted-foreground mt-3">
            {prescription.prescription_id} · {prescription.date_prescribed}
            {prescription.active_ingredient ? ` · ${prescription.active_ingredient}` : ""}
          </p>
          {showPatient && prescription.patient_name && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Patient: {prescription.patient_name}
              {prescription.patient_cin ? ` · CIN ${prescription.patient_cin}` : ""}
            </p>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 text-xs">
            <div><span className="text-muted-foreground">Dosage:</span> {prescription.dosage || "—"}</div>
            <div><span className="text-muted-foreground">Route:</span> {prescription.route || "—"}</div>
            <div><span className="text-muted-foreground">Frequency:</span> {prescription.frequency || "—"}</div>
            <div><span className="text-muted-foreground">Duration:</span> {prescription.duration || "—"}</div>
            <div><span className="text-muted-foreground">Quantity:</span> {prescription.quantity || "—"}</div>
            <div><span className="text-muted-foreground">Refills:</span> {prescription.refills_used || 0}/{prescription.refills_authorized || 0} used</div>
            <div className="col-span-2"><span className="text-muted-foreground">Instructions:</span> {prescription.special_instructions || "—"}</div>
            {inhalerSummary(prescription) && (
              <div className="col-span-2 sm:col-span-4">
                <span className="text-muted-foreground">Device:</span> {inhalerSummary(prescription)}
                {prescription.inhaler_device_instructions ? ` — ${prescription.inhaler_device_instructions}` : ""}
              </div>
            )}
          </div>
          {prescription.authorized_pharmacy_name && (
            <p className="text-xs text-muted-foreground mt-2">
              Pharmacy: {prescription.authorized_pharmacy_name}
              {prescription.authorized_pharmacy_address ? `, ${prescription.authorized_pharmacy_address}` : ""}
              {prescription.reservation_code && prescription.status !== "dispensed" ? ` · Reservation ${prescription.reservation_code}` : ""}
              {prescription.status === "dispensed" && prescription.dispensed_datetime
                ? ` · Dispensed ${new Date(prescription.dispensed_datetime).toLocaleString()} by ${prescription.dispensed_by_name || "pharmacy"}`
                : ""}
            </p>
          )}
          {prescription.status === "dispensed" && prescriptionRemaining(prescription) > 0 && (
            <p className="text-xs text-amber-600 mt-1">
              Partially dispensed — {prescriptionRemaining(prescription)} unit(s) still to be collected.
            </p>
          )}
          {prescription.status === "cancelled" && (prescription.rejected_reason || prescription.cancellation_reason) && (
            <p className="text-xs text-destructive mt-2">
              {prescription.rejected_by_pharmacy_name || prescription.cancelled_by_name || ""}:
              {" "}{prescription.rejected_reason || prescription.cancellation_reason}
            </p>
          )}
          <DispensingHistory prescription={prescription} />
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => openPrescriptionPdf(prescription)}>
              <FileText className="w-3.5 h-3.5" />
              Prescription PDF
            </Button>
            <CancelPrescriptionButton prescription={prescription} onDone={onIssued} />
          </div>
          {/* Substitution request awaiting the prescriber's decision + history */}
          <SubstitutionReview prescription={prescription} onChanged={onIssued} />
          {/* Automatic availability check across affiliated pharmacies */}
          <PrescriptionAvailability
            medicationName={prescription.medication_name}
            strength={prescription.strength}
            activeIngredient={prescription.active_ingredient}
            showSubstitutes
          />
        </div>
      )}
    </div>
  );
}