import React, { useState } from "react";
import { ArrowLeft, History, FileText } from "lucide-react";
import DoctorPatientSummary from "@/components/doctor/patients/DoctorPatientSummary";
import DoctorPatientHistorySection from "@/components/doctor/patients/DoctorPatientHistorySection";
import DoctorPatientClinicalNotesView from "@/components/doctor/DoctorPatientClinicalNotesView";

// Patient profile page (Find My Patient → My Patients → patient). Shows the
// patient's identity and key medical information at the top, then two options —
// "Patient History" and "Clinical Notes". The selected section's information
// is displayed full width below (nothing shown until one is selected).
export default function DoctorPatientRecordView({ patient, onBack, doctorProfile }) {
  const [activeTab, setActiveTab] = useState(null);

  const tabButton = (key, label, Icon) => (
    <button
      type="button"
      onClick={() => setActiveTab(key)}
      className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        activeTab === key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" /> All patients
      </button>

      <DoctorPatientSummary patient={patient} />

      <div className="flex rounded-xl border border-border bg-card p-1 gap-1 max-w-xl">
        {tabButton("history", "Patient History", History)}
        {tabButton("notes", "Clinical Notes", FileText)}
      </div>

      {activeTab === "history" && (
        <section className="rounded-2xl border border-border bg-card p-6">
          <h3 className="font-semibold text-lg mb-4">Patient History</h3>
          <DoctorPatientHistorySection patient={patient} />
        </section>
      )}

      {activeTab === "notes" && (
        <section className="rounded-2xl border border-border bg-card p-6">
          <h3 className="font-semibold text-lg mb-4">Clinical Notes</h3>
          <DoctorPatientClinicalNotesView patientId={patient.id} doctorId={doctorProfile?.id} embedded />
        </section>
      )}

      {!activeTab && (
        <p className="text-sm text-muted-foreground text-center py-8">
          Select Patient History or Clinical Notes above to view the patient's information.
        </p>
      )}
    </div>
  );
}