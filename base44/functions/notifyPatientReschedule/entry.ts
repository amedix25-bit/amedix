import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { patient_id, patient_name, doctor_name, original_date, original_time, new_date, new_time, location, reason } = body || {};
    if (!patient_id || !new_date || !new_time) {
      return Response.json({ error: 'Missing appointment details' }, { status: 400 });
    }

    let profiles = [];
    try {
      profiles = await base44.entities.PatientProfile.filter({ id: patient_id });
    } catch (e) {
      return Response.json({ notified: false, reason: 'Patient not found' }, { status: 404 });
    }

    let email = null;
    if (profiles[0].user_id) {
      try {
        const patientUser = await base44.entities.User.get(profiles[0].user_id);
        email = patientUser?.email;
      } catch (e) {
        email = null;
      }
    }
    if (!email) return Response.json({ notified: false, reason: 'No email on file' });

    const subject = 'Your appointment has been rescheduled';
    const emailBody = `Hello ${patient_name || profiles[0].full_name},\n\nYour appointment with Dr. ${doctor_name || ''} has been rescheduled.\n\nPrevious date/time: ${original_date || ''} at ${original_time || ''}\nNew date/time: ${new_date} at ${new_time}\n${location ? `Location: ${location}\n` : ''}${reason ? `Reason: ${reason}\n` : ''}\nPlease review the updated appointment in your patient portal.`;

    await base44.asServiceRole.integrations.Core.SendEmail({ to: email, subject, body: emailBody });
    return Response.json({ notified: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}