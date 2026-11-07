// RadiAnt DICOM Viewer launch — the ONE place the radiant:// URL protocol is
// handled, shared by the imaging-request launch bridge and the facility's
// RadiAnt launch test.
//
// RadiAnt is a DESKTOP application: AMedix cannot stream images to it, and the
// browser cannot report back whether the application actually opened. AMedix
// therefore builds the radiant:// URL server-side from identifiers it has
// verified, hands it to the browser, and never records a launch as a success
// without an operator confirming that the correct examination is displayed.
//
// The URL syntax must be verified against RadiAnt's official documentation by
// the facility's PACS administrator before clinical use — AMedix ships the two
// documented forms below as defaults, nothing else is ever guessed.

// Study Instance UID form: radiant://?n=pstv&v=0020000D&v="<uid>"
export const RADIANT_TEMPLATE_STUDY_UID = "radiant://?n=pstv&v=0020000D&v=%22{study_instance_uid}%22";
// Accession number form: radiant://?n=pstv&v=00080050&v="<accession>"
export const RADIANT_TEMPLATE_ACCESSION = "radiant://?n=pstv&v=00080050&v=%22{accession_number}%22";

// Only study identifiers may travel in a desktop launch URL — never patient
// names, CINs or credentials, and never the AMedix request reference (which is
// not a PACS identifier).
export const RADIANT_ALLOWED_PLACEHOLDERS = ["study_instance_uid", "accession_number"];

const PLACEHOLDER_RE = /\{([a-z_]+)\}/g;

export function radiantPlaceholders(template: string): string[] {
  const found = String(template || "").match(PLACEHOLDER_RE) || [];
  return found.map((p) => p.slice(1, -1));
}

// Returns null when the template is usable, otherwise an actionable message.
export function radiantTemplateIssue(template: string): string | null {
  const value = String(template || "").trim();
  if (!value) {
    return "No RadiAnt launch URL is recorded for this facility. The PACS administrator records the radiant:// launch URL confirmed against RadiAnt's documentation.";
  }
  if (!/^radiant:\/\//i.test(value)) {
    return "The RadiAnt launch URL must use the radiant:// custom URL protocol (RadiAnt is a desktop application, not a web viewer) — for example radiant://?n=pstv&v=0020000D&v=%22{study_instance_uid}%22.";
  }
  const placeholders = radiantPlaceholders(value);
  if (!placeholders.length) {
    return "The RadiAnt launch URL must contain {study_instance_uid} or {accession_number}, otherwise RadiAnt cannot be told which examination to open.";
  }
  const bad = placeholders.filter((p) => !RADIANT_ALLOWED_PLACEHOLDERS.includes(p));
  if (bad.length) {
    return `The RadiAnt launch URL uses unsupported placeholder(s): {${bad.join("}, {")}}. Only {study_instance_uid} and {accession_number} are permitted — patient identifiers, the AMedix request reference and credentials must never appear in a desktop launch URL.`;
  }
  return null;
}

// Which identifier the recorded template needs in order to open a study.
export function radiantTemplateNeeds(template: string): { uid: boolean; accession: boolean } {
  const placeholders = radiantPlaceholders(template);
  return {
    uid: placeholders.includes("study_instance_uid"),
    accession: placeholders.includes("accession_number"),
  };
}

// Server-side substitution only: values are URL-encoded, so no identifier can
// break out of the recorded template.
export function buildRadiantLaunchUrl(
  template: string,
  values: { studyUid?: string; accession?: string }
): string {
  let url = String(template || "");
  url = url.split("{study_instance_uid}").join(encodeURIComponent(String(values.studyUid || "")));
  url = url.split("{accession_number}").join(encodeURIComponent(String(values.accession || "")));
  return url;
}

export function normalizePatientIdentifier(value: any): string {
  return String(value || "").replace(/[^A-Z0-9]/gi, "").toUpperCase();
}

