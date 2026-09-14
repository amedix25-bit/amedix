import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { findActiveCheckIn } from "../../shared/hospitalAuth.ts";

// Doctor-portal check-in status for a patient. The verdict comes from the
// backend — the frontend only renders it. Doctors whose hospital has no active
// check-in for the patient see the clinical functions locked.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const patientId = String(body.patient_id || "");
    if (!patientId) return Response.json({ error: "Patient is required." }, { status: 400 });

    const doctors = await base44.asServiceRole.entities.DoctorProfile.filter({ user_id: user.id });
    if (doctors.length === 0) {
      return Response.json({ error: "Doctor profile not found." }, { status: 403 });
    }
    const doctor = doctors[0];

    const checkin = await findActiveCheckIn(base44, patientId, doctor.hospital);
    return Response.json({
      checked_in: !!checkin,
      hospital: doctor.hospital || "",
      checkin: checkin
        ? {
            hospital_name: checkin.hospital_name,
            checkin_datetime: checkin.checkin_datetime,
            payment_method: checkin.payment_method,
          }
        : null,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}