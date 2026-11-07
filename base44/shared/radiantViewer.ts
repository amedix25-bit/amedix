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