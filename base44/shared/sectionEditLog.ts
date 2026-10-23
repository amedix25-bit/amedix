// Shared helper: records who edited a section of the patient's My Health
// history. Both portals show the latest entry as "Dr. <name> edited <datetime>".
export async function logSectionEdit(base44, patient, section, doctor, summary) {
  await base44.asServiceRole.entities.HealthSectionEdit.create({
    patient_id: patient.id,
    patient_user_id: patient.user_id,
    patient_cin: patient.cin,
    patient_name: patient.full_name,
    section,
    actor_user_id: doctor.user_id,
    actor_name: doctor.full_name,
    actor_role: "doctor",
    datetime: new Date().toISOString(),
    summary: summary || "",
  });
}