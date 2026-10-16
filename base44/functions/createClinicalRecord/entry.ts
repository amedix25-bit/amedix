import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { findActiveCheckIn, gateBlocked } from "../../shared/hospitalAuth.ts";

// The check-in-gated clinical record creator. Examinations, prescribed
// medications and diagnoses are ONLY written through this function: the
// backend independently verifies an ACTIVE check-in for the patient at the
// doctor's current hospital before anything is saved — no frontend state, URL
// or crafted request can bypass the gate (direct entity writes are blocked by
// Row Level Security). Patients may add their own reported medications in
// patient mode — verified against their own PatientProfile, no check-in
// needed because it is their own record.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const kind = String((body && body.kind) || "");
    const patientId = String((body && body.patient_id) || "");
    const record = body && typeof body.record === "object" && body.record !== null ? body.record : null;
    if (!kind || !patientId || !record) {
      return Response.json({ error: "Kind, patient and record are required." }, { status: 400 });
    }

    const [doctors, patients] = await Promise.all([
      base44.asServiceRole.entities.DoctorProfile.filter({ user_id: user.id }),
      base44.asServiceRole.entities.PatientProfile.filter({ id: patientId }),
    ]);
    const patient = patients[0] || null;
    if (!patient) return Response.json({ error: "Patient not found." }, { status: 404 });

    const doctor = doctors[0] || null;
    const isPatient = patient.user_id === user.id;

    // Patient mode — the patient adds their own reported medication.
    if (isPatient && kind === "medication" && !doctor) {
      const med = await base44.asServiceRole.entities.Medication.create({
        ...record,
        patient_id: patient.id,
        patient_user_id: patient.user_id,
        patient_cin: patient.cin,
        patient_name: patient.full_name,
        source: "patient_reported",
      });
      return Response.json({ record_id: med.id });
    }

    if (!doctor) {
      return Response.json({ error: "Not authorized to write clinical records for this patient." }, { status: 403 });
    }

    // Doctor mode — the mandatory check-in security gate.
    const checkin = await findActiveCheckIn(base44, patient.id, doctor.hospital);
    if (!checkin) return gateBlocked();

    if (kind === "examination") {
      const exam = await base44.asServiceRole.entities.PatientExamination.create({
        ...record,
        patient_id: patient.id,
        patient_user_id: patient.user_id,
        patient_cin: patient.cin,
        patient_name: patient.full_name,
        doctor_user_id: user.id,
      });
      return Response.json({ record_id: exam.id });
    }

    if (kind === "medication") {
      const med = await base44.asServiceRole.entities.Medication.create({
        ...record,
        patient_id: patient.id,
        patient_user_id: patient.user_id,
        patient_cin: patient.cin,
        patient_name: patient.full_name,
        source: record.source || "doctor_prescribed",
      });
      return Response.json({ record_id: med.id });
    }

    if (kind === "diagnosis") {
      // Duplicate guard — same patient, same diagnosis name and type.
      const nameKeyRaw = String(record.diagnosis_name || "").trim().toLowerCase();
      const existingDiags = await base44.asServiceRole.entities.Diagnosis.filter({ patient_id: patient.id });
      const duplicate = existingDiags.some(
        (d) => (d.diagnosis_name || "").trim().toLowerCase() === nameKeyRaw && d.diagnosis_type === record.diagnosis_type
      );
      if (duplicate) {
        return Response.json(
          { error: "This diagnosis (same name and type) has already been recorded for this patient." },
          { status: 409 }
        );
      }
      const diag = await base44.asServiceRole.entities.Diagnosis.create({
        ...record,
        patient_id: patient.id,
        patient_user_id: patient.user_id,
        patient_cin: patient.cin,
        patient_name: patient.full_name,
        doctor_id: doctor.id,
      });
      // Known-case entry in the patient's medical history — only when the
      // same condition is not already recorded there.
      const nameKey = String(record.diagnosis_name || "").trim().toLowerCase();
      if (nameKey) {
        const conditions = await base44.asServiceRole.entities.MedicalCondition.filter({ patient_id: patient.id });
        if (!conditions.some((c) => String(c.name || "").trim().toLowerCase() === nameKey)) {
          await base44.asServiceRole.entities.MedicalCondition.create({
            patient_id: patient.id,
            patient_user_id: patient.user_id,
            patient_cin: patient.cin,
            patient_name: patient.full_name,
            name: String(record.diagnosis_name || "").trim(),
            category: "known_case",
            details: [record.diagnosis_type, record.assessment || record.description]
              .filter(Boolean)
              .join(" — "),
            date: new Date().toISOString().slice(0, 10),
          });
        }
      }
      return Response.json({ record_id: diag.id });
    }

    return Response.json({ error: "Unknown record kind." }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}