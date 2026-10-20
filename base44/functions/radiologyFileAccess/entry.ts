import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Protected radiology file access (Phase 9). Private study images and report
// PDFs are resolved to SHORT-LIVED signed URLs ONLY for users authorized on
// the study — the referring doctor, the patient, the assigned or
// patient-authorized radiologist, an active radiologist of the same facility,
// the facility department, or an administrator — and only for files that
// belong to THAT study. No public patient-identifiable links.
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const payload = body && typeof body === "object" ? body : {};
    const requestId = String(payload.request_id || "");
    const fileUri = String(payload.file_uri || "");
    if (!requestId || !fileUri) {
      return Response.json({ error: "Select the study and the file." }, { status: 400 });
    }

    const svc = base44.asServiceRole;
    const found = await svc.entities.ImagingRequest.filter({ id: requestId });
    const request = found[0];
    if (!request) return Response.json({ error: "Imaging request not found." }, { status: 404 });

    const radProfiles = await svc.entities.RadiologistProfile.filter({ user_id: user.id });
    const radiologist = radProfiles[0];
    const authorized =
      request.doctor_user_id === user.id ||
      request.patient_user_id === user.id ||
      request.routed_hospital_user_id === user.id ||
      (request.authorized_radiologist_user_ids || []).includes(user.id) ||
      request.assigned_radiologist_user_id === user.id ||
      (!!radiologist && radiologist.status === "active" &&
        String(radiologist.hospital || "").trim() === String(request.routed_hospital || "").trim()) ||
      user.role === "admin";
    if (!authorized) {
      return Response.json({ error: "You are not authorized to access this file." }, { status: 403 });
    }

    // The file must belong to THIS study — no signing of arbitrary paths.
    const allowed = new Set([request.report_file_url || "", ...(request.image_file_urls || [])]);
    if (!allowed.has(fileUri)) {
      const versions = await svc.entities.RadiologyReportVersion.filter(
        { imaging_request_id: request.id }, { limit: 100 });
      const inVersions = (versions.items || versions).some((v) => v.report_pdf_url === fileUri);
      if (!inVersions) {
        return Response.json({ error: "This file does not belong to the study." }, { status: 403 });
      }
    }

    const { signed_url } = await svc.integrations.Core.CreateFileSignedUrl({
      file_uri: fileUri,
      expires_in: 600,
    });
    if (!signed_url) {
      return Response.json({ error: "Could not sign the file." }, { status: 500 });
    }
    return Response.json({ signed_url });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}