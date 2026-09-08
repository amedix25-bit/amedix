import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { doctor_id, doctor_name, patient_cin, date, time, location, reason, notes, submission_id } = body || {};

    if (!doctor_id || !patient_cin || !date || !time || !submission_id) {
      return Response.json({ error: 'doctor_id, patient_cin, date, time and submission_id are required' }, { status: 400 });
    }

    // Idempotency: the same submission (same submission_id) is processed only once.
    const existingBySubmission = await base44.entities.Appointment.filter({ submission_id });
    if (existingBySubmission.length > 0) {
      return Response.json({ appointment: existingBySubmission[0], duplicate: true });
    }

    // Resolve the patient by CIN.
    const patients = await base44.entities.PatientProfile.filter({ cin: String(patient_cin).toUpperCase() });
    if (patients.length === 0) {
      return Response.json({ error: 'Patient not found. Please check the CIN.' }, { status: 404 });
    }
    const patient = patients[0];

    // Verify the doctor has approved access to this patient.
    const accessReqs = await base44.entities.AccessRequest.filter({ patient_id: patient.id, doctor_id, status: 'approved' });
    if (accessReqs.length === 0) {
      return Response.json({ error: "You need approved access to this patient's record" }, { status: 403 });
    }

    // Duplicate protection: the same doctor, patient, date and time must never create a second appointment.
    const sameAppointment = await base44.entities.Appointment.filter({
      doctor_id,
      patient_id: patient.id,
      date,
      time,
      status: 'scheduled',
    });
    if (sameAppointment.length > 0) {
      return Response.json({ error: 'An appointment already exists for this patient, date and time.' }, { status: 409 });
    }

    // Slot conflict: the doctor is already booked at this date and time.
    const slotAppointments = await base44.entities.Appointment.filter({ doctor_id, date, time, status: 'scheduled' });
    if (slotAppointments.some((a) => a.patient_id !== patient.id)) {
      return Response.json({ error: 'This date and time is already booked for another appointment. Please choose a different time.' }, { status: 409 });
    }

    const appointment = await base44.entities.Appointment.create({
      patient_id: patient.id,
      doctor_id,
      patient_cin: patient.cin,
      patient_name: patient.full_name,
      doctor_name: doctor_name || '',
      date,
      time,
      location: location || '',
      reason: reason || '',
      notes: notes || '',
      status: 'scheduled',
      submission_id,
    });

    return Response.json({ appointment, created: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}