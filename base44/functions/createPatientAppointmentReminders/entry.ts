import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { createPatientNotification } from '../../shared/patientNotifications.ts';

// Invoked daily by the "Patient Appointment Reminders" workflow.
// Creates a portal notification one day before each confirmed upcoming appointment.
// Runs without user auth (scheduled invocation), so entity access uses the service role.
const TZ = 'Africa/Tripoli';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });
    const tomorrow = fmt.format(new Date(Date.now() + 24 * 60 * 60 * 1000));

    const appointments = await base44.asServiceRole.entities.Appointment.filter({ status: 'scheduled', date: tomorrow });
    const relevant = appointments.filter((a) => a.patient_response === 'accepted' && a.patient_id);
    if (relevant.length === 0) return Response.json({ created: 0, date: tomorrow });

    const existing = await base44.asServiceRole.entities.PatientNotification.filter({ type: 'appointment', event_date: tomorrow });
    const seen = new Set(existing.map((n) => n.related_id));

    let created = 0;
    for (const apt of relevant) {
      if (seen.has(apt.id)) continue;
      await createPatientNotification(base44.asServiceRole, {
        patient_id: apt.patient_id,
        type: 'appointment',
        title: 'Upcoming Appointment',
        message:
          `You have an appointment with Dr. ${apt.doctor_name || 'your doctor'} on ${tomorrow} at ${apt.time || ''}` +
          `${apt.location ? ` at ${apt.location}` : ''}${apt.reason ? ` — ${apt.reason}` : ''}.`,
        target: 'appointments',
        related_id: apt.id,
        event_date: tomorrow,
      });
      created += 1;
    }
    return Response.json({ created, date: tomorrow });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}