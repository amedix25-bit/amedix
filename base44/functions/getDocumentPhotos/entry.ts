import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { logClinicalAudit } from "../../shared/clinicalAudit.ts";

// Issues signed URLs for the clinical photographs attached to a document
// (e.g. dermatology lesion photos, stored as PRIVATE files). Supports both
// encounter clinical documents and specialty clinical notes — pass
// record_type: "clinical_note" for a note. PERMISSIONS & ACCESS CONTROL:
// only the patient, the authoring doctor (who must also hold an approved
// patient access request) or an administrator can view them — the same
// rules as other clinical information. Every view is audit-logged.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const payload = body && typeof body === "object" ? body : {};
    if (!payload.document_record_id) {
      return Response.json({ error: "Document is required." }, { status: 400 });
    }

    const isClinicalNote = payload.record_type === "clinical_note";
    let record = null;
    try {
      const found = isClinicalNote
        ? await base44.asServiceRole.entities.ClinicalNote.filter({ id: String(payload.document_record_id) })
        : await base44.asServiceRole.entities.ClinicalDocument.filter({ id: String(payload.document_record_id) });
      record = found[0] || null;
    } catch (e) {
      record = null;
    }
    if (!record) return Response.json({ error: "Document not found." }, { status: 404 });

    const uris = Array.isArray(record.photo_file_uris) ? record.photo_file_uris : [];
    if (uris.length === 0) return Response.json({ photos: [] });

    let patientUserId = null;
    let doctorUserId = null;
    if (isClinicalNote) {
      const [patients, doctors] = await Promise.all([
        base44.asServiceRole.entities.PatientProfile.filter({ id: String(record.patient_id) }),
        base44.asServiceRole.entities.DoctorProfile.filter({ id: String(record.doctor_id) }),
      ]);
      patientUserId = patients[0]?.user_id || null;
      doctorUserId = doctors[0]?.user_id || null;
    } else {
      patientUserId = record.patient_user_id;
      doctorUserId = record.doctor_user_id;
    }

    const isPatient = patientUserId === user.id;
    const isAuthor = doctorUserId === user.id;
    const isAdmin = user.role === "admin";
    if (!isPatient && !isAuthor && !isAdmin) {
      return Response.json({ error: "You are not authorized to view these photographs." }, { status: 403 });
    }
    if (isAuthor) {
      const accessReqs = await base44.asServiceRole.entities.AccessRequest.filter({
        doctor_id: record.doctor_id,
        patient_id: record.patient_id,
        status: "approved",
      });
      if (accessReqs.length === 0) {
        return Response.json({ error: "You do not have authorized access to this patient's photographs." }, { status: 403 });
      }
    }

    const photos = [];
    for (const uri of uris.slice(0, 6)) {
      try {
        const res = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({ file_uri: uri, expires_in: 3600 });
        const signed = res?.signed_url || res?.data?.signed_url;
        if (signed) photos.push(signed);
      } catch (e) {
        // Skip a photo that can no longer be signed.
      }
    }

    await logClinicalAudit(base44, {
      actor_user_id: user.id,
      actor_name: isPatient ? record.patient_name : record.doctor_name,
      actor_role: isPatient ? "patient" : isAuthor ? "doctor" : "admin",
      action: "viewed_clinical_photos",
      action_label: `viewed ${photos.length} clinical photograph${photos.length === 1 ? "" : "s"}`,
      patient_id: record.patient_id,
      patient_cin: record.patient_cin,
      patient_name: record.patient_name,
      encounter_id: isClinicalNote ? "" : record.encounter_id,
      document_id: isClinicalNote ? "" : record.document_id,
      hospital: isClinicalNote ? "" : record.hospital,
      department: isClinicalNote ? "" : record.department,
    });

    return Response.json({ photos });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}