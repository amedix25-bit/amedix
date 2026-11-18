import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { partitionOwnedRecords, logOwnershipDenial } from "../../shared/patientOwnership.ts";
import { findLiveAccess } from "../../shared/patientAccess.ts";

// Doctor-side clinical data refresh for a patient. PERMISSIONS AND ACCESS
// CONTROL: the backend verifies the signed-in user owns a DoctorProfile AND
// holds an approved patient access request before ANY clinical record data is
// returned. This is the plain data-refresh endpoint behind already-audited
// views — it writes no audit entry of its own.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const patientId = String((body && body.patient_id) || "");
    if (!patientId) return Response.json({ error: "Patient is required." }, { status: 400 });

    const doctors = await base44.asServiceRole.entities.DoctorProfile.filter({ user_id: user.id });
    const doctor = doctors[0] || null;
    if (!doctor) return Response.json({ error: "Doctor profile not found." }, { status: 403 });

    // Access is re-checked on EVERY request: an approved authorization that has
    // expired, or that the patient removed, refuses immediately.
    const access = await findLiveAccess(base44, doctor.id, patientId);
    if (!access) {
      return Response.json(
        {
          error:
            "Your authorization to this patient's record is no longer active. The visit may have ended, or the patient removed your access.",
        },
        { status: 403 }
      );
    }

    const patients = await base44.asServiceRole.entities.PatientProfile.filter({ id: patientId });
    if (patients.length === 0) return Response.json({ error: "Patient not found." }, { status: 404 });
    const patient = patients[0];

    const sr = base44.asServiceRole;
    const pull = async (entity, sort, limit) => {
      try {
        const items = await entity.filter({ patient_id: patient.id }, sort, limit);
        return items;
      } catch (e) {
        return [];
      }
    };

    const [
      medical_history, medical_events, conditions, surgical, family_history, allergies,
      medications, examinations, notes, diagnoses, documents,
      clinical_documents_raw, encounters, consents, imaging, lab_results, lab_requests,
    ] = await Promise.all([
      pull(sr.entities.MedicalHistoryEntry, "-created_date", 300),
      pull(sr.entities.MedicalHistoryEvent, "-created_date", 200),
      pull(sr.entities.MedicalCondition, "-created_date", 300),
      pull(sr.entities.SurgicalHistory, "-created_date", 200),
      pull(sr.entities.FamilyHistory, "-created_date", 200),
      pull(sr.entities.Allergy, "-created_date", 200),
      pull(sr.entities.Medication, "-created_date", 300),
      pull(sr.entities.PatientExamination, "-created_datetime", 300),
      pull(sr.entities.ClinicalNote, "-date", 500),
      pull(sr.entities.Diagnosis, "-created_datetime", 300),
      pull(sr.entities.MedicalDocument, "-created_date", 300),
      pull(sr.entities.ClinicalDocument, "-created_datetime", 500),
      pull(sr.entities.Encounter, "-encounter_datetime", 200),
      pull(sr.entities.Consent, "-consent_datetime", 200),
      pull(sr.entities.ImagingRequest, "-created_date", 200),
      pull(sr.entities.PatientLabResult, "-test_date", 200),
      pull(sr.entities.LabRequest, "-created_date", 100),
    ]);

    // PATIENT ISOLATION: every row must be proven to belong to THIS patient —
    // its patient id must resolve to this profile and its CIN / account must
    // match that profile. A row that cannot be proven is never returned, so a
    // mislinked record can never surface under another patient's profile.
    const refusals = [];
    const scope = (rows) => {
      const { owned, refused } = partitionOwnedRecords(patient, rows || []);
      refusals.push(...refused.map((r) => ({ ...r, list: "" })));
      return owned;
    };
    const scoped = {
      medical_history: scope(medical_history),
      medical_events: scope(medical_events),
      conditions: scope(conditions),
      surgical: scope(surgical),
      family_history: scope(family_history),
      allergies: scope(allergies),
      medications: scope(medications),
      examinations: scope(examinations),
      notes: scope(notes),
      diagnoses: scope(diagnoses),
      documents: scope(documents),
      encounters: scope(encounters),
      consents: scope(consents),
      imaging: scope(imaging),
      lab_results: scope(lab_results),
      lab_requests: scope(lab_requests),
    };

    // Restricted/confidential documents are only accessible to their
    // authoring doctor — the service role bypasses RLS, so filter here.
    const clinical_documents = scope(clinical_documents_raw).filter(
      (d) => !d.is_confidential || d.doctor_user_id === user.id
    );

    if (refusals.length > 0) {
      await logOwnershipDenial(base44, {
        user,
        actor_role: "doctor",
        module: "doctorPatientMedicalData",
        expected_patient_id: patient.id,
        reason: `refused ${refusals.length} record(s): ${[...new Set(refusals.map((r) => r.reason))].join(", ")}`,
        hospital: doctor.hospital || "",
      });
    }

    return Response.json({
      ...scoped,
      integrity: { refused_count: refusals.length, refused_ids: refusals.map((r) => r.id) },
      patient: {
        id: patient.id,
        cin: patient.cin,
        full_name: patient.full_name,
        user_id: patient.user_id,
        allergy_record_status: patient.allergy_record_status || "",
      },
      clinical_documents,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}