import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { findActiveCheckIn, gateBlocked } from "../../shared/hospitalAuth.ts";
import { generateClinicalRef, logClinicalAudit } from "../../shared/clinicalAudit.ts";

// Universal clinical documentation — available to every doctor regardless of
// specialty. The document automatically receives the patient identity, the
// full encounter context (hospital, department, doctor, specialty, date/time,
// Encounter ID), a unique AMedix Document ID, version 1, amendment status
// "original", and the creation date/time with the creating doctor. Written
// with the service role after the mandatory check-in gate — direct client
// writes are blocked by Row Level Security.
const DOCUMENT_TYPES = [
  "initial_consultation_note", "follow_up_note", "progress_note",
  "problem_oriented_progress_note", "assessment_and_plan", "procedure_note",
  "clinical_summary", "discharge_summary", "referral_note",
  "consultation_request", "consultation_response", "medical_certificate",
  "medical_report", "sick_leave_certificate", "patient_instructions",
  "medication_reconciliation", "allergy_reaction_record", "active_problem_list",
  "past_medical_history", "surgical_history", "family_history",
  "social_history", "medication_list", "diagnosis_history", "care_plan",
  "follow_up_plan", "admission_note", "daily_progress_note", "transfer_note",
  "transfer_of_care_note", "discharge_instructions",
];

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const payload = body && typeof body === "object" ? body : {};
    if (!payload.patient_id || !payload.doctor_id || !payload.encounter_id || !payload.document_type) {
      return Response.json({ error: "Patient, doctor, encounter and document type are required." }, { status: 400 });
    }
    const documentType = String(payload.document_type);
    if (!DOCUMENT_TYPES.includes(documentType)) {
      return Response.json({ error: "Unknown document type." }, { status: 400 });
    }
    if (!String(payload.content || "").trim()) {
      return Response.json({ error: "Document content is required." }, { status: 400 });
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

    // Mandatory check-in security gate.
    const checkin = await findActiveCheckIn(base44, payload.patient_id, doctor.hospital);
    if (!checkin) return gateBlocked();

    // The encounter must exist and belong to this patient.
    let encounter = null;
    try {
      const found = await base44.asServiceRole.entities.Encounter.filter({ encounter_id: String(payload.encounter_id) });
      encounter = found[0] || null;
    } catch (e) {
      encounter = null;
    }
    if (!encounter || encounter.patient_id !== String(payload.patient_id)) {
      return Response.json({ error: "Encounter not found for this patient." }, { status: 404 });
    }

    const patients = await base44.asServiceRole.entities.PatientProfile.filter({ id: String(payload.patient_id) });
    if (patients.length === 0) return Response.json({ error: "Patient not found." }, { status: 404 });
    const patient = patients[0];

    const now = new Date();
    const document_id = generateClinicalRef("AMD");
    const document = await base44.asServiceRole.entities.ClinicalDocument.create({
      document_id,
      patient_id: patient.id,
      patient_user_id: patient.user_id || "",
      patient_cin: patient.cin || "",
      patient_name: patient.full_name || "",
      patient_dob: patient.date_of_birth || "",
      encounter_id: encounter.encounter_id,
      hospital: encounter.hospital,
      department: encounter.department,
      doctor_id: doctor.id,
      doctor_user_id: user.id,
      doctor_name: doctor.full_name || "",
      doctor_specialty: doctor.specialization || "",
      document_type: documentType,
      document_type_label: String(payload.document_type_label || documentType),
      content: String(payload.content),
      version: 1,
      previous_version_id: "",
      is_amendment: false,
      amendment_status: "original",
      status: "draft",
      created_datetime: now.toISOString(),
      created_by_name: doctor.full_name || "",
    });

    await logClinicalAudit(base44, {
      actor_user_id: user.id,
      actor_name: doctor.full_name,
      actor_role: "doctor",
      action: "created_clinical_document",
      action_label: `created a clinical document (${document.document_type_label || documentType})`,
      patient_id: patient.id,
      patient_cin: patient.cin,
      patient_name: patient.full_name,
      encounter_id: encounter.encounter_id,
      document_id,
      hospital: encounter.hospital,
      department: encounter.department,
    });

    return Response.json({ document, checkin_id: checkin.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}