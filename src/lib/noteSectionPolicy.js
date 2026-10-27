// Clinical governance: sections the clinical team has retired from the note
// templates. Applied once, centrally, to every specialty catalogue (medical and
// surgical) so a retired section can never reappear inside a note form, a note
// view or its PDF export — whatever specialty or diagnosis template it was
// authored in. Nothing else about a template changes: keys, ordering, required
// checks and the surrounding note system stay exactly as they were.
//
// Retired sections: Antimicrobial, Escalation Criteria, Surgical Referral Note,
// Investigation, Imaging Request and Finding, Working Diagnosis — together with
// their close variants (e.g. "Antimicrobials — Agent & Time", "Investigations &
// Treatment", "Imaging Findings", "Escalation & Time-Critical Criteria").

// Field labels that belong to a retired section.
const RETIRED_FIELD_LABEL = [
  /antimicrobial/i,
  /escalat/i, // covers Escalation Criteria and De-Escalation
  /investigation/i,
  /^imaging\b/i, // Imaging Reviewed / Findings / Performed / Guidance …
  /\bimaging$/i, // Pelvic / Chest Imaging, Respiratory Imaging, Staging Imaging …
  /working diagnosis/i,
];

// A label that mentions a retired word but is not that section — it stays.
const KEPT_FIELD_LABEL = [/^current medications/i];

// Note types retired from the catalogue (the Surgical Referral note).
const RETIRED_DOCUMENT_KEYS = ["surg_referral"];

// Imaging report note types exist to document imaging itself — their own
// content is left untouched.
const isImagingReport = (doc) => /imaging/i.test(doc.label || "");

const isRetiredField = (field) => {
  const label = field.label || "";
  if (KEPT_FIELD_LABEL.some((re) => re.test(label))) return false;
  return RETIRED_FIELD_LABEL.some((re) => re.test(label));
};

export const applyNoteSectionPolicy = (docs) =>
  docs
    .filter((doc) => !RETIRED_DOCUMENT_KEYS.includes(doc.key))
    .map((doc) => {
      if (isImagingReport(doc) || !Array.isArray(doc.fields)) return doc;
      return { ...doc, fields: doc.fields.filter((field) => !isRetiredField(field)) };
    });