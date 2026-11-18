import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { gateBlocked } from "../../shared/hospitalAuth.ts";
import { findClinicalCheckIn } from "../../shared/patientAccess.ts";
import { logClinicalAudit } from "../../shared/clinicalAudit.ts";
import { logNeurologyAudit } from "../../shared/neurologyAudit.ts";

// DOCUMENT VERSION CONTROL. A signed version is never overwritten — a
// correction creates a NEW version under the same AMedix Document ID:
//   Original Note — Version 1 — Signed → Amended Note — Version 2 — Draft.
// The original Version 1 remains permanently accessible in the audit history.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const payload = body && typeof body === "object" ? body : {};
    if (!payload.document_record_id || !String(payload.amendment_reason || "").trim()) {
      return Response.json({ error: "Document and amendment reason are required." }, { status: 400 });
    }

    let original = null;
    try {
      const found = await base44.asServiceRole.entities.ClinicalDocument.filter({ id: String(payload.document_record_id) });
      original = found[0] || null;
    } catch (e) {
      original = null;
    }
    if (!original) return Response.json({ error: "Document not found." }, { status: 404 });
    if (original.doctor_user_id !== user.id) {
      return Response.json({ error: "Only the authoring doctor can amend this document." }, { status: 403 });
    }
    if (original.status !== "signed") {
      return Response.json({ error: "Only a signed version can be amended — drafts are replaced instead." }, { status: 400 });
    }

    // Mandatory check-in security gate — the patient must still be checked in.
    const { checkin } = await findClinicalCheckIn(
      base44,
      { id: original.doctor_id, hospital: original.hospital },
      original.patient_id
    );
    if (!checkin) return gateBlocked();

    const now = new Date();
    const amended = await base44.asServiceRole.entities.ClinicalDocument.create({
      document_id: original.document_id,
      patient_id: original.patient_id,
      patient_user_id: original.patient_user_id || "",
      patient_cin: original.patient_cin || "",
      patient_name: original.patient_name || "",
      patient_dob: original.patient_dob || "",
      encounter_id: original.encounter_id,
      hospital: original.hospital,
      department: original.department,
      doctor_id: original.doctor_id,
      doctor_user_id: user.id,
      doctor_name: original.doctor_name || "",
      doctor_specialty: original.doctor_specialty || "",
      specialty: original.specialty || "",
      document_type: original.document_type,
      document_type_label: original.document_type_label || original.document_type,
      content: String(payload.content || ""),
      data: (payload.data && typeof payload.data === "object") ? payload.data : (original.data || {}),
      is_confidential: original.is_confidential || false,
      photo_file_uris: Array.isArray(payload.photo_file_uris)
        ? payload.photo_file_uris.filter((u) => typeof u === "string" && u).slice(0, 6)
        : (original.photo_file_uris || []),
      version: (original.version || 1) + 1,
      previous_version_id: original.id,
      is_amendment: true,
      amendment_reason: String(payload.amendment_reason),
      amendment_status: "amendment",
      status: "draft",
      created_datetime: now.toISOString(),
      created_by_name: original.doctor_name || "",
    });

    await logClinicalAudit(base44, {
      actor_user_id: user.id,
      actor_name: original.doctor_name,
      actor_role: "doctor",
      action: "amended_clinical_document",
      action_label: `created Version ${amended.version} of a clinical document (${amended.document_type_label || amended.document_type})`,
      patient_id: original.patient_id,
      patient_cin: original.patient_cin,
      patient_name: original.patient_name,
      encounter_id: original.encounter_id,
      document_id: original.document_id,
      hospital: original.hospital,
      department: original.department,
    });

    // An amendment carries its own neurology events, so a corrected escalation or
    // a resolved alert is visible in the trail beside the version it belongs to.
    await logNeurologyAudit(base44, payload.neurology_audit, {
      actor_user_id: user.id,
      actor_name: original.doctor_name,
      patient_id: original.patient_id,
      patient_user_id: original.patient_user_id || "",
      patient_cin: original.patient_cin || "",
      patient_name: original.patient_name || "",
      encounter_id: original.encounter_id || "",
      document_id: original.document_id || "",
      hospital: original.hospital || "",
      department: original.department || "",
    });

    return Response.json({ document: amended, checkin_id: checkin.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}