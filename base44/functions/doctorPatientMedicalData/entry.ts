import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

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

    const accessReqs = await base44.asServiceRole.entities.AccessRequest.filter({
      doctor_id: doctor.id,
      patient_id: patientId,
      status: "approved",
    });
    if (accessReqs.length === 0) {
      return Response.json(
        { error: "You do not have authorized access to this patient's record." },
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
      medical_history, conditions, surgical, family_history, allergies,
      medications, examinations, notes, diagnoses, documents,
      clinical_documents_raw, encounters, consents, imaging, lab_results, lab_requests,
    ] = await Promise.all([
      pull(sr.entities.MedicalHistoryEntry, "-created_date", 300),
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

    // Restricted/confidential documents are only accessible to their
    // authoring doctor — the service role bypasses RLS, so filter here.
    const clinical_documents = clinical_documents_raw.filter(
      (d) => !d.is_confidential || d.doctor_user_id === user.id
    );

    return Response.json({
      patient: {
        id: patient.id,
        cin: patient.cin,
        full_name: patient.full_name,
        user_id: patient.user_id,
        allergy_record_status: patient.allergy_record_status || "",
      },
      medical_history,
      conditions,
      surgical,
      family_history,
      allergies,
      medications,
      examinations,
      notes,
      diagnoses,
      documents,
      clinical_documents,
      encounters,
      consents,
      imaging,
      lab_results,
      lab_requests,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}