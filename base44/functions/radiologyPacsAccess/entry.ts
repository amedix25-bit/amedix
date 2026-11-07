import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { secrets } from 'base44:runtime';
import { authorizeRadiologyStudy } from "../../shared/radiologyStudyAccess.ts";
import { logClinicalAudit } from "../../shared/clinicalAudit.ts";
import {
  RADIANT_TEMPLATE_STUDY_UID,
  RADIANT_LAUNCH_ONLY_URL,
  buildRadiantLaunchUrl,
  manualRetrieval,
  radiantTemplateIssue,
  radiantTemplateNeeds,
  studyMappingMismatch,
  verifyRadiantStudyAvailability,
} from "../../shared/radiantViewer.ts";

// Imaging Viewer integration — secure bridge to the facility's EXISTING
// imaging software (PACS / RIS / web viewer / desktop application).
//
// Security model:
// - The imaging integration configuration lives on EACH FACILITY's own
//   HospitalProfile — there is no global PACS URL. Every configuration is
//   edited and tested only by that facility's authorized administrator,
//   through this function (never directly from the browser).
// - The PACS configuration is never readable by radiologists (Row Level
//   Security) — every launch is built and authorized SERVER-SIDE, so no
//   vendor URL template or credential reaches the browser.
// - DICOMweb (QIDO) verification runs server-side with the facility-approved
//   authentication method; the credential VALUE lives only in a server-side
//   secret referenced by NAME in the configuration.
// - Launch tokens ({launch_token} placeholder) are cryptographically random,
//   single use and expire after 15 minutes; vendors validate them through the
//   GET endpoint of this function.
// - Every launch, refusal, configuration change and connection test is
//   recorded in the clinical audit log.
// - Studies are matched by the AMedix request ID and the DICOM Study Instance
//   UID recorded by the department — never by patient name alone, and never
//   by a UID without confirming it against the facility's own archive.
// - DEVELOPMENT MODE: while no hospital PACS is connected, the integration is
//   in development mode — test flows use clearly-flagged SIMULATED responses.
//   A simulated result is NEVER marked Connected and never implies that a
//   real PACS integration has been verified.

const ALLOWED_LAUNCH_PLACEHOLDERS = ["study_instance_uid", "accession_number", "request_id", "launch_token"];
// Patient identifiers must never travel in viewer URLs — {patient_cin} is
// intentionally NOT in the allowed set and is rejected with an actionable
// message wherever it appears.

function json(data: any, status = 200): Response {
  return Response.json(data, { status });
}

function templatePlaceholders(template: string): string[] {
  const found = String(template).match(/\{([a-z_]+)\}/g) || [];
  return found.map((p) => p.slice(1, -1));
}

function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

// A DOCUMENTED launch URL is either a web endpoint (https://...) or the
// vendor's own documented custom protocol handler (scheme://...). A bare
// filesystem path (e.g. /Applications/Viewer.app) is NOT launchable and is
// rejected with a clear setup message — never guessed into a launch.
function isDocumentedLaunchUrl(value: string): boolean {
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(value);
}

// A deployable OHIF address: a well-formed https:// URL on a real host —
// never the public OHIF demo or a reserved example/placeholder domain.
function isValidOhifUrl(value: string): boolean {
  try {
    const u = new URL(value);
    if (u.protocol !== "https:" || !u.hostname || u.username || u.password) return false;
    const host = u.hostname.toLowerCase();
    const blocked = ["ohif.org", "www.ohif.org", "demo.ohif.org", "o.ohif.org", "example.com", "www.example.com", "example.org", "example.net", "localhost"];
    return !blocked.includes(host) && !host.endsWith(".example") && !host.endsWith(".test") && !host.endsWith(".local");
  } catch {
    return false;
  }
}

