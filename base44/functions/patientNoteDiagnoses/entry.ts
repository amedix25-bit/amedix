import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Patient-facing clinical note feed that returns ONLY the diagnosis recorded
// on each note. Doctors' clinical notes themselves (history, examination,
// management, prescriptions, PDFs) are never exposed to patients — the
// ClinicalNote entity is RLS-locked to doctors/admin, and this function is
// the patients' only read path.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const patientId = String(body.patient_id || "");
    if (!patientId) return Response.json({ error: "patient_id is required." }, { status: 400 });

    const svc = base44.asServiceRole;
    const profiles = await svc.entities.PatientProfile.filter({ id: patientId });
    const patient = profiles[0];
    if (!patient) return Response.json({ error: "Patient not found." }, { status: 404 });
    // Only the patient's own account may read their diagnosis feed.
    if (patient.user_id !== user.id) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const filter = { patient_id: patientId };
    if (body.encounter_id) filter.encounter_id = String(body.encounter_id);
    const notes = await svc.entities.ClinicalNote.filter(filter, "-date", 500);

    return Response.json({
      notes: notes.map((n) => ({
        id: n.id,
        date: n.date,
        encounter_id: n.encounter_id,
        doctor_name: n.doctor_name,
        document_type_label: n.document_type_label || "",
        diagnosis: n.diagnosis || "",
      })),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}