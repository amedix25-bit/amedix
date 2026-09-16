import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { findActiveCheckIn, gateBlocked } from "../../shared/hospitalAuth.ts";
import { generateClinicalRef, logClinicalAudit } from "../../shared/clinicalAudit.ts";

// Clinical note creation with the mandatory check-in gate. The backend
// independently verifies that an active check-in exists for this patient at
// the doctor's hospital BEFORE the note is created — no frontend state, URL
// or crafted request can bypass it.
//
// UNIVERSAL INFORMATION STAYS CONNECTED: the backend auto-attaches the
// AMedix universal context to every note — patient name, CIN, date of birth,
// allergies, active medications, previous history, doctor, specialty,
// hospital, department, the encounter the note belongs to (an active
// encounter is reused, or one is opened automatically), an AMedix note
// reference and the doctor's electronic signature. The doctor never
// re-enters any of it manually; only the specialty-specific clinical content
// comes from the form.
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

    // The doctor profile must belong to the signed-in user.
    const doctors = await base44.asServiceRole.entities.DoctorProfile.filter({ id: String(payload.doctor_id) });
    if (doctors.length === 0 || doctors[0].user_id !== user.id) {
      return Response.json({ error: "Doctor profile not found." }, { status: 403 });
    }
    const doctor = doctors[0];

    const checkin = await findActiveCheckIn(base44, payload.patient_id, doctor.hospital);
    if (!checkin) return gateBlocked();

    const patients = await base44.asServiceRole.entities.PatientProfile.filter({ id: String(payload.patient_id) });
    if (patients.length === 0) return Response.json({ error: "Patient not found." }, { status: 404 });
    const patient = patients[0];

    // Universal clinical context — snapshotted from the unified AMedix
    // Patient Record at note time so every note is self-contained and stays
    // connected to the same patient record.
    const [activeMeds, conditions, encounters] = await Promise.all([
      base44.asServiceRole.entities.Medication.filter({ patient_id: patient.id, is_active: true }).catch(() => []),
      base44.asServiceRole.entities.MedicalCondition.filter({ patient_id: patient.id }).catch(() => []),
      base44.asServiceRole.entities.Encounter.filter(
        { patient_id: patient.id, doctor_id: doctor.id, status: "active" },
        "-encounter_datetime",
        1
      ).catch(() => []),
    ]);

    // The note automatically belongs to the correct encounter: the doctor's
    // active encounter for this patient, or a new one opened automatically.
    let encounter = encounters[0] || null;
    if (!encounter) {
      const now = new Date();
      encounter = await base44.asServiceRole.entities.Encounter.create({
        encounter_id: generateClinicalRef("ENC"),
        patient_id: patient.id,
        patient_user_id: patient.user_id || "",
        patient_cin: patient.cin || "",
        patient_name: patient.full_name || "",
        patient_dob: patient.date_of_birth || "",
        hospital: doctor.hospital || "",
        hospital_user_id: checkin.hospital_user_id || "",
        department: doctor.specialization || "",
        doctor_id: doctor.id,
        doctor_user_id: user.id,
        doctor_name: doctor.full_name || "",
        doctor_specialty: doctor.specialization || "",
        encounter_type: "consultation",
        status: "active",
        chief_complaint: String(payload.diagnosis || ""),
        encounter_datetime: now.toISOString(),
        encounter_date: now.toISOString().slice(0, 10),
        encounter_time: now.toISOString().slice(11, 16),
      });
    }

    // Prescribed medications ride along with the note; the note and the
    // medications are written server-side (service role) — direct client-side
    // writes are blocked by Row Level Security.
    const { medications, ...notePayload } = payload;
    const now = new Date();
    notePayload.patient_id = patient.id;
    notePayload.patient_cin = patient.cin || "";
    notePayload.patient_name = patient.full_name || "";
    notePayload.patient_dob = patient.date_of_birth || "";
    notePayload.doctor_name = doctor.full_name || "";
    notePayload.hospital = doctor.hospital || "";
    notePayload.department = doctor.specialization || "";
    notePayload.encounter_id = encounter.encounter_id || "";
    notePayload.note_reference = generateClinicalRef("CN");
    notePayload.allergies = patient.allergies || "";
    notePayload.current_medications = activeMeds.map((m) => m.name).filter(Boolean);
    notePayload.previous_history = conditions.map((c) => c.name).filter(Boolean).join("; ");
    // Saving the note applies the doctor's electronic signature automatically.
    notePayload.signed_by_name = doctor.full_name || "";
    notePayload.signed_datetime = now.toISOString();
    const note = await base44.asServiceRole.entities.ClinicalNote.create(notePayload);

    const meds = Array.isArray(medications) ? medications : [];
    if (meds.length > 0) {
      await base44.asServiceRole.entities.Medication.bulkCreate(
        meds.map((m) => ({ ...m, patient_user_id: patient.user_id || "" }))
      );
    }

    await logClinicalAudit(base44, {
      actor_user_id: user.id,
      actor_name: doctor.full_name,
      actor_role: "doctor",
      action: "created_clinical_note",
      action_label: "created a clinical note",
      patient_id: patient.id,
      patient_cin: patient.cin,
      patient_name: patient.full_name,
      encounter_id: encounter.encounter_id || "",
      hospital: doctor.hospital || "",
      department: doctor.specialization || "",
    });

    return Response.json({ note, checkin_id: checkin.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}