import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { createPatientNotification } from '../../shared/patientNotifications.ts';

// Invoked by the "Patient Lab Notifications" workflow (entity trigger on LabRequest).
// Creates a portal notification when a lab request is created or results become available.
// Runs without user auth (workflow invocation), so entity access uses the service role.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { lab_request_id, event_type } = body || {};
    if (!lab_request_id) return Response.json({ error: 'Missing lab_request_id' }, { status: 400 });

    let lab;
    try {
      lab = await base44.asServiceRole.entities.LabRequest.get(lab_request_id);
    } catch (e) {
      return Response.json({ notified: false, reason: 'Lab request not found' }, { status: 404 });
    }

    const isResults = event_type === 'update' && lab.status === 'results';
    if (event_type !== 'create' && !isResults) {
      return Response.json({ notified: false, reason: 'No relevant event' });
    }
    if (!lab.patient_id) return Response.json({ notified: false, reason: 'No patient on request' }, { status: 400 });

    if (isResults) {
      await createPatientNotification(base44.asServiceRole, {
        patient_id: lab.patient_id,
        type: 'lab_results',
        title: 'Laboratory Results Available',
        message:
          `Results for laboratory tests requested by Dr. ${lab.doctor_name || 'your doctor'} are now available` +
          `${lab.lab_name ? ` from ${lab.lab_name}` : ''}. Tap to view your results.`,
        target: 'mylabresults',
        related_id: lab.id,
      });
    } else {
      const testCount = Array.isArray(lab.tests) ? lab.tests.length : 0;
      await createPatientNotification(base44.asServiceRole, {
        patient_id: lab.patient_id,
        type: 'lab_request',
        title: 'New Laboratory Request',
        message:
          `Dr. ${lab.doctor_name || 'your doctor'} has sent you a laboratory request` +
          `${testCount ? ` with ${testCount} test(s)` : ''}` +
          `${lab.lab_name ? ` to ${lab.lab_name}` : ''}. Please visit the requested laboratory to complete your tests.`,
        target: 'labs',
        related_id: lab.id,
      });
    }
    return Response.json({ notified: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}