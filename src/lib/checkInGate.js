import { base44 } from "@/api/base44Client";

// The check-in security gate, doctor-portal side. The backend verdict in
// getPatientCheckInStatus decides whether the clinical functions are unlocked
// for this patient at the doctor's hospital — this helper only fetches it.
// Fails closed: any error leaves the functions locked.
export const LOCKED_MESSAGE =
  "Locked — this patient is not checked in at your hospital yet. Ask the hospital reception to check the patient in first.";

export async function fetchCheckInStatus(patientId) {
  try {
    const res = await base44.functions.invoke("getPatientCheckInStatus", { patient_id: patientId });
    return res.data;
  } catch (err) {
    console.error(err);
    return { checked_in: false, checkin: null };
  }
}