// A study mapped to this request must belong to the same patient at the same
// facility — otherwise it must never be opened. Returns the offending study.
export function studyMappingMismatch(studies: any[], request: any): any | null {
  const list = Array.isArray(studies) ? studies : [];
  return (
    list.find(
      (s: any) =>
        String(s.hospital_user_id || "") !== String(request.routed_hospital_user_id || "") ||
        (s.patient_cin && request.patient_cin &&
          normalizePatientIdentifier(s.patient_cin) !== normalizePatientIdentifier(request.patient_cin))
    ) || null
  );
}

// Manual PACS retrieval shown whenever an automatic launch cannot be used.
export function manualRetrieval(studyUid: string, accession: string) {
  return {
    accession_number: accession || null,
    study_instance_uid: studyUid || null,
    instruction: accession
      ? `In RadiAnt DICOM Viewer open the PACS search and query accession number ${accession}.`
      : studyUid
        ? `In RadiAnt DICOM Viewer open the PACS search and query Study Instance UID ${studyUid}.`
        : "No PACS identifier is recorded for this study yet.",
  };
}

// Optional server-side confirmation that the study exists on the facility
// archive and belongs to the same patient. A refusal (study absent, or another
// patient's identifier) stops the launch; an unreachable or unauthenticated
// endpoint never does, because RadiAnt reaches the PACS from the workstation
// over a different network path.
export async function verifyRadiantStudyAvailability(params: {
  dicomwebBase: string;
  studyUid: string;
  patientCin: string;
  headers: Record<string, string>;
  credentialError?: string | null;
}): Promise<{ availability: "verified" | "unconfirmed"; message: string; refusal: string | null }> {
  const unconfirmed = (message: string) => ({ availability: "unconfirmed" as const, message, refusal: null });
  if (params.credentialError) {
    return unconfirmed(
      `Study availability could not be verified: ${params.credentialError} RadiAnt may still retrieve the study from the PACS directly.`
    );
  }
  try {
    const probe = await fetch(
      `${params.dicomwebBase}/studies?StudyInstanceUID=${encodeURIComponent(params.studyUid)}&limit=1`,
      { signal: AbortSignal.timeout(10000), headers: params.headers }
    );
    if (!probe.ok) {
      return probe.status === 401 || probe.status === 403
        ? unconfirmed(
            "Study availability could not be verified — the facility archive rejected the request (its service credential is missing or refused). RadiAnt may still retrieve the study from the PACS directly."
          )
        : unconfirmed(`Study availability could not be verified — the facility archive answered with HTTP ${probe.status}.`);
    }
    const rows = await probe.json().catch(() => []);
    const row = Array.isArray(rows) ? rows[0] : null;
    if (!row) {
      return {
        availability: "unconfirmed",
        message: "",
        refusal:
          "The facility archive answered, but this Study Instance UID was not found in it — the study mapping must be corrected before RadiAnt is opened, so no unrelated study can be loaded.",
      };
    }
    const archivePatientId = String(row?.["00100020"]?.Value?.[0] || "").trim();
    if (
      archivePatientId &&
      params.patientCin &&
      normalizePatientIdentifier(archivePatientId) !== normalizePatientIdentifier(params.patientCin)
    ) {
      return {
        availability: "unconfirmed",
        message: "",
        refusal: `The study found on the facility archive belongs to a different patient identifier (${archivePatientId}) than this request (${params.patientCin}) — the launch was refused so no other patient's images can be opened.`,
      };
    }
    return {
      availability: "verified",
      refusal: null,
      message: archivePatientId
        ? `The study was found on the facility archive and its patient identifier matches this request (${params.patientCin}).`
        : "The study was found on the facility archive; the archive returned no patient identifier, so patient matching relied on the AMedix study mapping.",
    };
  } catch {
    return unconfirmed(
      "Study availability could not be verified — the archive could not be reached from the AMedix server. RadiAnt queries the PACS from your workstation, so the launch can still work."
    );
  }
}