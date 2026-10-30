import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Loader2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import PrescriptionCard from "@/components/doctor/pharmacy/PrescriptionCard";
import PrescriptionForm from "@/components/doctor/pharmacy/PrescriptionForm";
import PatientSearchSelect from "@/components/doctor/patients/PatientSearchSelect";
import PrescriptionStatusFilter, { prescriptionStatusGroup } from "@/components/doctor/pharmacy/PrescriptionStatusFilter";
import PatientPrescriptionIndex from "@/components/doctor/prescriptions/PatientPrescriptionIndex";

// Prescriptions tab of the Doctor Portal — every prescription the doctor has
// issued across all patients, newest first, with live dispensing progress,
// availability and substitution reviews.
export default function DoctorPrescriptions() {
  const { user } = useAuth();
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [view, setView] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [patient, setPatient] = useState(null);
  const [doctorProfile, setDoctorProfile] = useState(null);

  useEffect(() => {
    base44.entities.DoctorProfile.filter({ user_id: user.id })
      .then((page) => setDoctorProfile((page.items || page)[0] || null))
      .catch((err) => console.error(err));
  }, [user.id]);

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

  const filtered =
    statusFilter === "all"
      ? items || []
      : (items || []).filter((p) => prescriptionStatusGroup(p) === statusFilter);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          All prescriptions you have issued, across every patient, with live dispensing progress at affiliated pharmacies.
        </p>
        <Button size="sm" onClick={() => setShowForm((s) => !s)} className="gap-1.5 shrink-0">
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? "Close" : "New Prescription"}
        </Button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5 space-y-4">
          {!doctorProfile ? (
            <p className="text-sm text-muted-foreground">Loading your doctor profile...</p>
          ) : !patient ? (
            <PatientSearchSelect selected={null} onSelect={setPatient} />
          ) : (
            <PrescriptionForm
              patient={patient}
              doctorProfile={doctorProfile}
              onCreated={() => {
                setShowForm(false);
                setPatient(null);
                load();
              }}
              onCancel={() => {
                setShowForm(false);
                setPatient(null);
              }}
            />
          )}
        </div>
      )}

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
          <div className="inline-flex rounded-lg border border-border bg-card p-1">
            {[
              { key: "all", label: "All Prescriptions" },
              { key: "patients", label: "By Patient" },
            ].map((v) => (
              <button
                key={v.key}
                onClick={() => setView(v.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  view === v.key
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
          <PrescriptionStatusFilter items={items} value={statusFilter} onChange={setStatusFilter} />
          {view === "patients" ? (
            filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10 rounded-xl border border-border bg-card">
                No prescriptions in this category.
              </p>
            ) : (
              <PatientPrescriptionIndex items={filtered} onIssued={load} />
            )
          ) : (
            <div className="space-y-3">
              {filtered.map((p) => (
                <PrescriptionCard key={p.id} prescription={p} onIssued={load} showPatient />
              ))}
              {filtered.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-10 rounded-xl border border-border bg-card">
                  No prescriptions in this category.
                </p>
              )}
            </div>
          )}
        </>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}