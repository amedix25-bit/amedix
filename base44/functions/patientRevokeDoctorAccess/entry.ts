import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { revokeAccess } from "../../shared/patientAccess.ts";

// The patient removing ONE doctor's access — the existing Remove Access action.
// The patient must own the patient record behind the authorization; the server
// then revokes that single authorization immediately (every later read is
// refused, because access is re-checked on each request), ends the visit
// assignment if the access came from a hospital check-in, records the
// revocation in the access log and the clinical audit trail, and notifies the
// doctor without exposing any patient information.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const requestId = String(body.access_request_id || "");
    if (!requestId) return Response.json({ error: "The access to remove is required." }, { status: 400 });

    const sr = base44.asServiceRole;
    let request = null;
    try {
      const rows = await sr.entities.AccessRequest.filter({ id: requestId });
      request = (rows || [])[0] || null;
    } catch (e) {
      request = null;
    }
    if (!request) return Response.json({ error: "This access record could not be found." }, { status: 404 });

    // The caller must own the patient record this access belongs to.
    const owned = await sr.entities.PatientProfile.filter({ id: request.patient_id });
    const patient = (owned || [])[0];
    const isOwner =
      (patient && patient.user_id === user.id) ||
      (request.patient_user_id && request.patient_user_id === user.id);
    if (!isOwner) {
      return Response.json({ error: "You can only remove access to your own medical record." }, { status: 403 });
    }

    if (request.status === "revoked") {
      return Response.json({ revoked: true, already: true });
    }

    await revokeAccess(base44, {
      request,
      reason: "Removed by the patient from their access list.",
      byName: user.full_name || user.email || "",
      byRole: "patient",
    });

    // End the visit assignment too, so the receptionist and the doctor see the
    // visit access as removed — the visit itself is not altered.
    if (request.checkin_id) {
      try {
        const checkins = await sr.entities.HospitalCheckIn.filter({ id: request.checkin_id });
        const checkin = (checkins || [])[0];
        if (checkin) {
          const history = Array.isArray(checkin.assignment_history) ? [...checkin.assignment_history] : [];
          history.push({
            action: "access_revoked",
            doctor_id: checkin.assigned_doctor_id || "",
            doctor_name: checkin.assigned_doctor_name || "",
            by_name: user.full_name || "",
            by_role: "patient",
            reason: "The patient removed this doctor's access.",
            datetime: new Date().toISOString(),
          });
          await sr.entities.HospitalCheckIn.update(checkin.id, {
            access_status: "revoked",
            access_revoked_datetime: new Date().toISOString(),
            access_revoked_by: "patient",
            access_revoke_reason: "Removed by the patient.",
            assignment_history: history,
          });
        }
      } catch (e) {
        /* the authorization itself is already revoked */
      }
    }

    // Tell the doctor their access ended — no patient details in the message.
    if (request.doctor_user_id) {
      try {
        await sr.entities.DoctorNotification.create({
          doctor_user_id: request.doctor_user_id,
          doctor_id: request.doctor_id,
          type: "patient_access_revoked",
          title: "Access Revoked",
          message: "A patient has removed your access to their medical record. Further access is blocked until they authorize it again.",
          related_id: request.id,
          is_read: false,
          datetime: new Date().toISOString(),
        });
      } catch (e) {
        /* notification only */
      }
    }

    return Response.json({ revoked: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}