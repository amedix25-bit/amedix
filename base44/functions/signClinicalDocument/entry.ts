import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { logClinicalAudit } from "../../shared/clinicalAudit.ts";

// Digital signature workflow. Signing freezes the document version: it
// records who signed and exactly when, and stores the PDF version in the
// patient's Clinical Notes/Documents. A signed version can never be edited or
// overwritten — corrections create a new version via amendClinicalDocument.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const payload = body && typeof body === "object" ? body : {};
    if (!payload.document_record_id || !payload.pdf_url) {
      return Response.json({ error: "Document and its PDF are required." }, { status: 400 });
    }

    let document = null;
    try {
      const found = await base44.asServiceRole.entities.ClinicalDocument.filter({ id: String(payload.document_record_id) });
      document = found[0] || null;
    } catch (e) {
      document = null;
    }
    if (!document) return Response.json({ error: "Document not found." }, { status: 404 });
    if (document.doctor_user_id !== user.id) {
      return Response.json({ error: "Only the authoring doctor can sign this document." }, { status: 403 });
    }
    if (document.status === "signed") {
      return Response.json({ error: "This version is already signed." }, { status: 400 });
    }

    const now = new Date();
    const updated = await base44.asServiceRole.entities.ClinicalDocument.update(document.id, {
      status: "signed",
      signed_by_name: document.doctor_name || "",
      signed_datetime: now.toISOString(),
      pdf_url: String(payload.pdf_url),
    });

    await logClinicalAudit(base44, {
      actor_user_id: user.id,
      actor_name: document.doctor_name,
      actor_role: "doctor",
      action: "signed_clinical_document",
      action_label: `electronically signed a clinical document (${document.document_type_label || document.document_type})`,
      patient_id: document.patient_id,
      patient_cin: document.patient_cin,
      patient_name: document.patient_name,
      encounter_id: document.encounter_id,
      document_id: document.document_id,
      hospital: document.hospital,
      department: document.department,
    });

    return Response.json({ document: updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}