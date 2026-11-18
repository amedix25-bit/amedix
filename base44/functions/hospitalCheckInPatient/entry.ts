import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { verifyReceptionistSession, touchReceptionistActivity, unauthorized } from "../../shared/hospitalAuth.ts";
import { verifyTreatingDoctor, grantEncounterAccess } from "../../shared/patientAccess.ts";
import { generateClinicalRef, logClinicalAudit } from "../../shared/clinicalAudit.ts";

// Hospital check-in with automatic treating-doctor authorization.
//
// The receptionist enters the visit payment, selects the TREATING DOCTOR and
// confirms. The backend independently verifies the receptionist session, the
// hospital, the patient and the selected doctor (active association with THIS
// hospital, active and verified doctor account — the dropdown is never trusted),
// then saves the check-in, records the assigned doctor for the encounter and
// creates the patient-specific authorization for that doctor only.
//
// The patient never has to open their phone or approve anything: the authorized
// check-in IS the authorization. The patient can still remove that doctor's
// access at any time from their portal.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const rec = await verifyReceptionistSession(base44, body.receptionist_id, body.session_token);
    if (!rec) return unauthorized();

    const sr = base44.asServiceRole;
    const patientId = String(body.patient_id || "");
    const doctorId = String(body.doctor_id || "");
    const paymentAmount = String(body.payment_amount || "").trim();
    const paymentMethod = String(body.payment_method || "").trim();

    if (!patientId) return Response.json({ error: "Patient is required." }, { status: 400 });
    if (!doctorId) {
      return Response.json({ error: "Select the treating doctor before completing the check-in." }, { status: 400 });
    }
    if (!paymentAmount || isNaN(Number(paymentAmount)) || Number(paymentAmount) <= 0) {
      return Response.json({ error: "A valid payment amount is required before check-in." }, { status: 400 });
    }
    if (!paymentMethod) {
      return Response.json({ error: "A payment method is required before check-in." }, { status: 400 });
    }

    const patients = await sr.entities.PatientProfile.filter({ id: patientId });
    if (patients.length === 0) return Response.json({ error: "Patient not found." }, { status: 404 });
    const p = patients[0];

    const hospitals = await sr.entities.HospitalProfile.filter({ id: rec.hospital_id });
    if (hospitals.length === 0) return Response.json({ error: "Hospital not found." }, { status: 404 });
    const h = hospitals[0];

    const methods =
      Array.isArray(h.payment_methods) && h.payment_methods.length > 0
        ? h.payment_methods
        : ["Cash", "Card", "Bank Transfer"];
    if (!methods.includes(paymentMethod)) {
      return Response.json({ error: "Invalid payment method." }, { status: 400 });
    }

    // The selected doctor is re-verified here, server-side.
    const verified = await verifyTreatingDoctor(base44, h.id, doctorId);
    if (!verified.ok) {
      await logClinicalAudit(sr, {
        actor_user_id: "",
        actor_name: rec.full_name || "",
        actor_role: "hospital_receptionist",
        action: "checkin_doctor_rejected",
        action_label: `check-in blocked: selected doctor refused (${verified.reason})`,
        patient_id: p.id,
        patient_cin: p.cin || "",
        patient_name: p.full_name || "",
        hospital: h.hospital_name || "",
      });
      return Response.json({ error: verified.reason }, { status: 403 });
    }
    const doctor = verified.doctor;

    // Duplicate check-ins for the same patient and hospital visit are
    // prevented — the active visit must be ended before a new one is allowed.
    const active = await sr.entities.HospitalCheckIn.filter({
      patient_id: p.id,
      hospital_id: rec.hospital_id,
      status: "active",
    });
    if (active.length > 0) {
      return Response.json(
        { error: "This patient is already checked in at your hospital. Check the patient out before starting a new visit." },
        { status: 409 }
      );
    }

    const now = new Date();
    const encounterRef = generateClinicalRef("VIS");
    const record = await sr.entities.HospitalCheckIn.create({
      patient_id: p.id,
      patient_cin: p.cin,
      patient_name: p.full_name,
      patient_dob: p.date_of_birth || "",
      patient_gender: p.gender || "",
      hospital_id: h.id,
      hospital_name: h.hospital_name,
      hospital_user_id: h.user_id,
      receptionist_id: rec.id,
      receptionist_name: rec.full_name,
      encounter_ref: encounterRef,
      assigned_doctor_id: doctor.id,
      assigned_doctor_user_id: doctor.user_id || "",
      assigned_doctor_name: doctor.full_name || "",
      assigned_doctor_specialty: doctor.specialization || "",
      assigned_doctor_title: verified.title || "",
      access_status: "none",
      assignment_history: [
        {
          action: "assigned",
          doctor_id: doctor.id,
          doctor_name: doctor.full_name || "",
          by_name: rec.full_name || "",
          by_role: "hospital_receptionist",
          reason: "Treating doctor selected at check-in.",
          datetime: now.toISOString(),
        },
      ],
      checkin_datetime: now.toISOString(),
      checkin_date: now.toISOString().slice(0, 10),
      checkin_time: now.toTimeString().slice(0, 5),
      payment_amount: paymentAmount,
      payment_method: paymentMethod,
      status: "active",
    });

    // Race guard: two simultaneous submissions can both pass the pre-check.
    const activeNow = await sr.entities.HospitalCheckIn.filter({
      patient_id: p.id,
      hospital_id: rec.hospital_id,
      status: "active",
    });
    if (activeNow.length > 1) {
      await sr.entities.HospitalCheckIn.delete(record.id);
      return Response.json(
        { error: "This patient is already checked in at your hospital. Check the patient out before starting a new visit." },
        { status: 409 }
      );
    }

    // Automatic, patient-specific authorization for the selected doctor only.
    const grant = await grantEncounterAccess(base44, {
      patient: p,
      doctor,
      hospital: h,
      receptionist: rec,
      checkinId: record.id,
      encounterRef,
      title: verified.title || "",
    });
    const access = grant.request;

    const checkin = await sr.entities.HospitalCheckIn.update(record.id, {
      access_request_id: access.id,
      access_status: "granted",
      access_granted_datetime: access.granted_datetime || now.toISOString(),
      access_expires_datetime: access.expires_datetime || "",
    });

    await logClinicalAudit(sr, {
      actor_user_id: "",
      actor_name: rec.full_name || "",
      actor_role: "hospital_receptionist",
      action: "checkin_access_granted",
      action_label: `checked the patient in and granted Dr. ${doctor.full_name || ""} access for this visit (${encounterRef})`,
      patient_id: p.id,
      patient_user_id: p.user_id || "",
      patient_cin: p.cin || "",
      patient_name: p.full_name || "",
      encounter_id: record.id,
      hospital: h.hospital_name || "",
    });

    // The doctor is told straight away that this patient is assigned to them.
    try {
      await sr.entities.DoctorNotification.create({
        doctor_user_id: doctor.user_id || "",
        doctor_id: doctor.id,
        type: "patient_access_granted",
        title: "Patient Assigned to You",
        message: `${p.full_name || "A patient"} was checked in at ${h.hospital_name || "your hospital"}. You can open their record now.`,
        patient_id: p.id,
        patient_name: p.full_name || "",
        patient_cin: p.cin || "",
        related_id: access.id,
        is_read: false,
        datetime: now.toISOString(),
      });
    } catch (e) {
      /* notification only — the authorization is already recorded */
    }

    await touchReceptionistActivity(base44, rec.id);

    return Response.json({
      status: "checked_in",
      checkin,
      doctor_name: doctor.full_name || "",
      access_status: "granted",
      access_expires_datetime: access.expires_datetime || "",
      encounter_ref: encounterRef,
      message: `Patient checked in successfully. Access granted to Dr. ${doctor.full_name || ""}.`,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}