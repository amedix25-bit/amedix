import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Pill, Plus, Loader2 } from "lucide-react";
import PrescriptionForm from "@/components/doctor/pharmacy/PrescriptionForm";
import PrescriptionStatusBadge from "@/components/pharmacy/PrescriptionStatusBadge";
import PrescriptionAvailability from "@/components/pharmacy/PrescriptionAvailability";
import DispensingHistory from "@/components/pharmacy/DispensingHistory";
import CancelPrescriptionButton from "@/components/doctor/pharmacy/CancelPrescriptionButton";
import { prescriptionRemaining } from "@/components/pharmacy/PrescriptionActions";
import { useToast } from "@/components/ui/use-toast";

function PrescriptionCard({ prescription, onIssued }) {
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
      {/* Automatic availability check across affiliated pharmacies */}
      <PrescriptionAvailability
        medicationName={prescription.medication_name}
        strength={prescription.strength}
        activeIngredient={prescription.active_ingredient}
      />
    </div>
  );
}

// The Prescriptions section of the patient's medical record — issue electronic
// prescriptions and follow each one's dispensing journey at affiliated
// pharmacies, with automatic availability checks.
export default function DoctorPatientPrescriptions({ patient, doctorProfile }) {
  const [items, setItems] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    try {
      const page = await base44.entities.Prescription.filter(
        { patient_id: patient.id },
        { sort: "-created_date", limit: 100 }
      );
      setItems(page.items || page);
    } catch (err) {
      console.error(err);
      setItems([]);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient.id]);

  const handleCreated = () => {
    setShowForm(false);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Electronic prescriptions for this patient, with live availability at affiliated pharmacies.
        </p>
        <Button size="sm" onClick={() => setShowForm((s) => !s)} className="gap-1.5 shrink-0">
          <Plus className="w-4 h-4" /> New Prescription
        </Button>
      </div>

      {showForm && (
        <PrescriptionForm
          patient={patient}
          doctorProfile={doctorProfile}
          onCreated={handleCreated}
          onCancel={() => setShowForm(false)}
        />
      )}

      {!items ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
          <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Loading...
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-10 rounded-xl border border-border bg-card">
          No prescriptions yet. Use New Prescription to issue one.
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((p) => (
            <PrescriptionCard key={p.id} prescription={p} onIssued={load} />
          ))}
        </div>
      )}
    </div>
  );
}