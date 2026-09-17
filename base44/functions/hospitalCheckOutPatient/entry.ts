import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { verifyReceptionistSession, touchReceptionistActivity, unauthorized } from "../../shared/hospitalAuth.ts";

// Hospital check-out. The receptionist who checked a patient in (or any
// receptionist of the same hospital) can also end the active visit — the
// exact mirror of the check-in flow. The check-in record keeps a complete
// auditable history: who ended the visit and exactly when. Ending the visit
// sets the record to COMPLETED, which locks clinical functions again until a
// new check-in.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const rec = await verifyReceptionistSession(base44, body.receptionist_id, body.session_token);
    if (!rec) return unauthorized();

    const patientId = String(body.patient_id || "");
    if (!patientId) {
      return Response.json({ error: "Patient is required." }, { status: 400 });
    }

    const active = await base44.asServiceRole.entities.HospitalCheckIn.filter({
      patient_id: patientId,
      hospital_id: rec.hospital_id,
      status: "active",
    });
    if (active.length === 0) {
      return Response.json({ error: "This patient is not checked in at your hospital." }, { status: 404 });
    }

    const now = new Date().toISOString();
    const checkout = await base44.asServiceRole.entities.HospitalCheckIn.update(active[0].id, {
      status: "completed",
      completed_datetime: now,
      completed_by_name: rec.full_name,
    });

    await touchReceptionistActivity(base44, rec.id);
    return Response.json({ status: "checked_out", checkout });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}