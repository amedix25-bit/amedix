import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Records the patient's explicit authorization allowing one laboratory to view
// a lab request, associates the request with that laboratory, and marks it as
// sent. Only the patient who owns the request can authorize, and only after an
// explicit confirm — the laboratory receives nothing until this succeeds.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { lab_request_id, lab_id } = body || {};
    if (!lab_request_id || !lab_id) {
      return Response.json({ error: 'Missing laboratory request or laboratory.' }, { status: 400 });
    }

    const profiles = await base44.entities.PatientProfile.filter({ user_id: user.id });
    if (profiles.length === 0) {
      return Response.json({ error: 'Patient profile not found.' }, { status: 403 });
    }

    let labReq;
    try {
      labReq = await base44.asServiceRole.entities.LabRequest.get(lab_request_id);
    } catch (e) {
      return Response.json({ error: 'Laboratory request not found.' }, { status: 404 });
    }
    if (labReq.patient_id !== profiles[0].id) {
      return Response.json({ error: 'You are not the owner of this request.' }, { status: 403 });
    }
    if (labReq.authorized_by_patient) {
      return Response.json({ error: 'This request has already been authorized.' }, { status: 400 });
    }

    let lab;
    try {
      lab = await base44.asServiceRole.entities.LaboratoryProfile.get(lab_id);
    } catch (e) {
      return Response.json({ error: 'Laboratory not found.' }, { status: 404 });
    }

    const authorizationDatetime = new Date().toISOString();
    await base44.asServiceRole.entities.LabRequest.update(labReq.id, {
      lab_id: lab.id,
      lab_name: lab.lab_name,
      lab_number: lab.lab_number || '',
      lab_location: lab.address || '',
      authorized_by_patient: true,
      authorization_datetime: authorizationDatetime,
      status: 'authorized',
    });

    return Response.json({
      lab_name: lab.lab_name,
      lab_number: lab.lab_number || '',
      lab_location: lab.address || '',
      authorization_datetime: authorizationDatetime,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}