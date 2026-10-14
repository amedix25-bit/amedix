import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Loader2 } from "lucide-react";
import PrescriptionCard from "@/components/doctor/pharmacy/PrescriptionCard";
import PrescriptionStatusFilter, { prescriptionStatusGroup } from "@/components/doctor/pharmacy/PrescriptionStatusFilter";

// Prescriptions tab of the Doctor Portal — every prescription the doctor has
// issued across all patients, newest first, with live dispensing progress,
// availability and substitution reviews.
export default function DoctorPrescriptions() {
  const { user } = useAuth();
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const load = async () => {
    try {
      const page = await base44.entities.Prescription.filter(
        { doctor_user_id: user.id },
        { sort: "-created_date", limit: 100 }
      );
      setItems(page.items || page);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Could not load prescriptions. Please try again.");
      setItems([]);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        All prescriptions you have issued, across every patient, with live dispensing progress at affiliated pharmacies.
      </p>
      {!items ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
          <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Loading...
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-10 rounded-xl border border-border bg-card">
          No prescriptions yet. Open a patient's record and use New Prescription to issue one.
        </p>
      ) : (
        <>
          <PrescriptionStatusFilter items={items} value={statusFilter} onChange={setStatusFilter} />
          <div className="space-y-3">
            {(statusFilter === "all"
              ? items
              : items.filter((p) => prescriptionStatusGroup(p) === statusFilter)
            ).map((p) => (
              <PrescriptionCard key={p.id} prescription={p} onIssued={load} showPatient />
            ))}
            {statusFilter !== "all" &&
              items.every((p) => prescriptionStatusGroup(p) !== statusFilter) && (
                <p className="text-sm text-muted-foreground text-center py-10 rounded-xl border border-border bg-card">
                  No prescriptions in this category.
                </p>
              )}
          </div>
        </>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}