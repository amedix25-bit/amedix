import React, { useState } from "react";
import { ArrowLeft, History, FileText, Pill, ClipboardList, Stethoscope, FlaskConical, Image as ImageIcon, Plus, Baby } from "lucide-react";
import { Button } from "@/components/ui/button";
import DoctorPatientVisitSection from "@/components/doctor/patients/DoctorPatientVisitSection";
import ClinicalNoteForm from "@/components/doctor/notes/ClinicalNoteForm";
import DoctorLabRequests from "@/components/doctor/DoctorLabRequests";
import DoctorImagingRequests from "@/components/doctor/DoctorImagingRequests";
import DoctorPatientSummary from "@/components/doctor/patients/DoctorPatientSummary";
import PatientAccessBanner from "@/components/doctor/patients/PatientAccessBanner";
import DoctorPatientHistorySection from "@/components/doctor/patients/DoctorPatientHistorySection";
import DoctorAntenatalSection from "@/components/doctor/antenatal/DoctorAntenatalSection";
import DoctorPatientClinicalNotesView from "@/components/doctor/DoctorPatientClinicalNotesView";
import DoctorPatientPrescriptions from "@/components/doctor/pharmacy/DoctorPatientPrescriptions";
import DoctorMedicationHistory from "@/components/doctor/medhistory/DoctorMedicationHistory";
import { DoctorTranslationsProvider } from "@/lib/doctorMedicalTranslations";

// Patient profile page (Find My Patient → My Patients → patient). Shows the
// patient's identity and key medical information at the top, then two options —
// "Patient History" and "Clinical Notes". The selected section's information
// is displayed full width below (nothing shown until one is selected).
export default function DoctorPatientRecordView({ patient, onBack, doctorProfile }) {
  const [activeTab, setActiveTab] = useState(null);
  const [showNoteForm, setShowNoteForm] = useState(false);

  // Antenatal Care belongs to the OBGYN portal only.
  const isObgyn = /obstetric|gyneco/i.test(doctorProfile?.specialization || "");

  const tabButton = (key, label, Icon) => (
    <button
      type="button"
      onClick={() => setActiveTab(key)}
      title={label}
      className={`flex-1 min-w-0 shrink inline-flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[13px] font-medium transition-colors ${
        activeTab === key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
      }`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span className="truncate">{label}</span>
    </button>
  );

  return (
    <DoctorTranslationsProvider patientId={patient.id}>
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" /> All patients
      </button>

      <PatientAccessBanner patientId={patient.id} doctorId={doctorProfile?.id} />

      <DoctorPatientSummary patient={patient} />

      <div className="flex flex-nowrap w-full overflow-x-auto rounded-xl border border-border bg-card p-1 gap-1">
        {tabButton("history", "Patient History", History)}
        {isObgyn && patient.gender === "female" && tabButton("antenatal", "Antenatal Care", Baby)}
        {tabButton("notes", "Clinical Notes", FileText)}
        {tabButton("prescriptions", "Prescriptions", Pill)}
        {tabButton("medhistory", "Medication History", ClipboardList)}
        {tabButton("visit", "Patient Visit", Stethoscope)}
        {tabButton("newlab", "Add Lab Request", FlaskConical)}
        {tabButton("newimaging", "Add Imaging", ImageIcon)}
      </div>

      {activeTab === "history" && (
        <section className="rounded-2xl border border-border bg-card p-6">
          <h3 className="font-semibold text-lg mb-4">Patient History</h3>
          <DoctorPatientHistorySection patient={patient} />
        </section>
      )}

      {activeTab === "antenatal" && (
        <section className="rounded-2xl border border-border bg-card p-6">
          <h3 className="font-semibold text-lg mb-4">Antenatal Care</h3>
          <DoctorAntenatalSection patient={patient} doctorProfile={doctorProfile} />
        </section>
      )}

      {activeTab === "notes" && (
        <section className="rounded-2xl border border-border bg-card p-6">
          {showNoteForm ? (
            <>
              <h3 className="font-semibold text-lg mb-4">Add Clinical Note</h3>
              <ClinicalNoteForm
                doctorProfile={doctorProfile}
                preselectedPatient={patient}
                onSaved={() => setShowNoteForm(false)}
                onCancel={() => setShowNoteForm(false)}
              />
            </>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">Clinical Notes</h3>
                <Button size="sm" onClick={() => setShowNoteForm(true)}>
                  <Plus className="w-4 h-4" />
                  Add Clinical Note
                </Button>
              </div>
              <DoctorPatientClinicalNotesView patientId={patient.id} doctorId={doctorProfile?.id} embedded />
            </>
          )}
        </section>
      )}

      {activeTab === "prescriptions" && (
        <section className="rounded-2xl border border-border bg-card p-6">
          <h3 className="font-semibold text-lg mb-4">Prescriptions</h3>
          <DoctorPatientPrescriptions patient={patient} doctorProfile={doctorProfile} />
        </section>
      )}

      {activeTab === "medhistory" && (
        <section className="rounded-2xl border border-border bg-card p-6">
          <h3 className="font-semibold text-lg mb-4">Medication History</h3>
          <DoctorMedicationHistory
            patient={patient}
            onReconciled={undefined}
          />
        </section>
      )}

      {activeTab === "visit" && (
        <section className="rounded-2xl border border-border bg-card p-6">
          <h3 className="font-semibold text-lg mb-4">Patient Visit</h3>
          <DoctorPatientVisitSection patient={patient} doctorProfile={doctorProfile} />
        </section>
      )}

      {activeTab === "newlab" && (
        <section className="rounded-2xl border border-border bg-card p-6">
          <h3 className="font-semibold text-lg mb-4">Add Lab Request</h3>
          <DoctorLabRequests
            doctorProfile={doctorProfile}
            draftContext={{ patient }}
            onNavigateTab={() => {}}
          />
        </section>
      )}

      {activeTab === "newimaging" && (
        <section className="rounded-2xl border border-border bg-card p-6">
          <h3 className="font-semibold text-lg mb-4">Add Imaging</h3>
          <DoctorImagingRequests doctorProfile={doctorProfile} initialCin={patient.cin} />
        </section>
      )}

      {!activeTab && (
        <p className="text-sm text-muted-foreground text-center py-8">
          Select a tab above to view the patient's information or start a visit, clinical note, lab request or imaging request.
        </p>
      )}
    </div>
    </DoctorTranslationsProvider>
  );
}