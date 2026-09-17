import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { verifyReceptionistSession, touchReceptionistActivity, unauthorized } from "../../shared/hospitalAuth.ts";

// Receptionist patient lookup by CIN. The receptionist role is strictly
// limited: this whitelist of reception demographics is the ONLY data returned.
// No medical history, diagnoses, medications, allergies, clinical notes,
// laboratory or imaging results ever leave this function for a receptionist.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const rec = await verifyReceptionistSession(base44, body.receptionist_id, body.session_token);
    if (!rec) return unauthorized();

    const cin = String(body.cin || "").trim().toUpperCase();
    if (!cin || cin.length > 30) {
      return Response.json({ error: "A patient CIN is required." }, { status: 400 });
    }

    const patients = await base44.asServiceRole.entities.PatientProfile.filter({ cin });
    if (patients.length === 0) {
      return Response.json({ error: "No patient found with this CIN." }, { status: 404 });
    }
    const p = patients[0];

    const demographics = {
      patient_id: p.id,
      cin: p.cin,
      full_name: p.full_name,
      date_of_birth: p.date_of_birth || "",
      gender: p.gender || "",
      phone: p.phone || "",
      nationality: p.nationality || "",
      address: p.address || "",
    };

    const hospitals = await base44.asServiceRole.entities.HospitalProfile.filter({ id: rec.hospital_id });
    const payment_methods =
      hospitals.length > 0 && Array.isArray(hospitals[0].payment_methods) && hospitals[0].payment_methods.length > 0
        ? hospitals[0].payment_methods
        : ["Cash", "Card", "Bank Transfer"];

    // Duplicate check-in prevention — an active visit at this hospital blocks a
    // new one until the active visit is ended (receptionist check-out).
    const active = await base44.asServiceRole.entities.HospitalCheckIn.filter({
      patient_id: p.id,
      hospital_id: rec.hospital_id,
      status: "active",
    });

    await touchReceptionistActivity(base44, rec.id);
    return Response.json({
      patient: demographics,
      payment_methods,
      already_checked_in: active.length > 0,
      active_checkin: active[0] || null,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}