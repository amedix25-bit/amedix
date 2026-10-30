import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { findActiveCheckIn, gateBlocked } from "../../shared/hospitalAuth.ts";
import { generateClinicalRef, logClinicalAudit } from "../../shared/clinicalAudit.ts";
import { isKnownDocumentType, getDocumentSpecialty, isConfidentialDocumentType } from "../../shared/clinicalDocumentCatalog.ts";
import { logNeurologyAudit } from "../../shared/neurologyAudit.ts";

// Universal clinical documentation — the general document types plus the
// specialty-specific paperwork, available to every doctor regardless of
// specialty through the same system. The document automatically receives the
// patient identity, the full encounter context (hospital, department, doctor,
// specialty, date/time, Encounter ID), its specialty (derived server-side
// from the document type), a unique AMedix Document ID, version 1, amendment
// status "original", and the creation date/time with the creating doctor.
// Written with the service role after the mandatory check-in gate — direct
// client writes are blocked by Row Level Security.

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
    if (!isKnownDocumentType(documentType)) {
      return Response.json({ error: "Unknown document type." }, { status: 400 });
    }
    // Structured specialty fields — sanitized to { label, value } entries.
    const data = {};
    if (payload.data && typeof payload.data === "object") {
      for (const [k, v] of Object.entries(payload.data)) {
        if (v && typeof v === "object" && "label" in v && "value" in v) {
          if (v.value !== null && v.value !== undefined && String(v.value) !== "") {
            data[k] = { label: String(v.label || k), value: String(v.value) };
          }
        }
      }
    }
    const hasData = Object.keys(data).length > 0;
    if (!String(payload.content || "").trim() && !hasData) {
      return Response.json({ error: "Document content is required." }, { status: 400 });
    }
    // Clinical photographs (e.g. dermatology lesion photos) — private storage,
    // never public; viewable only through backend-issued signed URLs.
    const photoUris = Array.isArray(payload.photo_file_uris)
      ? payload.photo_file_uris.filter((u) => typeof u === "string" && u).slice(0, 6)
      : [];

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
      specialty: getDocumentSpecialty(documentType),
      document_type: documentType,
      document_type_label: String(payload.document_type_label || documentType),
      content: String(payload.content || ""),
      data,
      is_confidential: isConfidentialDocumentType(documentType),
      photo_file_uris: photoUris,
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

    // Neurology decision-support events are audited individually: a medication
    // alert, a critical finding and an escalation each become a queryable entry
    // rather than only text in the note.
    await logNeurologyAudit(base44, payload.neurology_audit, {
      actor_user_id: user.id,
      actor_name: doctor.full_name,
      patient_id: patient.id,
      patient_user_id: patient.user_id || "",
      patient_cin: patient.cin || "",
      patient_name: patient.full_name || "",
      encounter_id: encounter.encounter_id || "",
      document_id,
      hospital: encounter.hospital || "",
      department: encounter.department || "",
    });

    return Response.json({ document, checkin_id: checkin.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}