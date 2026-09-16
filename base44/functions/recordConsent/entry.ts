import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { findActiveCheckIn, gateBlocked } from "../../shared/hospitalAuth.ts";
import { logClinicalAudit } from "../../shared/clinicalAudit.ts";

// Centralized consent management. Records who obtained the consent, when,
// at which facility, its status and signature. Written with the service role
// after the mandatory check-in gate.
const CONSENT_TYPES = [
  "general_treatment", "procedure", "surgical", "anesthesia",
  "blood_transfusion", "imaging_contrast", "research",
  "privacy_data_sharing", "patient_access_authorization", "withdrawal_revocation",
];

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const payload = body && typeof body === "object" ? body : {};
    if (!payload.patient_id || !payload.doctor_id || !payload.consent_type) {
      return Response.json({ error: "Patient, doctor and consent type are required." }, { status: 400 });
    }
    const consentType = String(payload.consent_type);
    if (!CONSENT_TYPES.includes(consentType)) {
      return Response.json({ error: "Unknown consent type." }, { status: 400 });
    }
    const status = String(payload.status || "given");
    if (!["given", "declined", "withdrawn"].includes(status)) {
      return Response.json({ error: "Invalid consent status." }, { status: 400 });
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

    const checkin = await findActiveCheckIn(base44, payload.patient_id, doctor.hospital);
    if (!checkin) return gateBlocked();

    const patients = await base44.asServiceRole.entities.PatientProfile.filter({ id: String(payload.patient_id) });
    if (patients.length === 0) return Response.json({ error: "Patient not found." }, { status: 404 });
    const patient = patients[0];

    const now = new Date();
    const consent = await base44.asServiceRole.entities.Consent.create({
      patient_id: patient.id,
      patient_user_id: patient.user_id || "",
      patient_cin: patient.cin || "",
      patient_name: patient.full_name || "",
      consent_type: consentType,
      consent_type_label: String(payload.consent_type_label || consentType),
      obtained_by_name: doctor.full_name || "",
      obtained_by_user_id: user.id,
      doctor_id: doctor.id,
      hospital: doctor.hospital || "",
      department: String(payload.department || ""),
      encounter_id: String(payload.encounter_id || ""),
      consent_datetime: now.toISOString(),
      consent_date: now.toISOString().slice(0, 10),
      status,
      notes: String(payload.notes || ""),
      signature: String(payload.signature || "Electronically confirmed in person"),
    });

    await logClinicalAudit(base44, {
      actor_user_id: user.id,
      actor_name: doctor.full_name,
      actor_role: "doctor",
      action: "recorded_consent",
      action_label: `recorded a consent (${consent.consent_type_label || consentType} — ${status})`,
      patient_id: patient.id,
      patient_cin: patient.cin,
      patient_name: patient.full_name,
      encounter_id: consent.encounter_id,
      hospital: consent.hospital,
      department: consent.department,
    });

    return Response.json({ consent, checkin_id: checkin.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}