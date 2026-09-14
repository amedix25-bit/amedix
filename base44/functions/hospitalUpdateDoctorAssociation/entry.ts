import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Hospital-admin management of the hospital's doctor associations:
// deactivate, reactivate, or remove. Removal ends the association immediately
// — the doctor loses access to that hospital's patients and hospital-specific
// information, and if this was their current working hospital, they are
// re-pointed to another active association (or the working hospital is
// cleared), which instantly blocks the hospital's check-in security gate.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const associationId = String(body.association_id || "");
    const action = String(body.action || "");
    const statusByAction = { remove: "removed", deactivate: "deactivated", reactivate: "active" };
    if (!associationId || !statusByAction[action]) {
      return Response.json({ error: "A valid association and action are required." }, { status: 400 });
    }

    const profiles = await base44.entities.HospitalProfile.filter({ user_id: user.id });
    if (profiles.length === 0) {
      return Response.json({ error: "Hospital profile not found." }, { status: 403 });
    }
    const profile = profiles[0];

    const assocs = await base44.asServiceRole.entities.HospitalDoctor.filter({ id: associationId });
    if (assocs.length === 0) {
      return Response.json({ error: "Doctor association not found." }, { status: 404 });
    }
    const assoc = assocs[0];
    if (assoc.hospital_id !== profile.id) {
      return Response.json({ error: "This doctor is not associated with your hospital." }, { status: 403 });
    }

    await base44.asServiceRole.entities.HospitalDoctor.update(assoc.id, { status: statusByAction[action] });

    // When the association is ended, make sure the doctor is no longer working
    // at this hospital — their current hospital moves to another active
    // association or is cleared, which immediately locks this hospital's
    // check-in gate and stops new hospital-associated clinical actions.
    if (action !== "reactivate") {
      const doctorProfiles = await base44.asServiceRole.entities.DoctorProfile.filter({ id: assoc.doctor_id });
      if (doctorProfiles.length > 0) {
        const dp = doctorProfiles[0];
        const workingName = String(dp.hospital || "").trim().toLowerCase();
        if (workingName === String(assoc.hospital_name || "").trim().toLowerCase()) {
          const others = await base44.asServiceRole.entities.HospitalDoctor.filter({
            doctor_id: assoc.doctor_id,
            status: "active",
          });
          const next = others.find((o) => o.id !== assoc.id);
          await base44.asServiceRole.entities.DoctorProfile.update(dp.id, {
            hospital: next ? next.hospital_name : "",
          });
        }
      }
    }

    return Response.json({ status: statusByAction[action] });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}