import { base44 } from "@/api/base44Client";

// A patient's date of birth and phone number are restricted fields on the
// patient record: only the patient and AMedix administrators read them
// directly. A treating doctor gets them from the authorized clinical payload
// instead — the backend re-checks the doctor's live access to this patient on
// every call, and returns nothing when that access is not active.
export async function loadAuthorizedPatientIdentity(patientId) {
  if (!patientId) return { date_of_birth: "", phone: "" };
  try {
    const res = await base44.functions.invoke("doctorPatientMedicalData", { patient_id: patientId });
    const patient = res.data?.patient || {};
    return { date_of_birth: patient.date_of_birth || "", phone: patient.phone || "" };
  } catch {
    return { date_of_birth: "", phone: "" };
  }
}