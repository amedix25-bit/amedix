import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { gateBlocked } from "../../shared/hospitalAuth.ts";
import { findClinicalCheckIn } from "../../shared/patientAccess.ts";

// Surgical record creation for doctors with the Surgeon specialty — the
// surgeon's equivalent of a clinical note. The backend independently
// verifies that the doctor profile belongs to the signed-in user AND that an
// active check-in exists for this patient at the doctor's hospital BEFORE the
// record is created — no frontend state, URL or crafted request can bypass it.
// The record is written server-side (service role); direct client-side writes
// are blocked by Row Level Security.
const RECORD_TYPES = [
  "surgical_consultation",
  "preop_assessment",
  "operative_note",
  "procedure_note",
  "postop_note",
  "daily_progress",
  "discharge_summary",
  "surgical_followup",
  "pathology_specimens",
];

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const payload = body && typeof body === "object" ? body : {};
    if (!payload.patient_id || !payload.doctor_id || !payload.record_type) {
      return Response.json({ error: "Patient, doctor and record type are required." }, { status: 400 });
    }
    const recordType = String(payload.record_type);
    if (!RECORD_TYPES.includes(recordType)) {
      return Response.json({ error: "Unknown surgical record type." }, { status: 400 });
    }

    // The doctor profile must belong to the signed-in user.
    let doctor = null;
    try {
      const doctors = await base44.asServiceRole.entities.DoctorProfile.filter({ id: String(payload.doctor_id) });
      doctor = doctors[0] || null;
    } catch (e) {
      doctor = null;
    }
    if (!doctor || doctor.user_id !== user.id) {
      return Response.json({ error: "Doctor profile not found." }, { status: 403 });
    }

    // Mandatory check-in security gate — identical to clinical notes.
    const { checkin } = await findClinicalCheckIn(base44, doctor, payload.patient_id);
    if (!checkin) return gateBlocked();

    const patients = await base44.asServiceRole.entities.PatientProfile.filter({ id: String(payload.patient_id) });
    if (patients.length === 0) {
      return Response.json({ error: "Patient not found." }, { status: 404 });
    }
    const patient = patients[0];
    const now = new Date().toISOString();

    const record = await base44.asServiceRole.entities.SurgicalRecord.create({
      patient_id: patient.id,
      patient_user_id: patient.user_id || "",
      patient_cin: patient.cin || "",
      patient_name: patient.full_name || "",
      doctor_id: doctor.id,
      doctor_user_id: user.id,
      doctor_name: doctor.full_name || "",
      doctor_specialization: doctor.specialization || "",
      doctor_hospital: doctor.hospital || "",
      record_type: recordType,
      record_type_title: String(payload.record_type_title || recordType),
      data: payload.data && typeof payload.data === "object" ? payload.data : {},
      record_datetime: now,
      record_date: now.slice(0, 10),
    });

    return Response.json({ record, checkin_id: checkin.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}