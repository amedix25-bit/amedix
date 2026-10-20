import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { logClinicalAudit } from "../../shared/clinicalAudit.ts";

// Imaging Viewer integration — secure bridge to the facility's EXISTING
// imaging software (PACS / RIS / web viewer / desktop application).
//
// Security model:
// - The PACS configuration lives on the facility HospitalProfile and is never
//   readable by radiologists (Row Level Security) — every launch is built and
//   authorized SERVER-SIDE, so no vendor URL template or credential reaches
//   the browser.
// - Launch tokens ({launch_token} placeholder) are cryptographically random,
//   single use and expire after 15 minutes; vendors validate them through the
//   GET endpoint of this function.
// - Every launch is recorded in the clinical audit log.
// - Studies are matched by the AMedix request ID and the DICOM Study Instance
//   UID recorded by the department — never by patient name alone.

function json(data: any, status = 200): Response {
  return Response.json(data, { status });
}

// Returns the authorized actor role ("radiologist" | "department") or null.
// Same authorization as the study review screen: the assigned radiologist, a
// radiologist the patient authorized for this request, the facility's
// claimable pool, or the facility's radiology department.
async function authorizeStudy(base44: any, user: any, request: any): Promise<string | null> {
  const profiles = await base44.asServiceRole.entities.RadiologistProfile.filter({ user_id: user.id });
  const radiologist = profiles[0];
  if (radiologist && radiologist.status === "active") {
    const authorized =
      (request.authorized_radiologist_user_ids || []).includes(user.id) ||
      request.assigned_radiologist_user_id === user.id ||
      String(radiologist.hospital || "").trim() === String(request.routed_hospital || "").trim();
    if (authorized) return "radiologist";
  }
  const hospitals = await base44.asServiceRole.entities.HospitalProfile.filter({ user_id: user.id });
  const department = hospitals.find((h: any) => h.radiology_department_enabled);
  if (department && request.routed_hospital_user_id === user.id) return "department";
  return null;
}

async function loadFacilityPacs(base44: any, request: any): Promise<any | null> {
  // An administrator may hold several facility profiles — the PACS belongs to
  // the facility the request was ROUTED to (matched by facility name), not to
  // whichever profile happens to be listed first.
  const pages = await base44.asServiceRole.entities.HospitalProfile.filter({ user_id: request.routed_hospital_user_id });
  const byName = pages.find(
    (h: any) => String(h.hospital_name || "").trim() === String(request.routed_hospital || "").trim()
  );
  return byName || pages[0] || null;
}

