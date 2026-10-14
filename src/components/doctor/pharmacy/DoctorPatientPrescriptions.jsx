import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Pill, Plus, Loader2 } from "lucide-react";
import PrescriptionForm from "@/components/doctor/pharmacy/PrescriptionForm";
import PrescriptionStatusBadge from "@/components/pharmacy/PrescriptionStatusBadge";
import PrescriptionAvailability from "@/components/pharmacy/PrescriptionAvailability";
import DispensingHistory from "@/components/pharmacy/DispensingHistory";
import PrescriptionCard from "@/components/doctor/pharmacy/PrescriptionCard";
import { useToast } from "@/components/ui/use-toast";

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