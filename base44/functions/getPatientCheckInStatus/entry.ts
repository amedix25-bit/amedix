import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { findClinicalCheckIn } from "../../shared/patientAccess.ts";

// Doctor-portal check-in status for a patient. The verdict comes from the
// backend — the frontend only renders it. A doctor holds the clinical functions
// when the hospital assigned them as the treating doctor of an active visit, or
// when their hospital has an active check-in for the patient.
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

    const { checkin, via } = await findClinicalCheckIn(base44, doctor, patientId);
    return Response.json({
      checked_in: !!checkin,
      hospital: checkin?.hospital_name || doctor.hospital || "",
      access_via: via,
      assigned_doctor: via === "assigned_doctor" ? doctor.full_name || "" : "",
      checkin: checkin
        ? {
            hospital_name: checkin.hospital_name,
            checkin_datetime: checkin.checkin_datetime,
            payment_method: checkin.payment_method,
            encounter_ref: checkin.encounter_ref || "",
            assigned_doctor_name: checkin.assigned_doctor_name || "",
          }
        : null,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}