function buildLaunchUrl(template: string, values: Record<string, string>): string {
  let url = template;
  for (const [key, value] of Object.entries(values)) {
    url = url.split(`{${key}}`).join(encodeURIComponent(value));
  }
  return url;
}

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);
    const svc = base44.asServiceRole;

    // ===== GET — one-time launch-token validation. Documented endpoint for
    // vendors whose viewer supports token-in-URL authentication:
    //   GET https://<app>/functions/radiologyPacsAccess?token=<uuid>
    if (req.method === "GET") {
      const token = String(url.searchParams.get("token") || "").trim();
      if (!token) return json({ valid: false, error: "Missing launch token." }, 400);
      const found = await svc.entities.PacsLaunchToken.filter({ token });
      const record = found[0];
      if (!record) return json({ valid: false, error: "Unknown launch token." }, 401);
      const now = new Date().toISOString();
      if (record.used_datetime) return json({ valid: false, error: "This launch token was already used." }, 401);
      if (record.expires_datetime && record.expires_datetime < now) {
        return json({ valid: false, error: "This launch token has expired. Reopen the study from AMedix." }, 401);
      }
      await svc.entities.PacsLaunchToken.update(record.id, { used_datetime: now });
      return json({ valid: true, request_ref: record.request_ref || "" });
    }

    // ===== POST — status / verify / launch
    const user = await base44.auth.me();
    if (!user) return json({ error: "Unauthorized" }, 401);
    const body = await req.json().catch(() => ({}));
    const payload = body && typeof body === "object" ? body : {};
    const action = String(payload.action || "status");
    const requestId = String(payload.request_id || "").trim();
    if (!requestId) return json({ error: "Select the imaging request." }, 400);

    const found = await svc.entities.ImagingRequest.filter({ id: requestId });
    const request = found[0];
    if (!request) return json({ error: "Imaging request not found." }, 404);

    const actorRole = await authorizeStudy(base44, user, request);
    if (!actorRole) return json({ error: "You are not authorized to access this study's images." }, 403);

    const pacsProfile = await loadFacilityPacs(base44, request);
    const pacsEnabled = !!(pacsProfile && pacsProfile.pacs_integration_enabled);
    const pacsMode = pacsEnabled ? (pacsProfile.pacs_integration_type || "none") : "none";
    const amedixImages = (request.image_file_urls || []).filter(Boolean);
    const studyUid = String(request.study_instance_uid || "").trim();
    const accession = String(request.accession_number || "").trim() || String(request.request_id || "");

    const pacsSummary = {
      enabled: pacsEnabled,
      mode: pacsMode,
      vendor_name: pacsEnabled ? (pacsProfile.pacs_vendor_name || "") : "",
      viewer_configured: pacsEnabled ? !!String(pacsProfile.pacs_viewer_url_template || "").trim() : false,
      dicomweb_configured: pacsEnabled ? !!String(pacsProfile.pacs_dicomweb_base_url || "").trim() : false,
    };

    if (action === "status") {
      return json({
        request_id: request.request_id,
        patient_cin: request.patient_cin,
        patient_name: request.patient_name,
        study_instance_uid: studyUid,
        accession_number: accession,
        image_file_urls: amedixImages,
        amedix_images: amedixImages.length,
        images_available: amedixImages.length > 0,
        pacs: pacsSummary,
      });
    }

    if (action === "verify") {
      if (!pacsEnabled) {
        return json({ verified: false, message: "This facility has not connected an imaging system yet." }, 409);
      }
      const dicomwebBase = String(pacsProfile.pacs_dicomweb_base_url || "").trim().replace(/\/+$/, "");
      if (!dicomwebBase) {
        return json({ verified: false, message: "The facility imaging system has no DICOMweb (QIDO) endpoint configured for availability verification." }, 409);
      }
      if (!studyUid) {
        return json({ verified: false, message: "The DICOM Study Instance UID is not recorded for this study yet, so availability on the imaging system cannot be verified." }, 409);
      }
      let verified = false;
      let httpStatus: number | null = null;
      let studiesFound = 0;
      let message = "";
      try {
        const probe = await fetch(`${dicomwebBase}/studies?StudyInstanceUID=${encodeURIComponent(studyUid)}&limit=1`, {
          signal: AbortSignal.timeout(10000),
          headers: { Accept: "application/dicom+json" },
        });
        httpStatus = probe.status;
        if (probe.ok) {
          const rows = await probe.json().catch(() => []);
          studiesFound = Array.isArray(rows) ? rows.length : 0;
          verified = studiesFound > 0;
          message = verified
            ? "The study was found on the facility imaging system."
            : "The imaging system answered, but this Study Instance UID was not found on it.";
        } else if (probe.status === 401 || probe.status === 403) {
          message = "The facility imaging system requires authentication for its DICOMweb endpoint — vendor credentials must be configured as server-side secrets.";
        } else {
          message = `The facility imaging system answered with HTTP ${probe.status}.`;
        }
      } catch {
        message = "The facility imaging system could not be reached — it may be offline or the endpoint is incorrect.";
      }
      return json({ verified, http_status: httpStatus, studies_found: studiesFound, message });
    }

    if (action === "launch") {
      if (!pacsEnabled) {
        return json({
          mode: "none",
          launch_url: null,
          message: "This facility's imaging system is not connected yet. The hospital administrator must connect it in the Hospital Portal (Profile — Imaging System Connection) after confirming the vendor's supported integration method.",
        }, 409);
      }
      if (pacsMode === "desktop_app") {
        return json({
          mode: "desktop_app",
          launch_url: null,
          message: `The facility's imaging software is a desktop application that cannot be opened from the browser. Open the study in the desktop software using the request reference ${request.request_id || ""} — automatic study launching requires the vendor's documented launch method.`,
        });
      }
      const template = String(pacsProfile.pacs_viewer_url_template || "").trim();
      if (!template) {
        return json({ mode: pacsMode, launch_url: null, message: "The facility imaging system is connected, but no viewer launch URL template is configured yet." }, 409);
      }
      if (template.includes("{study_instance_uid}") && !studyUid) {
        return json({ mode: pacsMode, launch_url: null, message: "The DICOM Study Instance UID is not recorded for this study, so the imaging system cannot be opened to the right examination. The department must record it on the imaging request." }, 409);
      }
      let tokenValue = "";
      let expiresInMinutes = 0;
      if (template.includes("{launch_token}")) {
        tokenValue = crypto.randomUUID();
        expiresInMinutes = 15;
        await svc.entities.PacsLaunchToken.create({
          token: tokenValue,
          imaging_request_id: request.id,
          request_ref: request.request_id || "",
          radiologist_user_id: user.id,
          expires_datetime: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        });
      }
      const launchUrl = buildLaunchUrl(template, {
        study_instance_uid: studyUid,
        accession_number: accession,
        request_id: request.request_id || "",
        patient_cin: request.patient_cin || "",
        launch_token: tokenValue,
      });
      await logClinicalAudit(base44, {
        actor_user_id: user.id,
        actor_name: user.full_name,
        actor_role: actorRole,
        action: "radiology_pacs_study_launched",
        action_label: "opened the study in the facility imaging system",
        patient_id: request.patient_id,
        patient_cin: request.patient_cin,
        patient_name: request.patient_name,
        encounter_id: request.encounter_id,
        document_id: request.request_id,
        hospital: request.routed_hospital || request.doctor_hospital,
      });
      return json({ mode: pacsMode, launch_url: launchUrl, launch_token_expires_in_minutes: expiresInMinutes });
    }

    return json({ error: "Unknown action." }, 400);
  } catch (error: any) {
    return json({ error: error.message }, 500);
  }
}