import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { logClinicalAudit } from "../../shared/clinicalAudit.ts";
import { findLiveAccess } from "../../shared/patientAccess.ts";

// The longitudinal patient record — server-side assembly of the patient's
// complete clinical history (encounters, clinical documents, consents) for a
// doctor. PERMISSIONS AND ACCESS CONTROL: the backend verifies the signed-in
// doctor owns the profile AND holds an approved patient access request —
// doctors never automatically see all patient information. Every read is
// recorded in the clinical audit log ("viewed patient record").
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const payload = body && typeof body === "object" ? body : {};
    if (!payload.patient_id || !payload.doctor_id) {
      return Response.json({ error: "Patient and doctor are required." }, { status: 400 });
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

    // Role-based, permission-based access: a LIVE approved authorization is
    // required before any patient information is returned — one that has
    // expired or been removed by the patient refuses immediately.
    const access = await findLiveAccess(base44, doctor.id, String(payload.patient_id));
    if (!access) {
      return Response.json(
        {
          error:
            "Your authorization to this patient's record is no longer active. The visit may have ended, or the patient removed your access.",
        },
        { status: 403 }
      );
    }

    const patients = await base44.asServiceRole.entities.PatientProfile.filter({ id: String(payload.patient_id) });
    if (patients.length === 0) return Response.json({ error: "Patient not found." }, { status: 404 });
    const patient = patients[0];

    const [encounters, allDocuments, consents] = await Promise.all([
      base44.asServiceRole.entities.Encounter.filter({ patient_id: patient.id }, "-encounter_datetime", 200),
      base44.asServiceRole.entities.ClinicalDocument.filter({ patient_id: patient.id }, "-created_datetime", 500),
      base44.asServiceRole.entities.Consent.filter({ patient_id: patient.id }, "-consent_datetime", 200),
    ]);
    // Restricted/confidential documents (e.g. psychiatric records) are only
    // accessible to their authoring doctor — the service role bypasses Row
    // Level Security, so they are filtered out of every other doctor's view.
    const documents = allDocuments.filter(
      (d) => !d.is_confidential || d.doctor_user_id === user.id
    );

    await logClinicalAudit(base44, {
      actor_user_id: user.id,
      actor_name: doctor.full_name,
      actor_role: "doctor",
      action: "viewed_patient_record",
      action_label: "viewed patient record",
      patient_id: patient.id,
      patient_cin: patient.cin,
      patient_name: patient.full_name,
      hospital: doctor.hospital || "",
    });

    return Response.json({ patient, encounters, documents, consents });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}