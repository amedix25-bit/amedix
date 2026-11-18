import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { accessLive } from "../../shared/patientAccess.ts";

// Protected clinical file access (Phase 13 security hardening). Clinical
// documents, lab results, referral letters, imaging results and radiology
// records are stored PRIVATELY. This function resolves a stored file to a
// SHORT-LIVED signed URL only for users authorized on that record, and only
// for files that belong to THAT record. Deny by default. The referring
// doctor, the patient of the record, the authorized laboratory (or its
// technician), the radiologist involved, or an administrator — nobody else.
// Every grant and denial is recorded in the Access Audit Log.

function isPublicUrl(ref) {
  return /^https?:/i.test(String(ref || "")) && String(ref).includes("/files/mp/public/");
}

async function doctorUserIdsForPatient(svc, patientId) {
  // Approved doctors for a patient: resolve each LIVE approved AccessRequest's
  // doctor profile to its user id. An authorization that expired or was removed
  // by the patient is excluded, so their old session cannot fetch the file.
  const reqs = await svc.entities.AccessRequest.filter({ patient_id: patientId, status: "approved" });
  const doctorIds = reqs.filter((r) => accessLive(r)).map((r) => r.doctor_id).filter(Boolean);
  const out = new Set();
  for (const did of doctorIds) {
    const prof = await svc.entities.DoctorProfile.get(did);
    if (prof && prof.user_id) out.add(prof.user_id);
  }
  return out;
}

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const payload = body && typeof body === "object" ? body : {};
    const kind = String(payload.kind || "");
    const recordId = String(payload.id || "");
    const fileUri = String(payload.file_uri || "");
    if (!kind || !recordId || !fileUri) {
      return Response.json({ error: "Select the record and the file." }, { status: 400 });
    }

    const svc = base44.asServiceRole;

    // Resolve (record, authorized user-id set, allowed file refs) per kind.
    let record = null;
    let patientId = "";
    let allowedFiles = [];
    const authorized = new Set();
    let patientUserId = "";

    if (kind === "medical_document") {
      const docs = await svc.entities.MedicalDocument.filter({ id: recordId });
      record = docs[0];
      if (!record) return Response.json({ error: "Document not found." }, { status: 404 });
      patientId = record.patient_id;
      allowedFiles = [record.file_url];
    } else if (kind === "patient_lab_result") {
      const rows = await svc.entities.PatientLabResult.filter({ id: recordId });
      record = rows[0];
      if (!record) return Response.json({ error: "Result not found." }, { status: 404 });
      patientId = record.patient_id;
      allowedFiles = [record.file_url];
    } else if (kind === "lab_request") {
      const rows = await svc.entities.LabRequest.filter({ id: recordId });
      record = rows[0];
      if (!record) return Response.json({ error: "Request not found." }, { status: 404 });
      patientId = record.patient_id;
      allowedFiles = [record.result_file_url, record.corrected_result_file_url, record.pdf_url];
    } else if (kind === "clinical_document") {
      const rows = await svc.entities.ClinicalDocument.filter({ id: recordId });
      record = rows[0];
      if (!record) return Response.json({ error: "Document not found." }, { status: 404 });
      patientId = record.patient_id;
      allowedFiles = [record.pdf_url];
      if (record.patient_user_id) authorized.add(record.patient_user_id);
      if (record.doctor_user_id) authorized.add(record.doctor_user_id);
    } else if (kind === "lab_patient_visit") {
      const rows = await svc.entities.LabPatientVisit.filter({ id: recordId });
      record = rows[0];
      if (!record) return Response.json({ error: "Visit not found." }, { status: 404 });
      patientId = record.patient_id;
      allowedFiles = [record.result_file_url];
    } else if (kind === "referral_letter") {
      const rows = await svc.entities.ReferralLetter.filter({ id: recordId });
      record = rows[0];
      if (!record) return Response.json({ error: "Referral not found." }, { status: 404 });
      patientId = record.patient_id;
      allowedFiles = [record.pdf_url, ...(record.attachments || []).map((a) => a.file_url)];
      if (record.patient_user_id) authorized.add(record.patient_user_id);
      if (record.doctor_user_id) authorized.add(record.doctor_user_id);
      if (record.receiving_doctor_user_id) authorized.add(record.receiving_doctor_user_id);
    } else if (kind === "imaging_result") {
      const rows = await svc.entities.ImagingResult.filter({ id: recordId });
      record = rows[0];
      if (!record) return Response.json({ error: "Result not found." }, { status: 404 });
      patientId = record.patient_id;
      allowedFiles = [record.report_pdf_url, ...(record.images || []).map((i) => i.file_url)];
      if (record.patient_user_id) authorized.add(record.patient_user_id);
      if (record.radiologist_user_id) authorized.add(record.radiologist_user_id);
      if (record.imaging_request_id) {
        const reqs = await svc.entities.ImagingRequest.filter({ id: record.imaging_request_id });
        const imagingRequest = reqs[0];
        if (imagingRequest) {
          if (imagingRequest.doctor_user_id) authorized.add(imagingRequest.doctor_user_id);
          for (const uid of imagingRequest.authorized_radiologist_user_ids || []) authorized.add(uid);
        }
      }
    } else if (kind === "radiology_record") {
      const rows = await svc.entities.RadiologyRecord.filter({ id: recordId });
      record = rows[0];
      if (!record) return Response.json({ error: "Record not found." }, { status: 404 });
      patientId = record.patient_id;
      allowedFiles = [record.file_url];
      if (record.patient_user_id) authorized.add(record.patient_user_id);
      if (record.radiologist_user_id) authorized.add(record.radiologist_user_id);
    } else {
      return Response.json({ error: "Unknown file kind." }, { status: 400 });
    }

    // Patient of the record (resolve via PatientProfile when the record has
    // no direct patient_user_id).
    if (patientId) {
      const patients = await svc.entities.PatientProfile.filter({ id: patientId });
      const patient = patients[0];
      if (patient && patient.user_id) {
        patientUserId = patient.user_id;
        authorized.add(patient.user_id);
      }
      // Approved doctors with access to this patient.
      for (const uid of await doctorUserIdsForPatient(svc, patientId)) authorized.add(uid);
      // The ordering doctor for lab requests (authorized without a full record access request).
      if (kind === "lab_request" && record.doctor_id) {
        const prof = await svc.entities.DoctorProfile.get(record.doctor_id);
        if (prof && prof.user_id) authorized.add(prof.user_id);
      }
      // The authorized laboratory and its technicians.
      if (kind === "lab_request" && record.lab_id) {
        const labs = await svc.entities.LaboratoryProfile.filter({ id: record.lab_id });
        if (labs[0] && labs[0].user_id) authorized.add(labs[0].user_id);
        const techs = await svc.entities.LabTechnician.filter({ laboratory_id: record.lab_id });
        for (const t of techs) {
          if (t.is_active !== false && t.laboratory_user_id) authorized.add(t.laboratory_user_id);
        }
      }
      if (kind === "lab_patient_visit" && record.laboratory_id) {
        const labs = await svc.entities.LaboratoryProfile.filter({ id: record.laboratory_id });
        if (labs[0] && labs[0].user_id) authorized.add(labs[0].user_id);
        const techs = await svc.entities.LabTechnician.filter({ laboratory_id: record.laboratory_id });
        for (const t of techs) {
          if (t.is_active !== false && t.laboratory_user_id) authorized.add(t.laboratory_user_id);
        }
      }
    }
    if (user.role === "admin") authorized.add(user.id);

    const granted = authorized.has(user.id) && allowedFiles.includes(fileUri) && !isPublicUrl(fileUri);

    // Audit every grant and denial of a clinical file access.
    try {
      await svc.entities.AccessAuditLog.create({
        patient_id: patientId || "",
        patient_user_id: patientUserId || "",
        doctor_id: "",
        doctor_name: "",
        action: granted ? `clinical_file_access_granted_${kind}` : `clinical_file_access_denied_${kind}`,
        datetime: new Date().toISOString(),
      });
    } catch (e) {
      // Never block the file flow on audit failure.
    }

    if (!granted) {
      return Response.json({ error: "You are not authorized to access this file." }, { status: 403 });
    }

    const { signed_url } = await svc.integrations.Core.CreateFileSignedUrl({
      file_uri: fileUri,
      expires_in: 600,
    });
    if (!signed_url) {
      return Response.json({ error: "Could not sign the file." }, { status: 500 });
    }
    return Response.json({ signed_url });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}