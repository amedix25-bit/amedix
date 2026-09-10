import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Radiologist Portal — request patient authorization for ONE specific
// imaging request. Creates a pending ImagingRequestAccess record (status is
// set server-side — a radiologist can never grant it themselves) and notifies
// the patient to review and authorize in their Radiology Requests tab.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const imagingRequestId = String(body.imaging_request_id || "").trim();
    if (!imagingRequestId) {
      return Response.json({ error: 'Imaging request is required' }, { status: 400 });
    }

    const radProfiles = await base44.entities.RadiologistProfile.filter({ user_id: user.id });
    if (radProfiles.length === 0) {
      return Response.json({ error: 'Only radiologists can request access' }, { status: 403 });
    }
    const rad = radProfiles[0];

    const svc = base44.asServiceRole;
    const imaging = await svc.entities.ImagingRequest.get(imagingRequestId);
    if (!imaging) return Response.json({ error: 'Imaging request not found' }, { status: 404 });

    const patient = await svc.entities.PatientProfile.get(imaging.patient_id);
    if (!patient || !patient.user_id) {
      return Response.json({ error: 'Patient not found' }, { status: 404 });
    }

    // One access record per radiologist per request — never duplicate.
    const existing = await svc.entities.ImagingRequestAccess.filter({
      imaging_request_id: imaging.id,
      radiologist_user_id: user.id,
    });
    if (existing.length > 0) {
      return Response.json({ access: existing[0] });
    }

    const today = new Date().toISOString().slice(0, 10);
    const access = await svc.entities.ImagingRequestAccess.create({
      imaging_request_id: imaging.id,
      request_ref: imaging.request_id,
      patient_id: imaging.patient_id,
      patient_user_id: patient.user_id,
      patient_cin: imaging.patient_cin || patient.cin,
      patient_name: imaging.patient_name || patient.full_name,
      doctor_name: imaging.doctor_name,
      scan_type: imaging.scan_type,
      examination: imaging.examination,
      priority: imaging.priority,
      request_date: imaging.date_requested,
      radiologist_id: rad.id,
      radiologist_user_id: user.id,
      radiologist_name: rad.full_name,
      status: "pending",
      date_requested: today,
    });

    await svc.entities.PatientNotification.create({
      patient_id: imaging.patient_id,
      type: "other",
      title: `New Radiology Request from Dr./Radiologist ${rad.full_name}`,
      message: "Please review and authorize access to your imaging request.",
      target: "access",
      related_id: access.id,
    });

    return Response.json({ access });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}