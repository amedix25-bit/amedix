import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { verifyReceptionistSession, touchReceptionistActivity, unauthorized } from "../../shared/hospitalAuth.ts";

// Hospital check-in. The receptionist enters the payment amount and method
// for the visit — both are required before the check-in can be completed. The
// record stores the hospital, patient, receptionist, date, time, amount and
// payment method for a complete auditable history, and its ACTIVE status is
// the security gate that unlocks clinical functions at this hospital.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const rec = await verifyReceptionistSession(base44, body.receptionist_id, body.session_token);
    if (!rec) return unauthorized();

    const patientId = String(body.patient_id || "");
    const paymentAmount = String(body.payment_amount || "").trim();
    const paymentMethod = String(body.payment_method || "").trim();
    if (!patientId) {
      return Response.json({ error: "Patient is required." }, { status: 400 });
    }
    if (!paymentAmount || isNaN(Number(paymentAmount)) || Number(paymentAmount) <= 0) {
      return Response.json({ error: "A valid payment amount is required before check-in." }, { status: 400 });
    }
    if (!paymentMethod) {
      return Response.json({ error: "A payment method is required before check-in." }, { status: 400 });
    }

    const patients = await base44.asServiceRole.entities.PatientProfile.filter({ id: patientId });
    if (patients.length === 0) {
      return Response.json({ error: "Patient not found." }, { status: 404 });
    }
    const p = patients[0];

    const hospitals = await base44.asServiceRole.entities.HospitalProfile.filter({ id: rec.hospital_id });
    if (hospitals.length === 0) {
      return Response.json({ error: "Hospital not found." }, { status: 404 });
    }
    const h = hospitals[0];
    const methods =
      Array.isArray(h.payment_methods) && h.payment_methods.length > 0
        ? h.payment_methods
        : ["Cash", "Card", "Bank Transfer"];
    if (!methods.includes(paymentMethod)) {
      return Response.json({ error: "Invalid payment method." }, { status: 400 });
    }

    // Duplicate check-ins for the same patient and hospital visit are
    // prevented — only a hospital administrator can end the active visit to
    // allow a new one.
    const active = await base44.asServiceRole.entities.HospitalCheckIn.filter({
      patient_id: p.id,
      hospital_id: rec.hospital_id,
      status: "active",
    });
    if (active.length > 0) {
      return Response.json(
        { error: "This patient is already checked in at your hospital. The hospital administrator must end the active visit before a new check-in." },
        { status: 409 }
      );
    }

    const now = new Date();
    const record = await base44.asServiceRole.entities.HospitalCheckIn.create({
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
      checkin_datetime: now.toISOString(),
      checkin_date: now.toISOString().slice(0, 10),
      checkin_time: now.toTimeString().slice(0, 5),
      payment_amount: paymentAmount,
      payment_method: paymentMethod,
      status: "active",
    });

    // Race guard: two simultaneous submissions can both pass the pre-check.
    // Re-verifying after creation closes that window — if another active
    // check-in won, this one is undone.
    const activeNow = await base44.asServiceRole.entities.HospitalCheckIn.filter({
      patient_id: p.id,
      hospital_id: rec.hospital_id,
      status: "active",
    });
    if (activeNow.length > 1) {
      await base44.asServiceRole.entities.HospitalCheckIn.delete(record.id);
      return Response.json(
        { error: "This patient is already checked in at your hospital. The hospital administrator must end the active visit before a new check-in." },
        { status: 409 }
      );
    }

    await touchReceptionistActivity(base44, rec.id);
    return Response.json({ status: "checked_in", checkin: record });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}