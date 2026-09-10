import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Patient Portal → Imaging → View Results → "Send to Doctor".
// Shares ONE finalized imaging result with a doctor who currently has the
// patient's approved access. Creates a DoctorNotification for that doctor
// (deduplicated per result + doctor — a repeat send just bumps the existing
// notification). Never grants the doctor any new record access.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const accessRequestId = String(body.access_request_id || '').trim();
    const imagingResultId = String(body.imaging_result_id || '').trim();
    if (!accessRequestId || !imagingResultId) {
      return Response.json({ error: 'Access request and imaging result are required' }, { status: 400 });
    }

    const svc = base44.asServiceRole;
    const result = await svc.entities.ImagingResult.get(imagingResultId);
    if (!result) return Response.json({ error: 'Imaging result not found' }, { status: 404 });

    // Only the owning patient can share their own result.
    if (result.patient_user_id !== user.id) {
      return Response.json({ error: 'Only the patient can share this result' }, { status: 403 });
    }

    const access = await svc.entities.AccessRequest.get(accessRequestId);
    if (!access) return Response.json({ error: 'Doctor access not found' }, { status: 404 });
    if (access.patient_id !== result.patient_id) {
      return Response.json({ error: 'This doctor does not have access to this patient' }, { status: 403 });
    }
    if (access.status !== 'approved') {
      return Response.json({ error: 'This doctor currently does not have access to your record' }, { status: 403 });
    }

    const doctor = await svc.entities.DoctorProfile.get(access.doctor_id);
    if (!doctor || !doctor.user_id) {
      return Response.json({ error: 'Doctor not found' }, { status: 404 });
    }

    // One notification per doctor per result — a repeat send just bumps it.
    const existing = await svc.entities.DoctorNotification.filter({
      doctor_user_id: doctor.user_id,
      type: 'imaging_result_shared',
      related_id: result.id,
    });
    const nowIso = new Date().toISOString();
    if (existing.length > 0) {
      const updated = await svc.entities.DoctorNotification.update(existing[0].id, {
        datetime: nowIso,
        is_read: false,
      });
      return Response.json({ notification: updated, alreadySent: true });
    }

    const patientName = result.patient_name || 'A patient';
    const exam = [result.scan_type, result.examination].filter(Boolean).join(' — ');
    const notification = await svc.entities.DoctorNotification.create({
      doctor_user_id: doctor.user_id,
      doctor_id: doctor.id,
      type: 'imaging_result_shared',
      title: `Imaging result shared by ${patientName}`,
      message: `${patientName} shared a completed imaging result${exam ? ` (${exam})` : ''} with you.`,
      patient_id: result.patient_id,
      patient_name: result.patient_name,
      patient_cin: result.patient_cin,
      imaging_request_id: result.imaging_request_id,
      request_ref: result.request_ref,
      scan_type: result.scan_type,
      examination: result.examination,
      report_pdf_url: result.report_pdf_url,
      related_id: result.id,
      target: 'find_patient',
      datetime: nowIso,
      is_read: false,
    });

    return Response.json({ notification });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}