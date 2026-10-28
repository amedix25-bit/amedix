import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

// Reads the parts of the existing AMedix record the rheumatology treatment
// panel works with — the patient's medication list, allergies, prescriptions in
// progress and the last rheumatology assessment. Read-only: nothing here writes
// a medication, prescription or result. The doctor-side access-controlled
// endpoint is used first so the panel shows exactly what the clinician is
// authorized to see.
const asList = (result) => (Array.isArray(result) ? result : (result && result.items) || []);
const isRheum = (note) => String(note.specialty || "").toLowerCase() === "rheumatology";

export default function useRheumPatientContext(patientId) {
  const [context, setContext] = useState({
    medications: [],
    allergies: [],
    prescriptions: [],
    patient: null,
    lastAssessment: "",
    loading: false,
  });

  useEffect(() => {
    let active = true;
    if (!patientId) {
      setContext({ medications: [], allergies: [], prescriptions: [], patient: null, lastAssessment: "", loading: false });
      return () => { active = false; };
    }
    setContext((c) => ({ ...c, loading: true }));

    Promise.all([
      base44.functions.invoke("doctorPatientMedicalData", { patient_id: patientId }).catch(() => null),
      base44.entities.Prescription.filter(
        { patient_id: patientId, status: { $nin: ["dispensed", "cancelled", "rejected"] } },
        { sort: "-created_date", limit: 50 }
      ).catch(() => []),
      base44.entities.PatientProfile.get(patientId).catch(() => null),
    ]).then(([medical, scripts, profile]) => {
      if (!active) return;
      const data = (medical && medical.data) || null;
      const patient = profile || (data && data.patient) || null;
      const rheumNotes = ((data && data.notes) || []).filter(isRheum);
      const last = rheumNotes.sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")))[0];
      setContext({
        medications: (data && data.medications) || [],
        allergies: (data && data.allergies) || [],
        prescriptions: asList(scripts),
        patient,
        lastAssessment: (last && (last.date || last.created_date)) || "",
        loading: false,
      });
    }).catch(() => {
      if (active) setContext((c) => ({ ...c, loading: false }));
    });

    return () => { active = false; };
  }, [patientId]);

  return context;
}