import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Patient Portal — Radiology Requests: Accept / Decline a radiologist's
// access request for ONE specific imaging request.
// Only the owning patient can respond. On accept, the radiologist's user id
// is added to that single ImagingRequest's authorized list (the RLS gate);
// on decline nothing is granted. The radiologist is notified either way.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const accessId = String(body.access_id || "").trim();
    const action = String(body.action || "").trim();
    if (!accessId || !["accept", "decline"].includes(action)) {
      return Response.json({ error: 'access_id and action (accept|decline) are required' }, { status: 400 });
    }

    const svc = base44.asServiceRole;
    const access = await svc.entities.ImagingRequestAccess.get(accessId);
    if (!access) return Response.json({ error: 'Access request not found' }, { status: 404 });
    // Only the patient who owns this request may respond.
    if (access.patient_user_id !== user.id) {
      return Response.json({ error: 'Only the patient can respond to this request' }, { status: 403 });
    }

    const accepted = action === "accept";
    const today = new Date().toISOString().slice(0, 10);
    const updated = await svc.entities.ImagingRequestAccess.update(access.id, {
      status: accepted ? "accepted" : "declined",
      date_responded: today,
    });

    if (accepted) {
      // Grant access to ONLY this specific imaging request — nothing else
      // on the patient's record. This array is the RLS read gate.
      const imaging = await svc.entities.ImagingRequest.get(access.imaging_request_id);
      const authorized = Array.isArray(imaging && imaging.authorized_radiologist_user_ids)
        ? imaging.authorized_radiologist_user_ids
        : [];
      if (!authorized.includes(access.radiologist_user_id)) {
        await svc.entities.ImagingRequest.update(access.imaging_request_id, {
          authorized_radiologist_user_ids: [...authorized, access.radiologist_user_id],
        });
      }
    }

    await svc.entities.RadiologistNotification.create({
      radiologist_user_id: access.radiologist_user_id,
      type: "patient_authorization",
      title: accepted ? "Imaging request authorized" : "Access declined",
      message: accepted
        ? `${access.patient_name} accepted your request — you can now view imaging request ${access.request_ref || ""}.`
        : `${access.patient_name} declined your request to view imaging request ${access.request_ref || ""}.`,
      patient_id: access.patient_id,
      patient_name: access.patient_name,
      target: "find_patient",
      related_id: access.id,
      datetime: new Date().toISOString(),
    });

    return Response.json({ access: updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}