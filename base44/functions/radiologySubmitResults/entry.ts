import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Radiologist Portal — submit the finalized imaging results for ONE imaging
// request the patient authorized this radiologist to view. Creates the
// ImagingResult (report PDF + study images + report notes) and marks the
// imaging request completed so the result is available to the patient under
// View Results.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const imagingRequestId = String(body.imaging_request_id || "").trim();
    const reportNotes = String(body.report_notes || "").slice(0, 20000);
    const reportPdfUrl = String(body.report_pdf_url || "").trim();
    if (!imagingRequestId || !reportPdfUrl) {
      return Response.json({ error: 'imaging_request_id and report_pdf_url are required' }, { status: 400 });
    }
    const rawImages = Array.isArray(body.images) ? body.images : [];
    const images = rawImages
      .slice(0, 10)
      .map((i) => ({ file_url: String((i && i.file_url) || "").trim(), file_name: String((i && i.file_name) || "").trim() }))
      .filter((i) => i.file_url);

    const radProfiles = await base44.entities.RadiologistProfile.filter({ user_id: user.id });
    if (radProfiles.length === 0) {
      return Response.json({ error: 'Only radiologists can submit results' }, { status: 403 });
    }
    const rad = radProfiles[0];

    const svc = base44.asServiceRole;
    // Results may only be submitted for a request the patient authorized
    // this specific radiologist to view.
    const access = await svc.entities.ImagingRequestAccess.filter({
      imaging_request_id: imagingRequestId,
      radiologist_user_id: user.id,
    });
    if (access.length === 0 || access[0].status !== "accepted") {
      return Response.json({ error: 'The patient has not authorized you for this imaging request' }, { status: 403 });
    }

    const imaging = await svc.entities.ImagingRequest.get(imagingRequestId);
    if (!imaging) return Response.json({ error: 'Imaging request not found' }, { status: 404 });

    let patientUserId = imaging.patient_user_id;
    if (!patientUserId) {
      const patient = await svc.entities.PatientProfile.get(imaging.patient_id);
      patientUserId = patient && patient.user_id;
    }
    if (!patientUserId) {
      return Response.json({ error: 'Patient account not found' }, { status: 404 });
    }

    const nowIso = new Date().toISOString();
    const today = nowIso.slice(0, 10);

    const result = await svc.entities.ImagingResult.create({
      imaging_request_id: imaging.id,
      request_ref: imaging.request_id,
      patient_id: imaging.patient_id,
      patient_user_id: patientUserId,
      patient_cin: imaging.patient_cin,
      patient_name: imaging.patient_name,
      doctor_name: imaging.doctor_name,
      scan_type: imaging.scan_type,
      examination: imaging.examination,
      radiologist_id: rad.id,
      radiologist_user_id: user.id,
      radiologist_name: rad.full_name,
      report_notes: reportNotes,
      report_pdf_url: reportPdfUrl,
      images,
      date_completed: today,
      created_datetime: nowIso,
    });

    await svc.entities.ImagingRequest.update(imaging.id, {
      status: "completed",
      date_completed: today,
    });

    return Response.json({ result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}