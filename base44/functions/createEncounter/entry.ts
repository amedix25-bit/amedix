import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { gateBlocked } from "../../shared/hospitalAuth.ts";
import { findClinicalCheckIn } from "../../shared/patientAccess.ts";
import { generateClinicalRef, logClinicalAudit } from "../../shared/clinicalAudit.ts";

// Encounter creation — the foundation of the clinical system. Every clinical
// document, order and result attaches to an encounter. The backend verifies
// the doctor profile belongs to the signed-in user AND that the patient is
// actively checked in at the doctor's verified hospital before the encounter
// is created — no frontend state can bypass it. Written with the service role;
// direct client writes are blocked by Row Level Security.
const ENCOUNTER_TYPES = ["consultation", "follow_up", "emergency", "procedure", "admission", "telemedicine", "other"];

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const payload = body && typeof body === "object" ? body : {};
    if (!payload.patient_id || !payload.doctor_id || !payload.encounter_type) {
      return Response.json({ error: "Patient, doctor and encounter type are required." }, { status: 400 });
    }
    if (!ENCOUNTER_TYPES.includes(String(payload.encounter_type))) {
      return Response.json({ error: "Unknown encounter type." }, { status: 400 });
    }

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

    // The practicing specialty for THIS encounter — must be one of the
    // doctor's verified specialties; defaults to the doctor's active one.
    // It is saved on the encounter and drives the specialty-specific
    // documentation offered for every document created during the encounter.
    const verifiedSpecialties = (Array.isArray(doctor.specialties) && doctor.specialties.length
      ? doctor.specialties
      : [doctor.specialization]
    ).filter(Boolean);
    let practicingSpecialty = doctor.specialization || "";
    if (payload.practicing_specialty) {
      if (!verifiedSpecialties.includes(String(payload.practicing_specialty))) {
        return Response.json({ error: "That specialty is not on your verified doctor profile." }, { status: 400 });
      }
      practicingSpecialty = String(payload.practicing_specialty);
    }

    // Mandatory check-in security gate.
    const { checkin } = await findClinicalCheckIn(base44, doctor, payload.patient_id);
    if (!checkin) return gateBlocked();

    const patients = await base44.asServiceRole.entities.PatientProfile.filter({ id: String(payload.patient_id) });
    if (patients.length === 0) return Response.json({ error: "Patient not found." }, { status: 404 });
    const patient = patients[0];

    const now = new Date();
    const encounter = await base44.asServiceRole.entities.Encounter.create({
      encounter_id: generateClinicalRef("ENC"),
      patient_id: patient.id,
      patient_user_id: patient.user_id || "",
      patient_cin: patient.cin || "",
      patient_name: patient.full_name || "",
      patient_dob: patient.date_of_birth || "",
      hospital: doctor.hospital || "",
      hospital_user_id: checkin.hospital_user_id || "",
      department: String(payload.department || ""),
      doctor_id: doctor.id,
      doctor_user_id: user.id,
      doctor_name: doctor.full_name || "",
      doctor_specialty: practicingSpecialty,
      encounter_type: String(payload.encounter_type),
      status: "active",
      chief_complaint: String(payload.chief_complaint || ""),
      encounter_datetime: now.toISOString(),
      encounter_date: now.toISOString().slice(0, 10),
      encounter_time: now.toISOString().slice(11, 16),
    });

    await logClinicalAudit(base44, {
      actor_user_id: user.id,
      actor_name: doctor.full_name,
      actor_role: "doctor",
      action: "created_encounter",
      action_label: "opened a patient encounter",
      patient_id: patient.id,
      patient_cin: patient.cin,
      patient_name: patient.full_name,
      encounter_id: encounter.encounter_id,
      hospital: encounter.hospital,
      department: encounter.department,
    });

    return Response.json({ encounter, checkin_id: checkin.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}