import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { findActiveCheckIn, gateBlocked } from "../../shared/hospitalAuth.ts";
import { logClinicalAudit } from "../../shared/clinicalAudit.ts";
import { createPatientNotification } from "../../shared/patientNotifications.ts";

// Electronic prescription issue with the mandatory check-in gate. The backend
// independently verifies that an active check-in exists for this patient at
// the doctor's hospital BEFORE the prescription is created — same security
// model as encounters, clinical notes, lab and imaging requests.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const payload = body && typeof body === "object" ? body : {};
    if (!payload.patient_id || !payload.doctor_id || !payload.medication_name) {
      return Response.json({ error: "Patient, doctor and medication name are required." }, { status: 400 });
    }

    let doctors = [];
    try {
      doctors = await base44.asServiceRole.entities.DoctorProfile.filter({ id: String(payload.doctor_id) });
    } catch (e) { doctors = []; }
    if (doctors.length === 0 || doctors[0].user_id !== user.id) {
      return Response.json({ error: "Doctor profile not found." }, { status: 403 });
    }
    const doctor = doctors[0];

    const checkin = await findActiveCheckIn(base44, payload.patient_id, doctor.hospital);
    if (!checkin) return gateBlocked();

    // Idempotency: an identical prescription_id already persisted (replayed or
    // retried submission) is rejected instead of creating a duplicate.
    if (payload.prescription_id) {
      try {
        const dupes = await base44.asServiceRole.entities.Prescription.filter(
          { prescription_id: String(payload.prescription_id) },
          { limit: 1 }
        );
        if ((dupes.items || dupes).length > 0) {
          return Response.json({ error: "Duplicate submission — this prescription was already saved.", duplicate: true }, { status: 409 });
        }
      } catch (e) { console.log("DUPCHECK-ERROR:", e && e.message); }
    }

    // Patient identity travels from the unified AMedix Patient Record — the
    // doctor never types it.
    let patient = null;
    try {
      const profiles = await base44.asServiceRole.entities.PatientProfile.filter({ id: String(payload.patient_id) }, { limit: 1 });
      patient = (profiles.items || profiles)[0] || null;
    } catch (e) { patient = null; }
    if (!patient) {
      return Response.json({ error: "Patient profile not found." }, { status: 404 });
    }

    const now = new Date();
    const prescription = await base44.asServiceRole.entities.Prescription.create({
      ...payload,
      patient_user_id: patient.user_id || "",
      patient_cin: patient.cin || payload.patient_cin || "",
      patient_name: patient.full_name || payload.patient_name || "",
      patient_dob: patient.date_of_birth || payload.patient_dob || "",
      doctor_user_id: user.id,
      doctor_name: doctor.full_name,
      doctor_specialization: doctor.specialization || "",
      doctor_hospital: doctor.hospital || "",
      date_prescribed: payload.date_prescribed || now.toISOString().slice(0, 10),
      prescribed_datetime: now.toISOString(),
      // Medication safety check record: the alerts raised, the doctor's
      // decision and any justified-decision note, stored verbatim.
      ...(payload.safety_check && typeof payload.safety_check === "object"
        ? { safety_check: payload.safety_check }
        : {}),
      status: "issued",
    });

    await logClinicalAudit(base44, {
      actor_user_id: user.id,
      actor_name: doctor.full_name,
      actor_role: "doctor",
      action: "issued_prescription",
      action_label: "issued an electronic prescription",
      patient_id: String(payload.patient_id),
      patient_cin: prescription.patient_cin || "",
      patient_name: prescription.patient_name || "",
      hospital: doctor.hospital || "",
    });

    await createPatientNotification(base44.asServiceRole, {
      patient_id: prescription.patient_id,
      type: "medication_update",
      title: `New Prescription from ${doctor.full_name || "your doctor"}`,
      message:
        `${doctor.full_name || "Your doctor"} prescribed ${prescription.medication_name}` +
        `${prescription.strength ? ` ${prescription.strength}` : ""}.` +
        " Open Prescriptions to choose a pharmacy that has it in stock.",
      target: "prescriptions",
      related_id: prescription.id,
    });

    return Response.json({ prescription, checkin_id: checkin.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}