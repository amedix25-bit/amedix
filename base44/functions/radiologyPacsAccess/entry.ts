import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { authorizedFacilities, isAuthorizedForFacility } from "../../shared/radiologyMembership.ts";
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
      isAuthorizedForFacility(
        await authorizedFacilities(base44, radiologist),
        request.routed_hospital_user_id,
        request.routed_hospital
      );
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

// A DOCUMENTED launch URL is either a web endpoint (https://...) or the
// vendor's own documented custom protocol handler (scheme://...). A bare
// filesystem path (e.g. /Applications/Viewer.app) is NOT launchable and is
// rejected with a clear setup message — never guessed into a launch.
function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function isDocumentedLaunchUrl(value: string): boolean {
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(value);
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

    // ===== OHIF connection test — facility-administrator-only end-to-end
    // verification. The embedded OHIF integration is marked Connected ONLY
    // after this test: (1) reaches the deployed OHIF instance and (2)
    // retrieves at least one study from the facility's DICOMweb archive.
    // No imaging request is involved and no other configuration is changed.
    if (action === "ohif_test") {
      const hospitals = await svc.entities.HospitalProfile.filter({ user_id: user.id });
      const profileId = String(payload.hospital_profile_id || "").trim();
      const facility =
        (profileId ? hospitals.find((h: any) => h.id === profileId) : null) ||
        hospitals.find((h: any) => h.pacs_integration_enabled && h.pacs_integration_type === "ohif_embedded") ||
        hospitals[0] ||
        null;
      if (!facility) return json({ error: "No facility profile is linked to this administrator account." }, 404);
      const setOhifStatus = async (status: string) => {
        await svc.entities.HospitalProfile.update(facility.id, { ohif_connection_status: status });
      };

      if (!facility.pacs_integration_enabled || facility.pacs_integration_type !== "ohif_embedded") {
        return json({
          tested: false,
          connection_status: "pending_configuration",
          message: "Select the OHIF Viewer (embedded) integration type and enable the connection first — the test runs against that deployment.",
        }, 409);
      }
      const ohifBase = String(facility.ohif_base_url || "").trim().replace(/\/+$/, "");
      if (!ohifBase) {
        return json({
          tested: false,
          connection_status: "pending_configuration",
          message: "Deployment required — the OHIF Base URL is empty. Deploy the facility's approved OHIF instance (never the public demo), record its https:// address, then run this test. The integration stays Pending configuration and launching stays disabled until the test passes.",
        }, 409);
      }
      if (!/^https:\/\//i.test(ohifBase)) {
        await setOhifStatus("verification_failed");
        return json({
          tested: false,
          connection_status: "verification_failed",
          message: "The recorded OHIF Base URL is not an https:// address — only HTTPS deployments may be connected. Correct it and run the test again.",
        }, 409);
      }
      const dicomwebBase = String(facility.pacs_dicomweb_base_url || "").trim().replace(/\/+$/, "");
      if (!dicomwebBase) {
        return json({
          tested: false,
          connection_status: "pending_configuration",
          message: "The end-to-end test needs the facility archive's DICOMweb (QIDO) Base URL to verify study retrieval. Record it, then run the test again.",
        }, 409);
      }
      if (!isHttpUrl(dicomwebBase)) {
        await setOhifStatus("verification_failed");
        return json({
          tested: false,
          connection_status: "verification_failed",
          message: "The DICOMweb (QIDO) Base URL is not a valid http(s) endpoint — correct it and run the test again.",
        }, 409);
      }
      // Step 1 — the OHIF deployment itself is reachable and serving.
      try {
        const probe = await fetch(ohifBase, { signal: AbortSignal.timeout(10000) });
        if (probe.status >= 500) {
          await setOhifStatus("verification_failed");
          return json({
            tested: false,
            connection_status: "verification_failed",
            message: `The OHIF deployment answered with HTTP ${probe.status} — it is not serving correctly yet.`,
          }, 409);
        }
      } catch {
        await setOhifStatus("verification_failed");
        return json({
          tested: false,
          connection_status: "verification_failed",
          message: "The OHIF deployment could not be reached — it may not be deployed yet or the address is incorrect.",
        }, 409);
      }
      // Step 2 — authorized end-to-end study retrieval from the facility archive.
      let studiesFound = 0;
      try {
        const probe = await fetch(`${dicomwebBase}/studies?limit=1`, {
          signal: AbortSignal.timeout(10000),
          headers: { Accept: "application/dicom+json" },
        });
        if (probe.status === 401 || probe.status === 403) {
          await setOhifStatus("verification_failed");
          return json({
            tested: false,
            connection_status: "verification_failed",
            message: "The archive requires authentication for its DICOMweb endpoint — vendor service credentials must be configured as server-side secrets first.",
          }, 409);
        }
        if (!probe.ok) {
          await setOhifStatus("verification_failed");
          return json({
            tested: false,
            connection_status: "verification_failed",
            message: `The facility archive answered with HTTP ${probe.status} — study retrieval failed.`,
          }, 409);
        }
        const rows = await probe.json().catch(() => []);
        studiesFound = Array.isArray(rows) ? rows.length : 0;
        if (studiesFound === 0) {
          await setOhifStatus("verification_failed");
          return json({
            tested: false,
            connection_status: "verification_failed",
            message: "The archive answered, but no study could be retrieved from it — at least one study must be retrievable for the end-to-end test to pass.",
          }, 409);
        }
      } catch {
        await setOhifStatus("verification_failed");
        return json({
          tested: false,
          connection_status: "verification_failed",
          message: "The facility archive could not be reached — study retrieval failed. It may be offline or the DICOMweb endpoint is incorrect.",
        }, 409);
      }
      const testedDatetime = new Date().toISOString();
      await svc.entities.HospitalProfile.update(facility.id, {
        ohif_connection_status: "connected",
        ohif_connection_tested_datetime: testedDatetime,
      });
      await logClinicalAudit(base44, {
        actor_user_id: user.id,
        actor_name: user.full_name,
        actor_role: "hospital",
        action: "radiology_ohif_connection_test",
        action_label: "ran the embedded OHIF end-to-end study-retrieval test — the integration is now Connected",
        hospital: facility.hospital_name || "",
      });
      return json({
        tested: true,
        connection_status: "connected",
        tested_datetime: testedDatetime,
        studies_retrieved: studiesFound,
        message: `End-to-end test passed — ${studiesFound} study(ies) retrieved from the facility archive through the deployed OHIF integration. The integration is now Connected.`,
      });
    }

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
      ohif_configured: pacsEnabled && pacsMode === "ohif_embedded" ? !!String(pacsProfile.ohif_base_url || "").trim() : false,
      ohif_connection_status:
        pacsEnabled && pacsMode === "ohif_embedded"
          ? String(pacsProfile.ohif_connection_status || "pending_configuration")
          : "not_applicable",
      ohif_connected:
        pacsEnabled &&
        pacsMode === "ohif_embedded" &&
        String(pacsProfile.ohif_connection_status || "pending_configuration") === "connected",
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
      if (!isHttpUrl(dicomwebBase)) {
        return json({
          verified: false,
          message: "The configured DICOMweb (QIDO) Base URL is not a valid http(s) endpoint — the hospital administrator must correct it in the Hospital Portal, Radiology Department tab, Imaging System Connection.",
        }, 409);
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
          message: "This facility's imaging system is not connected yet. The hospital administrator must connect it in the Hospital Portal (Radiology Department tab — Imaging System Connection) after confirming the vendor's supported integration method.",
        }, 409);
      }
      const template = String(pacsProfile.pacs_viewer_url_template || "").trim();
      // Every refused attempt is audited with its reason — and carries no more
      // patient data than the request reference itself.
      const refuseLaunch = async (message: string): Promise<Response> => {
        await logClinicalAudit(base44, {
          actor_user_id: user.id,
          actor_name: user.full_name,
          actor_role: actorRole,
          action: "radiology_pacs_launch_refused",
          action_label: "attempted to open the study in the facility imaging system — launch refused",
          patient_id: request.patient_id,
          document_id: request.request_id,
          hospital: request.routed_hospital || request.doctor_hospital,
        });
        return json({ mode: pacsMode, launch_url: null, launch_attempted: true, launch_outcome: "refused", message }, 409);
      };
      if (pacsMode === "desktop_app" && !(template && isDocumentedLaunchUrl(template))) {
        const vendor = pacsProfile.pacs_vendor_name || "the vendor";
        return refuseLaunch(
          `The facility's imaging software (${vendor}) is a desktop application and no vendor-documented launch URL or protocol is recorded, so AMedix cannot open the study automatically. ` +
          `Open the study manually in the desktop software using the accession number${accession ? ` ${accession}` : ` (AMedix reference ${request.request_id || ""})`}. ` +
          `To enable automatic launching, the hospital administrator must record the vendor's documented launch URL or protocol in the Hospital Portal, Radiology Department tab, Imaging System Connection.`
        );
      }
      if (!template) {
        return refuseLaunch("The facility imaging system is connected, but no viewer launch URL template is configured yet.");
      }
      if (!isDocumentedLaunchUrl(template)) {
        return refuseLaunch(
          "The recorded Viewer Launch URL Template is not a valid web or protocol launch URL — it looks like a local file path. The hospital administrator must record the vendor's DOCUMENTED launch URL or protocol (for example https://... or scheme://...) in the Hospital Portal, Radiology Department tab, Imaging System Connection."
        );
      }
      if (template.includes("{study_instance_uid}") && !studyUid) {
        return refuseLaunch(
          "The DICOM Study Instance UID is not recorded for this study, so the imaging system cannot be opened to the right examination. The department must record it on the imaging request."
        );
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
        encounter_id: request.encounter_id,
        document_id: request.request_id,
        hospital: request.routed_hospital || request.doctor_hospital,
      });
      return json({ mode: pacsMode, launch_url: launchUrl, launch_token_expires_in_minutes: expiresInMinutes });
    }

    // ===== OHIF — embedded viewer launch for facilities running their OWN
    // approved OHIF deployment. The study is opened through OHIF's documented
    // routing; the URL carries ONLY the Study Instance UID (and, when the
    // deployment's route requires it, the accession number) — never patient
    // name, CIN or credentials. Study availability is confirmed against the
    // facility's DICOMweb (QIDO) archive endpoint when one is configured.
    if (action === "ohif_launch") {
      const refuseOhif = async (message: string): Promise<Response> => {
        await logClinicalAudit(base44, {
          actor_user_id: user.id,
          actor_name: user.full_name,
          actor_role: actorRole,
          action: "radiology_pacs_launch_refused",
          action_label: "attempted to open the study in the embedded OHIF viewer — launch refused",
          patient_id: request.patient_id,
          document_id: request.request_id,
          hospital: request.routed_hospital || request.doctor_hospital,
        });
        return json({ mode: pacsMode, launch_url: null, launch_attempted: true, launch_outcome: "refused", message }, 409);
      };
      if (pacsMode !== "ohif_embedded") {
        return refuseOhif(
          "This facility is not connected with an embedded OHIF deployment. The hospital administrator selects the OHIF Viewer (embedded) integration type and records the deployment's https:// Base URL in the Hospital Portal, Radiology Department tab, Imaging System Connection."
        );
      }
      if (String(pacsProfile.ohif_connection_status || "pending_configuration") !== "connected") {
        return refuseOhif(
          "Launching is disabled — the embedded OHIF integration is Pending configuration. Deployment of the facility's approved OHIF instance is required, and the hospital administrator must pass the end-to-end study-retrieval test in the Hospital Portal (Radiology Department tab, Imaging System Connection) before studies can be opened."
        );
      }
      const ohifBase = String(pacsProfile.ohif_base_url || "").trim().replace(/\/+$/, "");
      if (!ohifBase) {
        return refuseOhif(
          "The connected OHIF integration has no Base URL recorded — the hospital administrator must correct this in the Hospital Portal, Radiology Department tab, Imaging System Connection."
        );
      }
      if (!/^https:\/\//i.test(ohifBase)) {
        return refuseOhif(
          "The recorded OHIF Base URL is not an https:// address. Only HTTPS deployments may be embedded — the hospital administrator must correct it in Imaging System Connection."
        );
      }
      if (!studyUid) {
        return refuseOhif(
          "The DICOM Study Instance UID is not recorded for this study, so OHIF cannot open the right examination. The department must record it on the imaging request; the AMedix request reference alone is not a valid study identifier."
        );
      }
      // Confirm the study exists in the archive (when AMedix has a DICOMweb
      // endpoint) BEFORE opening the viewer — never open a guessed study.
      let availability = "unconfirmed";
      let availabilityMessage =
        "Study availability could not be confirmed — no DICOMweb (QIDO) endpoint is configured for this facility, so AMedix cannot verify the study exists in the archive before opening OHIF.";
      const dicomwebBase = String(pacsProfile.pacs_dicomweb_base_url || "").trim().replace(/\/+$/, "");
      if (dicomwebBase) {
        if (!isHttpUrl(dicomwebBase)) {
          return refuseOhif(
            "The configured DICOMweb (QIDO) Base URL is not a valid http(s) endpoint — the hospital administrator must correct it in Imaging System Connection."
          );
        }
        try {
          const probe = await fetch(`${dicomwebBase}/studies?StudyInstanceUID=${encodeURIComponent(studyUid)}&limit=1`, {
            signal: AbortSignal.timeout(10000),
            headers: { Accept: "application/dicom+json" },
          });
          if (probe.ok) {
            const rows = await probe.json().catch(() => []);
            if (Array.isArray(rows) && rows.length > 0) {
              availability = "verified";
              availabilityMessage = "The study was found in the facility imaging archive.";
            } else {
              return refuseOhif(
                "The facility archive answered, but this Study Instance UID was not found in it — the study mapping must be corrected before OHIF is opened, so no unrelated study can be loaded."
              );
            }
          } else if (probe.status === 401 || probe.status === 403) {
            return refuseOhif(
              "The facility archive requires authentication for its DICOMweb endpoint — the vendor's service credentials must be configured as server-side secrets before studies can be opened."
            );
          } else {
            return refuseOhif(`The facility archive answered with HTTP ${probe.status} — the study could not be confirmed.`);
          }
        } catch {
          return refuseOhif(
            "The facility archive could not be reached — it may be offline or the DICOMweb endpoint is incorrect. OHIF was not opened."
          );
        }
      }
      const routeTemplate = String(pacsProfile.ohif_route_template || "").trim();
      let launchUrl: string;
      if (routeTemplate) {
        if (!/^https:\/\//i.test(routeTemplate)) {
          return refuseOhif(
            "The recorded OHIF route template is not an https:// URL — the hospital administrator must correct it in Imaging System Connection."
          );
        }
        launchUrl = buildLaunchUrl(routeTemplate, { study_instance_uid: studyUid, accession_number: accession });
      } else {
        launchUrl = `${ohifBase}/viewer?StudyInstanceUIDs=${encodeURIComponent(studyUid)}`;
      }
      await logClinicalAudit(base44, {
        actor_user_id: user.id,
        actor_name: user.full_name,
        actor_role: actorRole,
        action: "radiology_pacs_study_launched",
        action_label: "opened the study in the embedded OHIF viewer",
        patient_id: request.patient_id,
        encounter_id: request.encounter_id,
        document_id: request.request_id,
        hospital: request.routed_hospital || request.doctor_hospital,
      });
      return json({
        mode: "ohif_embedded",
        launch_url: launchUrl,
        viewer_base: ohifBase,
        study_availability: availability,
        availability_message: availabilityMessage,
      });
    }

    return json({ error: "Unknown action." }, 400);
  } catch (error: any) {
    return json({ error: error.message }, 500);
  }
}