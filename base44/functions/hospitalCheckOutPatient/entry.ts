import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { verifyReceptionistSession, touchReceptionistActivity, unauthorized } from "../../shared/hospitalAuth.ts";
import { revokeAccess, accessLive } from "../../shared/patientAccess.ts";

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
    const visit = active[0];

    // The visit is over: the treating doctor's visit authorization ends with it.
    // The authorization is revoked (never deleted) so the history stays readable.
    let accessRevoked = false;
    if (visit.access_request_id) {
      const rows = await base44.asServiceRole.entities.AccessRequest.filter({ id: visit.access_request_id });
      const request = (rows || [])[0];
      if (request && accessLive(request)) {
        await revokeAccess(base44, {
          request,
          reason: "Visit ended — the patient was checked out.",
          byName: rec.full_name || "",
          byRole: "hospital_checkout",
        });
        accessRevoked = true;
      }
    }

    const history = Array.isArray(visit.assignment_history) ? [...visit.assignment_history] : [];
    history.push({
      action: "visit_ended",
      doctor_id: visit.assigned_doctor_id || "",
      doctor_name: visit.assigned_doctor_name || "",
      by_name: rec.full_name || "",
      by_role: "hospital_receptionist",
      reason: accessRevoked ? "Visit ended; the treating doctor's access was ended." : "Visit ended.",
      datetime: now,
    });

    const checkout = await base44.asServiceRole.entities.HospitalCheckIn.update(visit.id, {
      status: "completed",
      completed_datetime: now,
      completed_by_name: rec.full_name,
      access_status: visit.access_status === "revoked" ? "revoked" : accessRevoked ? "expired" : visit.access_status || "none",
      access_revoked_datetime: accessRevoked ? now : visit.access_revoked_datetime || "",
      access_revoked_by: accessRevoked ? "hospital_checkout" : visit.access_revoked_by || "",
      access_revoke_reason: accessRevoked ? "Visit ended — the patient was checked out." : visit.access_revoke_reason || "",
      assignment_history: history,
    });

    await touchReceptionistActivity(base44, rec.id);
    return Response.json({ status: "checked_out", checkout, access_revoked: accessRevoked });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}