import React from "react";
import { Pill } from "lucide-react";
import PrescriptionStatusBadge from "@/components/pharmacy/PrescriptionStatusBadge";
import PrescriptionAvailability from "@/components/pharmacy/PrescriptionAvailability";
import DispensingHistory from "@/components/pharmacy/DispensingHistory";
import CancelPrescriptionButton from "@/components/doctor/pharmacy/CancelPrescriptionButton";
import SubstitutionReview from "@/components/doctor/pharmacy/SubstitutionReview";
import { prescriptionRemaining } from "@/components/pharmacy/PrescriptionActions";

// One prescription card — shared by the patient's record view and the
// Prescriptions tab of the Doctor Portal. showPatient adds the patient's
// name for lists that cover several patients.
export default function PrescriptionCard({ prescription, onIssued, showPatient }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <p className="font-semibold flex items-center gap-1.5">
            <Pill className="w-4 h-4 text-primary" />
            {prescription.medication_name}
            {prescription.strength ? ` ${prescription.strength}` : ""}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {prescription.prescription_id} · {prescription.date_prescribed}
            {prescription.active_ingredient ? ` · ${prescription.active_ingredient}` : ""}
          </p>
          {showPatient && prescription.patient_name && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Patient: {prescription.patient_name}
              {prescription.patient_cin ? ` · CIN ${prescription.patient_cin}` : ""}
            </p>
          )}
        </div>
        <PrescriptionStatusBadge status={prescription.status} />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 text-xs">
        <div><span className="text-muted-foreground">Dosage:</span> {prescription.dosage || "—"}</div>
        <div><span className="text-muted-foreground">Route:</span> {prescription.route || "—"}</div>
        <div><span className="text-muted-foreground">Frequency:</span> {prescription.frequency || "—"}</div>
        <div><span className="text-muted-foreground">Duration:</span> {prescription.duration || "—"}</div>
        <div><span className="text-muted-foreground">Quantity:</span> {prescription.quantity || "—"}</div>
        <div><span className="text-muted-foreground">Refills:</span> {prescription.refills_used || 0}/{prescription.refills_authorized || 0} used</div>
        <div className="col-span-2"><span className="text-muted-foreground">Instructions:</span> {prescription.special_instructions || "—"}</div>
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
      <div className="mt-2">
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
  );
}