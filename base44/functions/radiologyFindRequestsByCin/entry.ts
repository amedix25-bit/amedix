import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Radiologist Portal — Enter CIN lookup.
// Returns ONLY imaging request metadata (modality, examination, ordering
// doctor, priority, date) plus the radiologist's per-request authorization
// status. Clinical content (indication, working diagnosis, PDF) is never
// returned — the radiologist reads the full request directly through RLS
// only after the patient accepts.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const cin = String(body.cin || "").trim().toUpperCase();
    if (!cin) return Response.json({ error: 'CIN is required' }, { status: 400 });

    const radProfiles = await base44.entities.RadiologistProfile.filter({ user_id: user.id });
    if (radProfiles.length === 0) {
      return Response.json({ error: 'Only radiologists can look up imaging requests' }, { status: 403 });
    }

    const patients = await base44.entities.PatientProfile.filter({ cin });
    if (patients.length === 0) {
      return Response.json({ patient: null, requests: [] });
    }
    const patient = patients[0];

    // Service role: ImagingRequest is RLS-protected and the radiologist has no
    // access yet — expose request stubs only, no clinical content.
    const svc = base44.asServiceRole;
    const [allRequests, accessRecords] = await Promise.all([
      svc.entities.ImagingRequest.filter({ patient_id: patient.id }),
      svc.entities.ImagingRequestAccess.filter({ patient_id: patient.id, radiologist_user_id: user.id }),
    ]);

    const accessByRequest = {};
    accessRecords.forEach((a) => { accessByRequest[a.imaging_request_id] = a.status; });

    const requests = allRequests
      .filter((r) => r.status === "requested" || accessByRequest[r.id])
      .map((r) => ({
        imaging_request_id: r.id,
        request_ref: r.request_id,
        doctor_name: r.doctor_name,
        doctor_specialization: r.doctor_specialization,
        doctor_hospital: r.doctor_hospital,
        scan_type: r.scan_type,
        examination: r.examination,
        priority: r.priority,
        status: r.status,
        date_requested: r.date_requested,
        request_datetime: r.request_datetime,
        access_status: accessByRequest[r.id] || null,
      }));

    return Response.json({
      patient: { full_name: patient.full_name, cin: patient.cin },
      requests,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}