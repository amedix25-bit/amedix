import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { findActiveCheckIn, gateBlocked } from "../../shared/hospitalAuth.ts";

// Clinical note creation with the mandatory check-in gate. The backend
// independently verifies that an active check-in exists for this patient at
// the doctor's hospital BEFORE the note is created — no frontend state, URL
// or crafted request can bypass it.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const payload = body && typeof body === "object" ? body : {};
    if (!payload.patient_id || !payload.doctor_id) {
      return Response.json({ error: "Patient and doctor are required." }, { status: 400 });
    }

    // The doctor profile must belong to the signed-in user.
    const doctors = await base44.asServiceRole.entities.DoctorProfile.filter({ id: String(payload.doctor_id) });
    if (doctors.length === 0 || doctors[0].user_id !== user.id) {
      return Response.json({ error: "Doctor profile not found." }, { status: 403 });
    }
    const doctor = doctors[0];

    const checkin = await findActiveCheckIn(base44, payload.patient_id, doctor.hospital);
    if (!checkin) return gateBlocked();

    // Prescribed medications ride along with the note; the note and the
    // medications are written server-side (service role) — direct client-side
    // writes are blocked by Row Level Security.
    const { medications, ...notePayload } = payload;
    const note = await base44.asServiceRole.entities.ClinicalNote.create(notePayload);
    const meds = Array.isArray(medications) ? medications : [];
    if (meds.length > 0) {
      const patients = await base44.asServiceRole.entities.PatientProfile.filter({ id: String(payload.patient_id) });
      const patientUser = patients.length > 0 ? patients[0].user_id : "";
      await base44.asServiceRole.entities.Medication.bulkCreate(
        meds.map((m) => ({ ...m, patient_user_id: patientUser }))
      );
    }
    return Response.json({ note, checkin_id: checkin.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}