// Server-side launch-URL substitution: placeholders are replaced with
// URL-encoded values, and only identifiers the workflow actually needs —
// never patient names, CINs or credentials.
function buildLaunchUrl(template: string, values: Record<string, string>): string {
  let url = template;
  for (const [key, value] of Object.entries(values)) {
    url = url.split(`{${key}}`).join(encodeURIComponent(value));
  }
  return url;
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

// FACILITY-SCOPED derived connection status — the single honest summary of
// where this facility's imaging integration stands:
//   development_mode      no imaging system connected at all (test-only phase)
//   disabled              configured before, but switched off
//   pending_configuration saved, but the required end-to-end test has not passed
//   connected             the required end-to-end checks passed
//   failed                the last required check failed
function derivePacsStatus(h: any): string {
  if (!h.pacs_integration_enabled) {
    const configured =
      String(h.pacs_integration_type || "none") !== "none" ||
      String(h.pacs_vendor_name || "").trim().length > 0;
    return configured ? "disabled" : "development_mode";
  }
  const type = String(h.pacs_integration_type || "none");
  if (type === "radiant") {
    // RadiAnt is verified in TWO independent steps: the desktop launch itself
    // (operator-confirmed) and, only when a DICOMweb endpoint is recorded, the
    // server-side archive checks. Both must pass before the integration counts
    // as functional — a launch request alone never does.
    const launch = String((h.radiant_last_test_result || {}).outcome || "");
    if (launch === "launch_failed") return "failed";
    if (launch !== "launch_confirmed") return "pending_configuration";
    if (!String(h.pacs_dicomweb_base_url || "").trim()) return "connected";
    const dicom = String((h.pacs_last_test_result || {}).outcome || "");
    return dicom === "connected" ? "connected" : dicom === "failed" ? "failed" : "pending_configuration";
  }
  if (type === "ohif_embedded") {
    const s = String(h.ohif_connection_status || "pending_configuration");
    return s === "connected" ? "connected" : s === "verification_failed" ? "failed" : "pending_configuration";
  }
  const outcome = String((h.pacs_last_test_result || {}).outcome || "");
  if (outcome === "connected") return "connected";
  if (outcome === "failed") return "failed";
  return "pending_configuration";
}

// Server-side DICOMweb authentication — the facility-approved method, with
// the credential read ONLY from a server-side secret (referenced by name in
// the configuration). The credential value never reaches the browser, URLs
// or logs.
async function dicomwebHeaders(facility: any): Promise<{ headers: Record<string, string>; error: string | null }> {
  const headers: Record<string, string> = { Accept: "application/dicom+json" };
  const type = String(facility.pacs_dicomweb_auth_type || "none");
  const secretName = String(facility.pacs_dicomweb_auth_secret_name || "").trim();
  if (type === "none" || !secretName) return { headers, error: null };
  let credential: string | null = null;
  try {
    credential = secrets.get(secretName) || null;
  } catch {
    credential = null;
  }
  if (!credential) {
    return {
      headers,
      error: `The server-side secret "${secretName}" holding this facility's DICOMweb service credential is not configured (Dashboard — Secrets). Add the credential the vendor approved, with exactly that secret name.`,
    };
  }
  if (type === "bearer") {
    headers.Authorization = `Bearer ${credential}`;
  } else {
    // Basic — the secret holds "user:password" (or a pre-encoded base64 pair).
    const encoded = credential.includes(":") ? btoa(credential) : credential;
    headers.Authorization = `Basic ${encoded}`;
  }
  return { headers, error: null };
}

type Check = { key: string; label: string; outcome: string; message: string };

// Secure, server-side DICOMweb (QIDO) verification — reachability,
// authentication and study retrieval, each reported separately. When a test
// Study Instance UID is supplied, the retrieved identifiers must MATCH it —
// a study is never assumed to belong to the facility from a UID alone.
async function runDicomwebChecks(dicomwebBase: string, facility: any, testStudyUid: string): Promise<Check[]> {
  const checks: Check[] = [];
  const { headers, error: credentialError } = await dicomwebHeaders(facility);
  if (credentialError) {
    checks.push({ key: "dicomweb_reach", label: "DICOMweb endpoint reachability", outcome: "not_tested", message: "Not tested — the service credential is not available on the server." });
    checks.push({ key: "dicomweb_auth", label: "DICOMweb authentication", outcome: "failed", message: credentialError });
    checks.push({ key: "study_retrieval", label: "Study retrieval (QIDO)", outcome: "not_tested", message: "Not tested — authentication did not pass." });
    if (testStudyUid) {
      checks.push({ key: "identifier_match", label: "Test study identifier match", outcome: "not_tested", message: "Not tested — authentication did not pass." });
    }
    return checks;
  }
  const authConfigured = String(facility.pacs_dicomweb_auth_type || "none") !== "none";
  let rows: any[] = [];
  try {
    const probe = await fetch(`${dicomwebBase}/studies?limit=1`, { signal: AbortSignal.timeout(10000), headers });
    if (probe.status === 401 || probe.status === 403) {
      checks.push({ key: "dicomweb_reach", label: "DICOMweb endpoint reachability", outcome: "passed", message: "The endpoint answered, but it requires authentication." });
      checks.push({
        key: "dicomweb_auth",
        label: "DICOMweb authentication",
        outcome: "failed",
        message: "The endpoint rejected the request (HTTP 401/403). Record the vendor's approved authentication method and add its service credential as a server-side secret, then run the test again. Authentication is never bypassed.",
      });
      checks.push({ key: "study_retrieval", label: "Study retrieval (QIDO)", outcome: "not_tested", message: "Not tested — authentication did not pass." });
      if (testStudyUid) {
        checks.push({ key: "identifier_match", label: "Test study identifier match", outcome: "not_tested", message: "Not tested — authentication did not pass." });
      }
      return checks;
    }
    if (!probe.ok) {
      checks.push({ key: "dicomweb_reach", label: "DICOMweb endpoint reachability", outcome: "failed", message: `The endpoint answered with HTTP ${probe.status} — it is not serving studies correctly.` });
      checks.push({ key: "dicomweb_auth", label: "DICOMweb authentication", outcome: "not_tested", message: "Not tested — the endpoint is not reachable in a working state." });
      checks.push({ key: "study_retrieval", label: "Study retrieval (QIDO)", outcome: "not_tested", message: "Not tested — the endpoint is not reachable in a working state." });
      if (testStudyUid) {
        checks.push({ key: "identifier_match", label: "Test study identifier match", outcome: "not_tested", message: "Not tested — the endpoint is not reachable in a working state." });
      }
      return checks;
    }
    rows = await probe.json().catch(() => []);
    checks.push({ key: "dicomweb_reach", label: "DICOMweb endpoint reachability", outcome: "passed", message: "The endpoint answered and serves DICOMweb study queries." });
    checks.push({
      key: "dicomweb_auth",
      label: "DICOMweb authentication",
      outcome: "passed",
      message: authConfigured
        ? "The endpoint accepted the facility's configured service credential."
        : "The endpoint answered without authentication — acceptable only for the facility's approved test environment; production deployments must require authentication.",
    });
    checks.push({
      key: "study_retrieval",
      label: "Study retrieval (QIDO)",
      outcome: Array.isArray(rows) && rows.length > 0 ? "passed" : "failed",
      message: Array.isArray(rows) && rows.length > 0
        ? `Retrieved ${rows.length} study(ies) from the facility archive through its DICOMweb endpoint.`
        : "The endpoint answered, but no study could be retrieved from it — at least one study must be retrievable for the end-to-end test to pass.",
    });
  } catch {
    checks.push({ key: "dicomweb_reach", label: "DICOMweb endpoint reachability", outcome: "failed", message: "The endpoint could not be reached — it may be offline, firewalled, or the base URL is incorrect." });
    checks.push({ key: "dicomweb_auth", label: "DICOMweb authentication", outcome: "not_tested", message: "Not tested — the endpoint could not be reached." });
    checks.push({ key: "study_retrieval", label: "Study retrieval (QIDO)", outcome: "not_tested", message: "Not tested — the endpoint could not be reached." });
    if (testStudyUid) {
      checks.push({ key: "identifier_match", label: "Test study identifier match", outcome: "not_tested", message: "Not tested — the endpoint could not be reached." });
    }
    return checks;
  }
  if (testStudyUid) {
    try {
      const probe = await fetch(`${dicomwebBase}/studies?StudyInstanceUID=${encodeURIComponent(testStudyUid)}`, {
        signal: AbortSignal.timeout(10000),
        headers,
      });
      const rows2 = probe.ok ? await probe.json().catch(() => []) : [];
      const matched = Array.isArray(rows2) && rows2.some(
        (r: any) => String(r?.["0020000D"]?.Value?.[0] || "") === testStudyUid
      );
      checks.push({
        key: "identifier_match",
        label: "Test study identifier match",
        outcome: matched ? "passed" : "failed",
        message: matched
          ? "The archive returned exactly the expected test study — the facility and study identifiers match."
          : probe.ok
            ? "The archive answered, but the expected test study was not found in it (or its identifiers did not match) — a study is never assumed to belong to the facility from a UID alone."
            : `The archive answered with HTTP ${probe.status} for the test study query.`,
      });
    } catch {
      checks.push({ key: "identifier_match", label: "Test study identifier match", outcome: "failed", message: "The archive could not be reached during the test-study check." });
    }
  }
  return checks;
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

    // ===== POST — save_config / connection_test / status / verify / launch
    const user = await base44.auth.me();
    if (!user) return json({ error: "Unauthorized" }, 401);
    const body = await req.json().catch(() => ({}));
    const payload = body && typeof body === "object" ? body : {};
    // The launch-only RadiAnt test is identified by its own flag as well as by
    // its action name, so this independent test can never fall through to any
    // imaging-request handling (which would report "Select the imaging request").
    const launchOnlyAction =
      payload.launch_only === true
        ? String(payload.launch_step || "") === "confirm"
          ? "radiant_launch_only_confirm"
          : "radiant_launch_only_test"
        : "";
    const action = String(payload.action || launchOnlyAction || "status");
    const requestId = String(payload.request_id || "").trim();

    // ===== CONFIGURATION SAVE — facility-administrator-only, server-validated.
    // Required fields are enforced per integration method; URL templates are
    // checked for permitted placeholders; patient identifiers are never
    // permitted in viewer URLs; and ANY relevant change invalidates the
    // previous successful verification and bumps the configuration version.
    if (action === "save_config") {
      const hospitals = await svc.entities.HospitalProfile.filter({ user_id: user.id });
      const profileId = String(payload.hospital_profile_id || "").trim();
      const facility =
        (profileId ? hospitals.find((h: any) => h.id === profileId) : null) ||
        hospitals[0] ||
        null;
      if (!facility) return json({ error: "No facility profile is linked to this administrator account." }, 404);
      const config = payload.config && typeof payload.config === "object" ? payload.config : {};
      const enabled = !!config.pacs_integration_enabled;
      const type = enabled ? String(config.pacs_integration_type || "none") : "none";
      if (enabled && !["radiant", "dicomweb", "web_viewer", "desktop_app", "ohif_embedded"].includes(type)) {
        return json({ error: "Unknown integration type." }, 400);
      }
      const vendor = String(config.pacs_vendor_name || "").trim();
      const template = String(config.pacs_viewer_url_template || "").trim();
      const dicomwebBase = String(config.pacs_dicomweb_base_url || "").trim();
      const ohifBase = String(config.ohif_base_url || "").trim();
      const ohifRoute = String(config.ohif_route_template || "").trim();
      const notes = String(config.pacs_vendor_notes || "").trim();
      const authType = String(config.pacs_dicomweb_auth_type || "none");
      const authSecret = String(config.pacs_dicomweb_auth_secret_name || "").trim().toUpperCase();

      // RadiAnt DICOM Viewer — desktop launch by radiant:// protocol, with the
      // facility PACS networking details recorded for the integration record.
      const radiantTemplate = String(config.pacs_radiant_launch_template || "").trim() ||
        (enabled && type === "radiant" ? RADIANT_TEMPLATE_STUDY_UID : "");
      const pacsHost = String(config.pacs_host || "").trim();
      const rawPort = config.pacs_port;
      const pacsPort = rawPort === "" || rawPort === null || rawPort === undefined ? null : Number(rawPort);
      const calledAe = String(config.pacs_called_ae_title || "").trim().toUpperCase();
      const callingAe = String(config.pacs_calling_ae_title || "").trim().toUpperCase();
      const aeTitleIssue = (label: string, value: string): string | null =>
        value && !/^[A-Z0-9][A-Z0-9 _.-]{0,15}$/i.test(value)
          ? `${label} must be a DICOM AE Title of up to 16 characters (letters, digits, space, underscore, hyphen or dot).`
          : null;

      const errors: string[] = [];
      if (enabled && !vendor) errors.push("Vendor / product name is required for every integration method.");
      if (dicomwebBase && !isHttpUrl(dicomwebBase)) errors.push("The DICOMweb (QIDO) Base URL must be a valid http(s) endpoint (e.g. https://pacs.example.com/dicom-web).");
      if (enabled && type === "dicomweb" && !dicomwebBase) errors.push("The DICOMweb / PACS integration method requires the DICOMweb (QIDO) Base URL.");
      if (enabled && type === "web_viewer" && !template) errors.push("The web viewer method requires the vendor's documented viewer launch URL template.");
      if (enabled && type === "radiant") {
        const radiantIssue = radiantTemplateIssue(radiantTemplate);
        if (radiantIssue) errors.push(radiantIssue);
        if (!pacsHost) errors.push("The RadiAnt integration requires the PACS IP address or hostname confirmed by the PACS administrator.");
        if (pacsPort === null || !Number.isFinite(pacsPort) || pacsPort < 1 || pacsPort > 65535) {
          errors.push("The PACS DICOM port must be a number between 1 and 65535 (typically 104 or 11112).");
        }
        if (!calledAe) errors.push("The RadiAnt integration requires the PACS AE Title confirmed by the PACS administrator.");
        const aeIssues = [aeTitleIssue("The PACS AE Title", calledAe), aeTitleIssue("The calling AE Title", callingAe)].filter(Boolean);
        if (aeIssues.length) errors.push(aeIssues.join(" "));
      }
      if (template) {
        if (!isDocumentedLaunchUrl(template)) errors.push("The viewer launch URL template must be a web or protocol URL (for example https://... or scheme://...) — a local file path cannot be launched from AMedix.");
        const bad = templatePlaceholders(template).filter((p) => !ALLOWED_LAUNCH_PLACEHOLDERS.includes(p));
        if (bad.length) {
          errors.push(
            `The launch template uses unsupported placeholder(s): {${bad.join("}, {")}}. Supported: {study_instance_uid}, {accession_number}, {request_id}, {launch_token}. {patient_cin} is no longer permitted — patient identifiers must never appear in viewer URLs.`
          );
        }
      }
      if (enabled && type === "ohif_embedded" && ohifBase && !isValidOhifUrl(ohifBase)) {
        errors.push("The OHIF Base URL must be the https:// address of the facility's own approved deployment — the public OHIF demo and placeholder or example addresses are rejected. It may stay empty while deployment is pending.");
      }
      if (ohifRoute) {
        if (!/^https:\/\//i.test(ohifRoute)) errors.push("The OHIF route template must be an https:// URL of the facility's own deployment.");
        const bad = ohifRoute && templatePlaceholders(ohifRoute).filter((p) => !["study_instance_uid", "accession_number"].includes(p));
        if (bad && bad.length) errors.push(`The OHIF route template uses unsupported placeholder(s): {${bad.join("}, {")}}. Only {study_instance_uid} and {accession_number} are documented for OHIF routes.`);
      }
      if (!["none", "bearer", "basic"].includes(authType)) errors.push("Unknown DICOMweb authentication method — use none, bearer or basic.");
      if (authType !== "none") {
        if (!authSecret) errors.push("Record the NAME of the server-side secret holding the vendor's service credential (the credential value itself is never stored in this configuration).");
        else if (!/^[A-Z][A-Z0-9_]{2,}$/.test(authSecret)) errors.push("The secret reference must be a secret NAME (e.g. PACS_VENDOR_TOKEN) — never the credential value itself.");
      }
      if (errors.length) return json({ error: errors.join(" ") }, 400);

      // Invalidation: any change to the endpoints, route, authentication,
      // enable state or integration type voids the previous verification.
      const relevantChanged =
        enabled !== !!facility.pacs_integration_enabled ||
        type !== String(facility.pacs_integration_type || "none") ||
        template !== String(facility.pacs_viewer_url_template || "").trim() ||
        dicomwebBase !== String(facility.pacs_dicomweb_base_url || "").trim() ||
        ohifBase !== String(facility.ohif_base_url || "").trim() ||
        ohifRoute !== String(facility.ohif_route_template || "").trim() ||
        authType !== String(facility.pacs_dicomweb_auth_type || "none") ||
        radiantTemplate !== String(facility.pacs_radiant_launch_template || "").trim() ||
        pacsHost !== String(facility.pacs_host || "").trim() ||
        (pacsPort === null ? "" : String(pacsPort)) !== (facility.pacs_port === null || facility.pacs_port === undefined ? "" : String(facility.pacs_port)) ||
        calledAe !== String(facility.pacs_called_ae_title || "").trim().toUpperCase() ||
        callingAe !== String(facility.pacs_calling_ae_title || "").trim().toUpperCase() ||
        authSecret !== String(facility.pacs_dicomweb_auth_secret_name || "").trim();
      const version = relevantChanged ? (Number(facility.pacs_config_version) || 1) + 1 : Number(facility.pacs_config_version) || 1;
      const update: any = {
        pacs_integration_enabled: enabled,
        pacs_integration_type: type,
        pacs_vendor_name: vendor,
        pacs_viewer_url_template: template,
        pacs_radiant_launch_template: radiantTemplate,
        pacs_host: pacsHost,
        pacs_port: pacsPort,
        pacs_called_ae_title: calledAe,
        pacs_calling_ae_title: callingAe,
        pacs_dicomweb_base_url: dicomwebBase,
        pacs_vendor_notes: notes,
        ohif_base_url: ohifBase,
        ohif_route_template: ohifRoute,
        pacs_dicomweb_auth_type: authType,
        pacs_dicomweb_auth_secret_name: authType === "none" ? "" : authSecret,
        pacs_updated_datetime: new Date().toISOString(),
        pacs_config_version: version,
      };
      if (relevantChanged) {
        update.ohif_connection_status = "pending_configuration";
        // A configuration change invalidates the operator-confirmed RadiAnt
        // launch test — the launch path must be re-tested against the new setup.
        update.radiant_last_test_result = { outcome: "pending_configuration", confirmed: false, message: "The configuration changed — run Test RadiAnt Launch again." };
      }
      const updated = await svc.entities.HospitalProfile.update(facility.id, update);
      await logClinicalAudit(base44, {
        actor_user_id: user.id,
        actor_name: user.full_name,
        actor_role: "hospital",
        action: "radiology_pacs_config_saved",
        action_label: `updated the imaging integration configuration for ${facility.hospital_name || "the facility"} (configuration version ${version})${relevantChanged ? " — the previous verification was invalidated" : ""}`,
        hospital: facility.hospital_name || "",
      });
      return json({ ok: true, config_version: version, verification_invalidated: relevantChanged, profile: updated });
    }

    // ===== CONNECTION TEST — facility-administrator-only end-to-end
    // verification. Each check is reported separately (passed / failed /
    // not tested). The integration is marked Connected ONLY when every
    // REQUIRED check for the selected method passes against the REAL
    // configured environment. In development mode (no hospital PACS
    // configured) the test returns a clearly-flagged SIMULATED response and
    // never changes any connection status.
    if (action === "connection_test" || action === "ohif_test") {
      const hospitals = await svc.entities.HospitalProfile.filter({ user_id: user.id });
      const profileId = String(payload.hospital_profile_id || "").trim();
      const facility =
        (profileId ? hospitals.find((h: any) => h.id === profileId) : null) ||
        hospitals.find((h: any) => h.pacs_integration_enabled && h.pacs_integration_type === "ohif_embedded") ||
        hospitals[0] ||
        null;
      if (!facility) return json({ error: "No facility profile is linked to this administrator account." }, 404);
      const testStudyUid = String(payload.test_study_uid || "").trim();

      // Development mode — nothing is configured: report a SIMULATED result,
      // clearly labelled, and never mark anything Connected.
      if (!facility.pacs_integration_enabled || String(facility.pacs_integration_type || "none") === "none") {
        return json({
          tested: false,
          simulated: true,
          development_mode: true,
          connection_status: "development_mode",
          checks: [
            { key: "configuration", label: "Facility configuration", outcome: "not_tested", message: "Development mode — no hospital PACS connected. No real imaging endpoint is configured for this facility." },
          ],
          message: "Development mode — no hospital PACS connected. This is a SIMULATED test response for development only: no real imaging system was contacted, and no connection was marked Connected. A real integration is marked Connected only after the end-to-end test passes against the facility's configured environment.",
        });
      }

      const type = String(facility.pacs_integration_type || "none");
      const checks: Check[] = [];
      let requiredKeys: string[] = [];
      const dicomwebBase = String(facility.pacs_dicomweb_base_url || "").trim().replace(/\/+$/, "");
      const template = String(facility.pacs_viewer_url_template || "").trim();

      // Launch-template validation (web viewer / desktop launch methods).
      if (type === "web_viewer" || type === "desktop_app") {
        if (template && isDocumentedLaunchUrl(template) && templatePlaceholders(template).every((p) => ALLOWED_LAUNCH_PLACEHOLDERS.includes(p))) {
          checks.push({ key: "launch_template", label: "Viewer launch template", outcome: "passed", message: "The recorded launch template is a valid web or protocol URL with supported placeholders only." });
        } else if (type === "web_viewer") {
          checks.push({ key: "launch_template", label: "Viewer launch template", outcome: "failed", message: "The recorded launch template is missing or invalid — it must be the vendor's documented web or protocol URL with supported placeholders only." });
        } else {
          checks.push({ key: "launch_template", label: "Viewer launch template", outcome: "not_tested", message: "Desktop integration — no launch template recorded, so the study is opened manually with the accession number." });
        }
        if (type === "web_viewer") requiredKeys.push("launch_template");
      }

      // RadiAnt DICOM Viewer — this server-side test covers the RECORDED
      // configuration (PACS networking details, optional DICOMweb). Opening the
      // desktop viewer is a different operation and is verified separately with
      // Test RadiAnt Launch, because no server call can confirm that a Windows
      // application opened on the radiologist's workstation.
      if (type === "radiant") {
        const host = String(facility.pacs_host || "").trim();
        const port = Number(facility.pacs_port) || 0;
        const calledAe = String(facility.pacs_called_ae_title || "").trim();
        checks.push({
          key: "pacs_networking",
          label: "PACS networking record",
          outcome: host && port && calledAe ? "passed" : "failed",
          message: host && port && calledAe
            ? `${host}:${port} · AE Title ${calledAe}. RadiAnt on each workstation retrieves the study from this PACS directly; AMedix never opens a DICOM connection itself.`
            : "The PACS IP address/hostname, DICOM port and PACS AE Title confirmed by the PACS administrator are incomplete.",
        });
        checks.push({
          key: "radiant_launch",
          label: "RadiAnt desktop launch",
          outcome: "not_tested",
          message: "Verified separately with Test RadiAnt Launch — whether the desktop application opened cannot be confirmed from the server.",
        });
        requiredKeys.push("pacs_networking");
        if (dicomwebBase) {
          if (!isHttpUrl(dicomwebBase)) {
            checks.push({ key: "dicomweb_reach", label: "DICOMweb endpoint reachability", outcome: "failed", message: "The optional DICOMweb (QIDO) Base URL is not a valid http(s) endpoint — correct it or leave it empty." });
          } else {
            requiredKeys.push("dicomweb_reach", "study_retrieval");
            checks.push(...(await runDicomwebChecks(dicomwebBase, facility, testStudyUid)));
          }
        } else {
          checks.push({
            key: "dicomweb_reach",
            label: "DICOMweb endpoint reachability",
            outcome: "not_tested",
            message: "Optional for RadiAnt — no DICOMweb endpoint is recorded, so study availability is not verified server-side before a launch.",
          });
        }
      }

      // Embedded OHIF — the deployment itself must be reachable and serving.
      if (type === "ohif_embedded") {
        const ohifBase = String(facility.ohif_base_url || "").trim().replace(/\/+$/, "");
        requiredKeys.push("ohif_endpoint");
        if (!ohifBase) {
          checks.push({ key: "ohif_endpoint", label: "OHIF deployment", outcome: "not_tested", message: "Pending configuration — the OHIF Base URL is empty. Deploy the facility's approved OHIF instance (never the public demo) and record its https:// address." });
        } else if (!/^https:\/\//i.test(ohifBase)) {
          checks.push({ key: "ohif_endpoint", label: "OHIF deployment", outcome: "failed", message: "The recorded OHIF Base URL is not an https:// address — only HTTPS deployments may be connected." });
        } else {
          try {
            const probe = await fetch(ohifBase, { signal: AbortSignal.timeout(10000) });
            checks.push(
              probe.status < 500
                ? { key: "ohif_endpoint", label: "OHIF deployment", outcome: "passed", message: "The deployed OHIF instance is reachable and serving." }
                : { key: "ohif_endpoint", label: "OHIF deployment", outcome: "failed", message: `The OHIF deployment answered with HTTP ${probe.status} — it is not serving correctly yet.` }
            );
          } catch {
            checks.push({ key: "ohif_endpoint", label: "OHIF deployment", outcome: "failed", message: "The OHIF deployment could not be reached — it may not be deployed yet or the address is incorrect." });
          }
        }
        requiredKeys.push("dicomweb_reach", "study_retrieval");
        if (!dicomwebBase) {
          checks.push({ key: "dicomweb_reach", label: "DICOMweb endpoint reachability", outcome: "not_tested", message: "Not tested — the facility archive's DICOMweb (QIDO) Base URL is not recorded. The end-to-end test needs it to verify study retrieval." });
          checks.push({ key: "dicomweb_auth", label: "DICOMweb authentication", outcome: "not_tested", message: "Not tested — no DICOMweb endpoint is recorded." });
          checks.push({ key: "study_retrieval", label: "Study retrieval (QIDO)", outcome: "not_tested", message: "Not tested — no DICOMweb endpoint is recorded." });
          if (testStudyUid) {
            checks.push({ key: "identifier_match", label: "Test study identifier match", outcome: "not_tested", message: "Not tested — no DICOMweb endpoint is recorded." });
          }
        } else if (!isHttpUrl(dicomwebBase)) {
          checks.push({ key: "dicomweb_reach", label: "DICOMweb endpoint reachability", outcome: "failed", message: "The DICOMweb (QIDO) Base URL is not a valid http(s) endpoint — correct it and run the test again." });
          checks.push({ key: "dicomweb_auth", label: "DICOMweb authentication", outcome: "not_tested", message: "Not tested — the endpoint URL is invalid." });
          checks.push({ key: "study_retrieval", label: "Study retrieval (QIDO)", outcome: "not_tested", message: "Not tested — the endpoint URL is invalid." });
        } else {
          checks.push(...(await runDicomwebChecks(dicomwebBase, facility, testStudyUid)));
        }
      }

      // DICOMweb / PACS method — the archive itself is the integration.
      if (type === "dicomweb") {
        requiredKeys.push("dicomweb_reach", "study_retrieval");
        if (!dicomwebBase) {
          checks.push({ key: "dicomweb_reach", label: "DICOMweb endpoint reachability", outcome: "not_tested", message: "Not tested — the DICOMweb (QIDO) Base URL is not recorded." });
          checks.push({ key: "dicomweb_auth", label: "DICOMweb authentication", outcome: "not_tested", message: "Not tested — no DICOMweb endpoint is recorded." });
          checks.push({ key: "study_retrieval", label: "Study retrieval (QIDO)", outcome: "not_tested", message: "Not tested — no DICOMweb endpoint is recorded." });
          if (testStudyUid) {
            checks.push({ key: "identifier_match", label: "Test study identifier match", outcome: "not_tested", message: "Not tested — no DICOMweb endpoint is recorded." });
          }
        } else if (!isHttpUrl(dicomwebBase)) {
          checks.push({ key: "dicomweb_reach", label: "DICOMweb endpoint reachability", outcome: "failed", message: "The DICOMweb (QIDO) Base URL is not a valid http(s) endpoint — correct it and run the test again." });
          checks.push({ key: "dicomweb_auth", label: "DICOMweb authentication", outcome: "not_tested", message: "Not tested — the endpoint URL is invalid." });
          checks.push({ key: "study_retrieval", label: "Study retrieval (QIDO)", outcome: "not_tested", message: "Not tested — the endpoint URL is invalid." });
        } else {
          checks.push(...(await runDicomwebChecks(dicomwebBase, facility, testStudyUid)));
        }
      }

      // Web viewer / desktop with a configured archive — the archive is
      // verified as part of the end-to-end test when the vendor provides a
      // DICOMweb endpoint.
      if ((type === "web_viewer" || type === "desktop_app") && dicomwebBase) {
        if (!isHttpUrl(dicomwebBase)) {
          checks.push({ key: "dicomweb_reach", label: "DICOMweb endpoint reachability", outcome: "failed", message: "The DICOMweb (QIDO) Base URL is not a valid http(s) endpoint — correct it and run the test again." });
        } else {
          checks.push(...(await runDicomwebChecks(dicomwebBase, facility, testStudyUid)));
        }
      }

      const requiredChecks = checks.filter((c) => requiredKeys.includes(c.key) || c.key === "identifier_match");
      const anyRequiredFailed = requiredChecks.some((c) => c.outcome === "failed");
      const allRequiredPassed = requiredChecks.length > 0 && requiredChecks.every((c) => c.outcome === "passed");
      const outcome = anyRequiredFailed ? "failed" : allRequiredPassed ? "connected" : "pending_configuration";
      const testedDatetime = new Date().toISOString();

      const update: any = {
        pacs_last_test_result: {
          tested_datetime: testedDatetime,
          outcome,
          simulated: false,
          checks,
          message:
            outcome === "connected"
              ? "All required end-to-end checks passed against the configured facility environment."
              : outcome === "failed"
                ? "One or more required checks failed — the integration cannot be marked Connected until they pass."
                : "Some required checks are not complete yet — the integration stays Pending configuration.",
        },
      };
      if (type === "ohif_embedded") {
        update.ohif_connection_status = outcome === "connected" ? "connected" : outcome === "failed" ? "verification_failed" : "pending_configuration";
        if (outcome === "connected") update.ohif_connection_tested_datetime = testedDatetime;
      }
      await svc.entities.HospitalProfile.update(facility.id, update);
      await logClinicalAudit(base44, {
        actor_user_id: user.id,
        actor_name: user.full_name,
        actor_role: "hospital",
        action: "radiology_pacs_connection_test",
        action_label: `ran the imaging integration connection test for ${facility.hospital_name || "the facility"} — outcome: ${outcome}`,
        hospital: facility.hospital_name || "",
      });
      const summary =
        type === "radiant"
          ? outcome === "connected"
            ? "Every server-side check passed for the recorded configuration. Opening the desktop viewer is verified separately — run Test RadiAnt Launch and confirm that the correct examination opens."
            : outcome === "failed"
              ? "One or more required checks failed — see the per-check results below. The integration is not functional."
              : "Some required checks are not complete yet — complete the configuration and run the test again."
          : outcome === "connected"
          ? "End-to-end test passed — every required check succeeded against the configured facility environment. The integration is now Connected."
          : outcome === "failed"
            ? "One or more required checks failed — see the per-check results below. The integration is NOT Connected."
            : "Some required checks are not complete yet — the integration stays Pending configuration. Complete the configuration and run the test again.";
      return json({
        tested: true,
        simulated: false,
        connection_status: outcome,
        tested_datetime: testedDatetime,
        checks,
        message: summary,
      });
    }

    // ===== TEST RADIANT LAUNCH — facility-administrator-only, and deliberately
    // SEPARATE from the DICOMweb connection test: opening a desktop viewer and
    // verifying a server connection are different operations. This builds the
    // radiant:// URL for an approved test study so the administrator can see
    // whether the correct examination opens on their own workstation. The
    // launch is recorded as REQUESTED only — it becomes a confirmed success
    // solely when the operator records that the correct study appeared.
    if (action === "radiant_test") {
      const hospitals = await svc.entities.HospitalProfile.filter({ user_id: user.id });
      const profileId = String(payload.hospital_profile_id || "").trim();
      const facility = (profileId ? hospitals.find((h: any) => h.id === profileId) : null) || hospitals[0] || null;
      if (!facility) return json({ error: "No facility profile is linked to this administrator account." }, 404);
      if (!facility.pacs_integration_enabled || String(facility.pacs_integration_type || "none") !== "radiant") {
        return json({ error: "Select and save the RadiAnt DICOM Viewer integration type for this facility first, then run the launch test." }, 409);
      }
      const template = String(facility.pacs_radiant_launch_template || "").trim() || RADIANT_TEMPLATE_STUDY_UID;
      const templateIssue = radiantTemplateIssue(template);
      if (templateIssue) return json({ error: templateIssue }, 409);
      const testUid = String(payload.test_study_uid || "").trim();
      const testAccession = String(payload.test_accession_number || "").trim();
      const needs = radiantTemplateNeeds(template);
      const missingIdentifier = needs.uid && !testUid
        ? "a Study Instance UID"
        : needs.accession && !testAccession
          ? "an accession number"
          : "";
      if (missingIdentifier) {
        return json({ error: `Record ${missingIdentifier} for the approved test study — the recorded RadiAnt launch URL needs it to open the examination.` }, 400);
      }

      const checks: Check[] = [
        {
          key: "launch_template",
          label: "RadiAnt launch URL",
          outcome: "passed",
          message: `The recorded radiant:// launch URL is valid and opens the study by ${needs.uid ? "Study Instance UID" : "accession number"}. Confirm this exact syntax against RadiAnt's official documentation before clinical use.`,
        },
        {
          key: "test_identifier",
          label: "Approved test study",
          outcome: "passed",
          message: `Launch requested for${testUid ? ` Study Instance UID ${testUid}` : ""}${testAccession ? `${testUid ? " ·" : ""} accession number ${testAccession}` : ""}.`,
        },
      ];

      // Optional: confirm server-side that the study exists in the archive.
      const dicomwebBase = String(facility.pacs_dicomweb_base_url || "").trim().replace(/\/+$/, "");
      if (dicomwebBase && testUid && isHttpUrl(dicomwebBase)) {
        const { headers, error: credentialError } = await dicomwebHeaders(facility);
        if (credentialError) {
          checks.push({ key: "archive_lookup", label: "Archive study lookup", outcome: "failed", message: credentialError });
        } else {
          try {
            const probe = await fetch(`${dicomwebBase}/studies?StudyInstanceUID=${encodeURIComponent(testUid)}&limit=1`, {
              signal: AbortSignal.timeout(10000),
              headers,
            });
            const rows = probe.ok ? await probe.json().catch(() => []) : [];
            const foundOnArchive = Array.isArray(rows) && rows.length > 0;
            checks.push({
              key: "archive_lookup",
              label: "Archive study lookup",
              outcome: foundOnArchive ? "passed" : "not_tested",
              message: foundOnArchive
                ? "The test study was found in the facility archive through its DICOMweb endpoint."
                : "The test study could not be confirmed through the DICOMweb endpoint — RadiAnt queries the PACS from the workstation, so the launch can still be tested.",
            });
          } catch {
            checks.push({
              key: "archive_lookup",
              label: "Archive study lookup",
              outcome: "not_tested",
              message: "The DICOMweb endpoint could not be reached from the server — RadiAnt queries the PACS from the workstation, so the launch can still be tested.",
            });
          }
        }
      } else {
        checks.push({
          key: "archive_lookup",
          label: "Archive study lookup",
          outcome: "not_tested",
          message: testUid
            ? "Optional — no DICOMweb endpoint is recorded for this facility."
            : "Not tested — the launch uses the accession number.",
        });
      }

      const launchUrl = buildRadiantLaunchUrl(template, { studyUid: testUid, accession: testAccession });
      const result = {
        tested_datetime: new Date().toISOString(),
        outcome: "launch_requested",
        confirmed: false,
        test_study_uid: testUid,
        test_accession_number: testAccession,
        launcher_name: user.full_name || "",
        checks,
        message:
          "The launch request was sent to your browser. AMedix cannot detect whether RadiAnt opened — confirm that the correct examination is displayed, then record the result below.",
      };
      await svc.entities.HospitalProfile.update(facility.id, { radiant_last_test_result: result });
      await logClinicalAudit(base44, {
        actor_user_id: user.id,
        actor_name: user.full_name,
        actor_role: "hospital",
        action: "radiology_radiant_launch_test",
        action_label: `ran the RadiAnt launch test for ${facility.hospital_name || "the facility"} using the approved test study${testUid ? ` ${testUid}` : ""} — the desktop launch is unconfirmed until recorded`,
        hospital: facility.hospital_name || "",
      });
      return json({ ...result, launch_url: launchUrl, identifier_used: needs.uid ? "study_instance_uid" : "accession_number" });
    }

    // ===== RADIANT TEST CONFIRMATION — the operator states whether the correct
    // examination actually opened. Only a confirmed result makes the integration
    // functional; a launch request is never treated as a successful launch.
    if (action === "radiant_test_confirm") {
      const hospitals = await svc.entities.HospitalProfile.filter({ user_id: user.id });
      const profileId = String(payload.hospital_profile_id || "").trim();
      const facility = (profileId ? hospitals.find((h: any) => h.id === profileId) : null) || hospitals[0] || null;
      if (!facility) return json({ error: "No facility profile is linked to this administrator account." }, 404);
      const last = facility.radiant_last_test_result || {};
      if (String(last.outcome || "") !== "launch_requested") {
        return json({ error: "Run Test RadiAnt Launch first — there is no pending launch to confirm." }, 409);
      }
      const confirmed = payload.confirmed === true;
      const checks = Array.isArray(last.checks) ? last.checks.slice() : [];
      checks.push({
        key: "operator_confirmation",
        label: "Operator confirmation",
        outcome: confirmed ? "passed" : "failed",
        message: confirmed
          ? "The administrator confirmed that the correct examination opened in RadiAnt DICOM Viewer."
          : "The administrator reported that the correct examination did not open in RadiAnt.",
      });
      const confirmedDatetime = new Date().toISOString();
      const result = {
        ...last,
        confirmed_datetime: confirmedDatetime,
        confirmed,
        confirmed_by_name: user.full_name || "",
        outcome: confirmed ? "launch_confirmed" : "launch_failed",
        checks,
        message: confirmed
          ? "Confirmed — the approved test study opened in RadiAnt DICOM Viewer. Radiologists can now open studies from their imaging requests."
          : "The correct examination did not open in RadiAnt. Check that RadiAnt is installed on the workstation, that its own PACS connection is configured, and that the launch URL matches RadiAnt's documented syntax, then test again.",
      };
      const updated = await svc.entities.HospitalProfile.update(facility.id, { radiant_last_test_result: result });
      await logClinicalAudit(base44, {
        actor_user_id: user.id,
        actor_name: user.full_name,
        actor_role: "hospital",
        action: "radiology_radiant_launch_test_confirmed",
        action_label: `recorded the RadiAnt launch test result for ${facility.hospital_name || "the facility"} — ${confirmed ? "confirmed, the correct examination opened" : "not confirmed, the examination did not open"}`,
        hospital: facility.hospital_name || "",
      });
      return json({ ...result, profile: updated });
    }

    // ===== LAUNCH-ONLY TEST — facility-administrator-only, and COMPLETELY
    // separate from everything above: it needs no PACS configuration, no
    // integration type, no AE Title, host or port, no DICOMweb endpoint and no
    // Study Instance UID or accession number. It answers one question only —
    // can a browser on this workstation start the installed RadiAnt desktop
    // application with its bare registered protocol?
    //
    // It never touches patient information, is stored in its OWN field so it
    // can never affect the facility's connection status, and is never recorded
    // as a success automatically: the attempt is "launch_requested" until the
    // administrator states whether the application opened.
    if (action === "radiant_launch_only_test") {
      const hospitals = await svc.entities.HospitalProfile.filter({ user_id: user.id });
      const profileId = String(payload.hospital_profile_id || "").trim();
      const facility = (profileId ? hospitals.find((h: any) => h.id === profileId) : null) || hospitals[0] || null;
      if (!facility) return json({ error: "No facility profile is linked to this administrator account." }, 404);

      const result = {
        tested_datetime: new Date().toISOString(),
        outcome: "launch_requested",
        launch_only: true,
        confirmed: false,
        launcher_name: user.full_name || "",
        launch_url: RADIANT_LAUNCH_ONLY_URL,
        checks: [
          {
            key: "launch_only_url",
            label: "Launch-only URLs",
            outcome: "passed",
            message: "radiant:// carries no study parameter, PACS identifier or patient data — it only asks Windows to start the registered RadiAnt application.",
          },
          {
            key: "no_patient_data",
            label: "No patient information",
            outcome: "passed",
            message: "This test uses no imaging request, Study Instance UID, accession number, PACS endpoint or patient image.",
          },
          {
            key: "pacs_independent",
            label: "PACS configuration",
            outcome: "not_tested",
            message: "Deliberately not required for this test — a launch-only result is not a PACS connection.",
          },
          {
            key: "operator_confirmation",
            label: "Operator confirmation",
            outcome: "not_tested",
            message: "Pending — record whether the RadiAnt window actually opened.",
          },
        ],
        message:
          "The launch request was sent to your browser. AMedix cannot detect whether RadiAnt opened and records nothing as successful — confirm below what you saw on this workstation.",
      };

      const updated = await svc.entities.HospitalProfile.update(facility.id, { radiant_launch_only_test_result: result });
      await logClinicalAudit(base44, {
        actor_user_id: user.id,
        actor_name: user.full_name,
        actor_role: "hospital",
        action: "radiology_radiant_launch_only_test",
        action_label: `requested the launch-only RadiAnt application test for ${facility.hospital_name || "the facility"} — no PACS, study or patient information involved; result unconfirmed`,
        hospital: facility.hospital_name || "",
      });
      return json({ ...result, profile: updated });
    }

    // ===== LAUNCH-ONLY CONFIRMATION — the administrator's own statement about
    // whether the desktop application started. Stored in its own field, so it
    // never marks the facility Connected, never verifies the clinical launch and
    // never alters what radiologists can open.
    if (action === "radiant_launch_only_confirm") {
      const hospitals = await svc.entities.HospitalProfile.filter({ user_id: user.id });
      const profileId = String(payload.hospital_profile_id || "").trim();
      const facility = (profileId ? hospitals.find((h: any) => h.id === profileId) : null) || hospitals[0] || null;
      if (!facility) return json({ error: "No facility profile is linked to this administrator account." }, 404);
      const last = facility.radiant_launch_only_test_result || {};
      if (String(last.outcome || "") !== "launch_requested") {
        return json({ error: "Run Test RadiAnt Application Launch first — there is no pending launch-only test to confirm." }, 409);
      }
      const confirmed = payload.confirmed === true;
      const checks = Array.isArray(last.checks) ? last.checks.slice() : [];
      const existing = checks.findIndex((c: any) => c.key === "operator_confirmation");
      const confirmation = {
        key: "operator_confirmation",
        label: "Operator confirmation",
        outcome: confirmed ? "passed" : "failed",
        message: confirmed
          ? "The administrator confirmed that the RadiAnt application opened on this workstation."
          : "The administrator reported that the RadiAnt application did not open.",
      };
      if (existing >= 0) checks[existing] = confirmation;
      else checks.push(confirmation);

      const result = {
        ...last,
        outcome: confirmed ? "launch_only_confirmed" : "launch_only_failed",
        confirmed,
        confirmed_datetime: new Date().toISOString(),
        confirmed_by_name: user.full_name || "",
        checks,
        message: confirmed
          ? "Recorded — the RadiAnt desktop application started from the browser on this workstation. This is an APPLICATION LAUNCH result only: no PACS connection was made and no clinical imaging integration is verified."
          : "Recorded — the RadiAnt application did not open. This is an application launch result only; the facility's PACS configuration and clinical launch workflow are unaffected and still require their own tests.",
      };
      const updated = await svc.entities.HospitalProfile.update(facility.id, { radiant_launch_only_test_result: result });
      await logClinicalAudit(base44, {
        actor_user_id: user.id,
        actor_name: user.full_name,
        actor_role: "hospital",
        action: "radiology_radiant_launch_only_test_confirmed",
        action_label: `recorded the launch-only RadiAnt application test for ${facility.hospital_name || "the facility"} — ${confirmed ? "the application opened" : "the application did not open"}; not a PACS connection`,
        hospital: facility.hospital_name || "",
      });
      return json({ ...result, profile: updated });
    }

    if (!requestId) return json({ error: "Select the imaging request." }, 400);

    const found = await svc.entities.ImagingRequest.filter({ id: requestId });
    const request = found[0];
    if (!request) return json({ error: "Imaging request not found." }, 404);

    const actorRole = await authorizeRadiologyStudy(base44, user, request);
    if (!actorRole) return json({ error: "You are not authorized to access this study's images." }, 403);

    const pacsProfile = await loadFacilityPacs(base44, request);
    const pacsEnabled = !!(pacsProfile && pacsProfile.pacs_integration_enabled);
    const pacsMode = pacsEnabled ? (pacsProfile.pacs_integration_type || "none") : "none";
    const amedixImages = (request.image_file_urls || []).filter(Boolean);
    const studyUid = String(request.study_instance_uid || "").trim();
    // The AMedix request reference is NEVER used as a PACS accession number —
    // the two are different identifiers. The accession is only what the
    // department recorded from the facility PACS.
    const accession = String(request.accession_number || "").trim();

    const pacsSummary = {
      enabled: pacsEnabled,
      development_mode: !pacsEnabled,
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
      // RadiAnt desktop launch — configured means a valid radiant:// template is
      // recorded; verified means the administrator confirmed a launch opened the
      // correct study. The two are reported separately, never merged.
      radiant_mode: pacsEnabled && pacsMode === "radiant",
      radiant_configured:
        pacsEnabled &&
        pacsMode === "radiant" &&
        !radiantTemplateIssue(String(pacsProfile.pacs_radiant_launch_template || "").trim() || RADIANT_TEMPLATE_STUDY_UID),
      radiant_test_outcome: pacsProfile ? String((pacsProfile.radiant_last_test_result || {}).outcome || "") : "",
      radiant_launch_verified: pacsProfile
        ? String((pacsProfile.radiant_last_test_result || {}).outcome || "") === "launch_confirmed"
        : false,
      pacs_networking_recorded: pacsProfile
        ? !!(
            String(pacsProfile.pacs_host || "").trim() &&
            Number(pacsProfile.pacs_port) &&
            String(pacsProfile.pacs_called_ae_title || "").trim()
          )
        : false,
      connection_status: pacsProfile ? derivePacsStatus(pacsProfile) : "development_mode",
      config_version: pacsProfile ? Number(pacsProfile.pacs_config_version) || 1 : 0,
      last_test_result: pacsProfile ? pacsProfile.pacs_last_test_result || null : null,
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
        study_mapping: {
          study_instance_uid: studyUid || null,
          accession_number: accession || null,
          mapped: !!(studyUid || accession),
        },
        pacs: pacsSummary,
      });
    }

    if (action === "verify") {
      if (!pacsEnabled) {
        return json({ verified: false, development_mode: true, message: "Development mode — no hospital PACS connected for this facility, so study availability cannot be verified on an imaging system." }, 409);
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
      const { headers, error: credentialError } = await dicomwebHeaders(pacsProfile);
      if (credentialError) {
        return json({ verified: false, message: credentialError }, 409);
      }
      let verified = false;
      let httpStatus: number | null = null;
      let studiesFound = 0;
      let message = "";
      try {
        const probe = await fetch(`${dicomwebBase}/studies?StudyInstanceUID=${encodeURIComponent(studyUid)}&limit=1`, {
          signal: AbortSignal.timeout(10000),
          headers,
        });
        httpStatus = probe.status;
        if (probe.ok) {
          const rows = await probe.json().catch(() => []);
          studiesFound = Array.isArray(rows) ? rows.length : 0;
          verified = studiesFound > 0;
          message = verified
            ? "The study was found on the facility imaging system (matched against the facility's own archive, not the UID alone)."
            : "The imaging system answered, but this Study Instance UID was not found on it.";
        } else if (probe.status === 401 || probe.status === 403) {
          message = "The facility imaging system rejected the request — its approved service credential is missing or refused. The hospital administrator must configure it in Imaging System Connection.";
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
          development_mode: true,
          launch_url: null,
          message: "Development mode — no hospital PACS connected for this facility. The hospital administrator connects the production imaging system in the Hospital Portal (Radiology Department tab — Imaging System Connection) after confirming the vendor's supported integration method; AMedix then verifies it end-to-end before real study launching is enabled.",
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
      if (template.includes("{patient_cin}")) {
        return refuseLaunch(
          "The recorded Viewer Launch URL Template contains {patient_cin} — patient identifiers must never appear in viewer URLs. The hospital administrator must replace it in Imaging System Connection (supported placeholders: {study_instance_uid}, {accession_number}, {request_id}, {launch_token})."
        );
      }
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
      if (template.includes("{accession_number}") && !accession) {
        return refuseLaunch(
          "No PACS accession number is recorded for this study, so the imaging system cannot be opened to the right examination. The department must record the accession number from the facility PACS — the AMedix request reference is not used as an accession number."
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

    // ===== RADIANT — desktop viewer launch. AMedix authorizes the radiologist,
    // confirms the study mapping belongs to this patient at this facility, then
    // builds the radiant:// URL server-side and hands it to the browser.
    // A browser cannot report whether Windows started RadiAnt, so the recorded
    // outcome is always "requested" — never "opened" — and manual retrieval is
    // offered alongside it.
    if (action === "radiant_launch") {
      const manual = manualRetrieval(studyUid, accession);
      const refuseLaunchRequest = async (message: string): Promise<Response> => {
        await logClinicalAudit(base44, {
          actor_user_id: user.id,
          actor_name: user.full_name,
          actor_role: actorRole,
          action: "radiology_radiant_launch_refused",
          action_label: "attempted to open the study in RadiAnt DICOM Viewer — launch refused",
          patient_id: request.patient_id,
          document_id: request.request_id,
          hospital: request.routed_hospital || request.doctor_hospital,
        });
        return json({ mode: "radiant", launch_url: null, launch_outcome: "refused", message, manual }, 409);
      };

      if (!pacsEnabled || pacsMode !== "radiant") {
        return refuseLaunchRequest(
          "RadiAnt DICOM Viewer is not configured for this facility. The hospital administrator selects the RadiAnt DICOM Viewer integration type and records the PACS details and the radiant:// launch URL in the Hospital Portal, Radiology Department tab, Imaging System Connection."
        );
      }
      const radiantTemplate = String(pacsProfile.pacs_radiant_launch_template || "").trim() || RADIANT_TEMPLATE_STUDY_UID;
      const radiantIssue = radiantTemplateIssue(radiantTemplate);
      if (radiantIssue) return refuseLaunchRequest(radiantIssue);
      const radiantNeeds = radiantTemplateNeeds(radiantTemplate);
      if (radiantNeeds.uid && !studyUid) {
        return refuseLaunchRequest(
          "No DICOM Study Instance UID is recorded for this request, so RadiAnt cannot be told which examination to open. The department records the Study Instance UID from the facility PACS on the imaging request — the AMedix request number is never used as a PACS identifier."
        );
      }
      if (radiantNeeds.accession && !accession) {
        return refuseLaunchRequest(
          "No PACS accession number is recorded for this request, so RadiAnt cannot be told which examination to open. The department records the accession number from the facility PACS — the AMedix request number is not an accession number."
        );
      }

      // The study mapping must belong to THIS patient at THIS facility — checked
      // against the AMedix records, never assumed from a UID alone.
      let linkedStudies: any[] = [];
      try {
        const byRequest = await svc.entities.ImagingStudy.filter({ imaging_request_id: request.id });
        linkedStudies = Array.isArray(byRequest) ? byRequest : [];
        if (studyUid) {
          const byUid = await svc.entities.ImagingStudy.filter({ study_instance_uid: studyUid });
          for (const s of Array.isArray(byUid) ? byUid : []) {
            if (!linkedStudies.some((l: any) => l.id === s.id)) linkedStudies.push(s);
          }
        }
      } catch {
        linkedStudies = [];
      }
      if (studyMappingMismatch(linkedStudies, request)) {
        return refuseLaunchRequest(
          "The PACS study linked to this request does not match the patient or the facility on the imaging request, so AMedix will not open it. The radiology department must correct the study mapping — a study is never opened on a UID alone."
        );
      }

      // Optional server-side availability check. Failing to reach the archive
      // from the AMedix server does NOT mean the PACS is unavailable to RadiAnt,
      // so it is reported as unverified rather than blocking the launch.
      let studyAvailability = "unconfirmed";
      let availabilityMessage =
        "Study availability was not verified server-side — no DICOMweb endpoint is recorded for this facility. RadiAnt retrieves the study from the PACS with its own connection; if the study is unavailable there, RadiAnt reports it.";
      const radiantDicomweb = String(pacsProfile.pacs_dicomweb_base_url || "").trim().replace(/\/+$/, "");
      if (radiantDicomweb && studyUid && isHttpUrl(radiantDicomweb)) {
        const { headers, error: credentialError } = await dicomwebHeaders(pacsProfile);
        const availabilityCheck = await verifyRadiantStudyAvailability({
          dicomwebBase: radiantDicomweb,
          studyUid,
          patientCin: String(request.patient_cin || ""),
          headers,
          credentialError,
        });
        if (availabilityCheck.refusal) return refuseLaunchRequest(availabilityCheck.refusal);
        studyAvailability = availabilityCheck.availability;
        availabilityMessage = availabilityCheck.message;
      }

      const radiantUrl = buildRadiantLaunchUrl(radiantTemplate, { studyUid, accession });
      await logClinicalAudit(base44, {
        actor_user_id: user.id,
        actor_name: user.full_name,
        actor_role: actorRole,
        action: "radiology_radiant_launch_requested",
        action_label: `requested the study in RadiAnt DICOM Viewer${
          studyUid ? ` (Study Instance UID ${studyUid})` : accession ? ` (accession ${accession})` : ""
        }`,
        patient_id: request.patient_id,
        patient_cin: request.patient_cin,
        patient_name: request.patient_name,
        encounter_id: request.encounter_id,
        document_id: request.request_id,
        hospital: request.routed_hospital || request.doctor_hospital,
      });
      return json({
        mode: "radiant",
        request_ref: request.request_id || "",
        launch_url: radiantUrl,
        launch_outcome: "requested",
        study_instance_uid: studyUid,
        accession_number: accession,
        identifier_used: radiantNeeds.uid ? "study_instance_uid" : "accession_number",
        study_availability: studyAvailability,
        availability_message: availabilityMessage,
        launch_test_confirmed: String((pacsProfile.radiant_last_test_result || {}).outcome || "") === "launch_confirmed",
        manual,
        message:
          "The launch request was sent to your browser. AMedix cannot detect whether RadiAnt opened or which study it displayed — confirm that the correct examination is shown before reporting.",
      });
    }

    // ===== OHIF — embedded viewer launch for facilities running their OWN
    // approved OHIF deployment. The study is opened through OHIF's documented
    // routing; the URL carries ONLY the verified Study Instance UID (and, when
    // the deployment's route requires it, the accession number) — never
    // patient name, CIN or credentials. Launching is permitted ONLY when the
    // facility's end-to-end verification is Connected; study identity is
    // confirmed against the facility's DICOMweb (QIDO) archive endpoint, and
    // the study is matched to the facility — never assumed from a UID alone.
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
      const ohifState = String(pacsProfile.ohif_connection_status || "pending_configuration");
      if (ohifState !== "connected") {
        return refuseOhif(
          ohifState === "verification_failed"
            ? "Launching is disabled — the last end-to-end study-retrieval test failed. The hospital administrator corrects the deployment configuration and re-runs the test in the Hospital Portal (Radiology Department tab, Imaging System Connection)."
            : "Launching is disabled — the embedded OHIF integration is Pending configuration. Deployment of the facility's approved OHIF instance is required, and the hospital administrator must pass the end-to-end study-retrieval test in the Hospital Portal (Radiology Department tab, Imaging System Connection) before studies can be opened."
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
      // Confirm the study exists in the facility archive (when AMedix has a
      // DICOMweb endpoint) BEFORE opening the viewer — never open a guessed
      // study, and never rely on the UID alone without facility matching.
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
        const { headers, error: credentialError } = await dicomwebHeaders(pacsProfile);
        if (credentialError) {
          return refuseOhif(credentialError);
        }
        try {
          const probe = await fetch(`${dicomwebBase}/studies?StudyInstanceUID=${encodeURIComponent(studyUid)}&limit=1`, {
            signal: AbortSignal.timeout(10000),
            headers,
          });
          if (probe.ok) {
            const rows = await probe.json().catch(() => []);
            if (Array.isArray(rows) && rows.length > 0) {
              availability = "verified";
              availabilityMessage = "The study was found in the facility imaging archive (matched against this facility's own archive, not the UID alone).";
            } else {
              return refuseOhif(
                "The facility archive answered, but this Study Instance UID was not found in it — the study mapping must be corrected before OHIF is opened, so no unrelated study can be loaded."
              );
            }
          } else if (probe.status === 401 || probe.status === 403) {
            return refuseOhif(
              "The facility archive rejected the request — its approved service credential is missing or refused. The hospital administrator must configure it in Imaging System Connection."
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