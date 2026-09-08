import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import DoctorPatientClinicalNotesView from "@/components/doctor/DoctorPatientClinicalNotesView";
import PatientSearchSelect from "@/components/doctor/patients/PatientSearchSelect";

export default function DoctorClinicalNotes({ doctorProfile }) {
  const [myPatients, setMyPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);

  useEffect(() => {
    const loadPatients = async () => {
      try {
        const accessReqs = await base44.entities.AccessRequest.filter({ doctor_id: doctorProfile.id, status: "approved" });
        const seen = new Set();
        const profiles = [];
        await Promise.all(
          accessReqs.map(async (r) => {
            if (seen.has(r.patient_id)) return;
            seen.add(r.patient_id);
            const result = await base44.entities.PatientProfile.filter({ id: r.patient_id });
            if (result.length > 0) profiles.push(result[0]);
          })
        );
        setMyPatients(profiles);
      } catch (err) {
        console.error(err);
      }
    };
    loadPatients();
  }, [doctorProfile]);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-5">
        <PatientSearchSelect
          label="Find My Patient"
          patients={myPatients}
          selected={selectedPatient}
          onSelect={(p) => setSelectedPatient(p)}
        />
      </div>

      {selectedPatient && (
        <div className="rounded-xl border border-border bg-card p-5">
          <DoctorPatientClinicalNotesView patientId={selectedPatient.id} />
        </div>
      )}
    </div>
  );
}