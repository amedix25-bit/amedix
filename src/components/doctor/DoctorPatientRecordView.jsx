import React from "react";
import { ArrowLeft, UserCheck } from "lucide-react";
import PatientHealth from "@/components/patient/PatientHealth";
import DoctorPatientClinicalNotesView from "@/components/doctor/DoctorPatientClinicalNotesView";
import DoctorPatientLabResultsView from "@/components/doctor/DoctorPatientLabResultsView";

export default function DoctorPatientRecordView({ patient, onBack }) {
  return (
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" /> All patients
      </button>

      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-lg font-bold">{patient.full_name}</p>
            <p className="text-sm text-muted-foreground mt-1">CIN: {patient.cin}</p>
            <div className="flex gap-4 mt-3 text-sm">
              {patient.date_of_birth && <span className="text-muted-foreground">DOB: {patient.date_of_birth}</span>}
              {patient.gender && <span className="text-muted-foreground">Gender: {patient.gender}</span>}
              {patient.blood_type && <span className="text-muted-foreground">Blood: {patient.blood_type}</span>}
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-sm font-medium">
            <UserCheck className="w-4 h-4" />
            Access Granted
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-border">
          <h4 className="font-semibold text-sm mb-3">Medical Information</h4>
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <InfoRow label="Allergies" value={patient.allergies} />
            <InfoRow label="Phone" value={patient.phone} />
            <InfoRow label="Address" value={patient.address} />
            <InfoRow label="Emergency Contact" value={patient.emergency_contact_name} />
          </div>
        </div>

        <DoctorPatientClinicalNotesView patientId={patient.id} />
        <DoctorPatientLabResultsView patientId={patient.id} />
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h3 className="font-semibold text-lg mb-4">Patient Health</h3>
        <PatientHealth profile={patient} doctorView />
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div>
      <span className="text-muted-foreground">{label}: </span>
      <span className="font-medium">{value || "—"}</span>
    </div>
  );
}