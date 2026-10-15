import React, { useState } from "react";
import { History, FileText, Pill, ClipboardList } from "lucide-react";
import DoctorPatientSummary from "@/components/doctor/patients/DoctorPatientSummary";
import DoctorPatientHistorySection from "@/components/doctor/patients/DoctorPatientHistorySection";
import DoctorPatientClinicalNotesView from "@/components/doctor/DoctorPatientClinicalNotesView";
import DoctorMedicationHistory from "@/components/doctor/medhistory/DoctorMedicationHistory";
import PrescriptionStatusBadge from "@/components/pharmacy/PrescriptionStatusBadge";
import PrescriptionActions from "@/components/pharmacy/PrescriptionActions";
import DispensingHistory from "@/components/pharmacy/DispensingHistory";
import { DoctorTranslationsProvider } from "@/lib/doctorMedicalTranslations";

// The doctor-portal patient record for the pharmacy counter — after a CIN
// lookup the pharmacist sees the same summary card and sections the patient's
// doctor sees: Patient History, Clinical Notes, Prescriptions and Medication
// History, alongside the pharmacy's own visits and counter notes.
export default function PharmacyPatientRecordTabs({ patient, prescriptions, session, onChanged }) {
  const [tab, setTab] = useState(null);

  const tabButton = (key, label, Icon) => (
    <button
      type="button"
      onClick={() => setTab(key)}
      className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        tab === key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );

  return (
    <DoctorTranslationsProvider patientId={patient.id}>
      <div className="space-y-6">
        <DoctorPatientSummary patient={patient} />

        <div className="flex rounded-xl border border-border bg-card p-1 gap-1 max-w-xl">
          {tabButton("history", "Patient History", History)}
          {tabButton("notes", "Clinical Notes", FileText)}
          {tabButton("prescriptions", "Prescriptions", Pill)}
          {tabButton("medhistory", "Medication History", ClipboardList)}
        </div>

        {tab === "history" && (
          <section className="rounded-2xl border border-border bg-card p-6">
            <h3 className="font-semibold text-lg mb-4">Patient History</h3>
            <DoctorPatientHistorySection patient={patient} />
          </section>
        )}

        {tab === "notes" && (
          <section className="rounded-2xl border border-border bg-card p-6">
            <h3 className="font-semibold text-lg mb-4">Clinical Notes</h3>
            <DoctorPatientClinicalNotesView patientId={patient.id} embedded />
          </section>
        )}

        {tab === "prescriptions" && (
          <section className="rounded-2xl border border-border bg-card p-6">
            <h3 className="font-semibold text-lg mb-4">Prescriptions</h3>
            {(!prescriptions || prescriptions.length === 0) ? (
              <p className="text-sm text-muted-foreground text-center py-8 rounded-xl border border-border bg-card">
                This patient has no prescriptions authorized to your pharmacy yet.
              </p>
            ) : (
              <div className="space-y-3">
                {prescriptions.map((p) => (
                  <div key={p.id} className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0">
                        <p className="font-semibold">
                          {p.medication_name}{p.strength ? ` ${p.strength}` : ""}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {p.prescription_id} · Prescribed by {p.doctor_name} · {p.date_prescribed}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {p.reservation_code && p.status !== "dispensed" && (
                          <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-accent text-accent-foreground">{p.reservation_code}</span>
                        )}
                        <PrescriptionStatusBadge status={p.status} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 text-xs">
                      <div><span className="text-muted-foreground">Dosage:</span> {p.dosage || "—"}</div>
                      <div><span className="text-muted-foreground">Frequency:</span> {p.frequency || "—"}</div>
                      <div><span className="text-muted-foreground">Duration:</span> {p.duration || "—"}</div>
                      <div><span className="text-muted-foreground">Quantity:</span> {p.quantity || "—"}</div>
                    </div>
                    {p.special_instructions && (
                      <p className="text-xs text-muted-foreground mt-2">Instructions: {p.special_instructions}</p>
                    )}
                    <DispensingHistory prescription={p} />
                    <div className="mt-3">
                      <PrescriptionActions prescription={p} onChanged={onChanged} session={session} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {tab === "medhistory" && (
          <section className="rounded-2xl border border-border bg-card p-6">
            <h3 className="font-semibold text-lg mb-4">Medication History</h3>
            <DoctorMedicationHistory patient={patient} readOnly />
          </section>
        )}

        {!tab && (
          <p className="text-sm text-muted-foreground text-center py-8">
            Select Patient History, Clinical Notes, Prescriptions or Medication History above to view the patient's information.
          </p>
        )}
      </div>
    </DoctorTranslationsProvider>
  );
}