import React from "react";
import { ArrowLeft } from "lucide-react";
import DoctorPatientSummary from "@/components/doctor/patients/DoctorPatientSummary";
import DoctorPatientHistorySection from "@/components/doctor/patients/DoctorPatientHistorySection";
import DoctorPatientClinicalNotesView from "@/components/doctor/DoctorPatientClinicalNotesView";

// Patient profile page (Find My Patient → My Patients → patient). Shows the
// patient's identity and key medical information at the top, then a large
// split-screen layout: "Patient History" (medical history, diagnoses,
// medications, allergies, surgeries, investigations, imaging, laboratory
// results, previous appointments — chronological) and "Clinical Notes"
// (My Notes / Other Physicians tabs, classified by the authoring DoctorID).
export default function DoctorPatientRecordView({ patient, onBack, doctorProfile }) {
  return (
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" /> All patients
      </button>

      <DoctorPatientSummary patient={patient} />

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <section className="rounded-2xl border border-border bg-card p-6">
          <h3 className="font-semibold text-lg mb-4">Patient History</h3>
          <DoctorPatientHistorySection patient={patient} />
        </section>
        <section className="rounded-2xl border border-border bg-card p-6">
          <h3 className="font-semibold text-lg mb-4">Clinical Notes</h3>
          <DoctorPatientClinicalNotesView patientId={patient.id} doctorId={doctorProfile?.id} embedded />
        </section>
      </div>
    </div>
  );
}