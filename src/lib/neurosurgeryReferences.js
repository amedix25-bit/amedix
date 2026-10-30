// Guideline references the Neurosurgery content is built from.
//
// Recorded on the templates and in the note text so any clinician reading a
// note can see what the documentation structure follows. These are the
// published sources; the edition/currency of each must be confirmed by the
// neurosurgical lead before clinical reliance — the app does not claim they are
// the current edition in the reader's jurisdiction.
export const NSG_REFERENCES = [
  {
    key: "nice_ng232",
    short: "NICE NG232",
    organization: "NICE",
    version: "Head injury: assessment and early management (NG232)",
    label: "Head injury — assessment, CT timing, observation and neurosurgical referral (NICE NG232)",
    url: "https://www.nice.org.uk/guidance/ng232",
  },
  {
    key: "nice_ng59",
    short: "NICE NG59",
    organization: "NICE",
    version: "Low back pain and sciatica in over 16s (NG59)",
    label: "Low back pain and sciatica — assessment, conservative care and surgical referral (NICE NG59)",
    url: "https://www.nice.org.uk/guidance/ng59",
  },
  {
    key: "aans_cns",
    short: "AANS/CNS",
    organization: "AANS/CNS",
    version: "Evidence-based clinical practice guidelines",
    label: "AANS/CNS evidence-based guidelines — traumatic brain injury, degenerative spine, neuro-oncology",
    url: "https://www.cns.org/guidelines",
  },
  {
    key: "icd11",
    short: "WHO ICD-11 MMS",
    organization: "WHO",
    version: "ICD-11 MMS",
    label: "WHO ICD-11 MMS — diagnosis coding",
    url: "https://icd.who.int/browse/2024-01/mms/en",
  },
];

export const nsgReference = (key) => NSG_REFERENCES.find((r) => r.key === key) || null;

// How each document's content is sourced, stated on the note itself.
export const NSG_PROVENANCE = {
  guideline: "Guideline-based",
  safety: "Safety-critical documentation",
  local_decision: "Local documentation requirement",
};