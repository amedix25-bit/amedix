// Dermatology — reference register and guideline basis.
//
// The American Academy of Dermatology (AAD) is the principal clinical reference,
// supported by EADV, BAD, ILDS, WHO (ICD-11) and NCCN for skin-cancer guidance.
//
// RULES
//   · Every entry is a LINK to the issuing body's own publication. No document is
//     copied, hosted or redistributed by AMedix.
//   · A year is recorded only where the collection itself states one; a living
//     collection stays `null` rather than being given an invented date.
//   · `status` is honest: `current` means the body still publishes the collection,
//     `superseded` names what replaced it, and `verify` means the current edition
//     must be confirmed at the source before it is presented as current.
//   · These are INTERNATIONAL recommendations. They are never presented as a local
//     approval, and local protocols are held separately (and are empty until the
//     institution registers one).
//   · Evidence grading differs by body and is stated with the reference; a grade is
//     never invented for a recommendation.

export const DM_PRINCIPAL_REFERENCE = "aad";

export const DM_REFERENCES = {
  aad: {
    key: "aad",
    issuing_organization: "American Academy of Dermatology (AAD)",
    title: "AAD Clinical Practice Guidelines",
    clinical_topic: "Dermatology — principal reference",
    version: "living collection",
    publication_year: null,
    source_url: "https://www.aad.org/",
    population: "Adults and children receiving dermatological care",
    status: "current",
    evidence_grading:
      "Each AAD guideline is produced by a multidisciplinary workgroup that states the strength of each recommendation and the level of evidence behind it; the scheme used is stated in that guideline and is read at the source.",
    status_note:
      "A continuously maintained collection — each guideline carries its own publication and update date that must be read at the source before the edition is stated in a note.",
    role: "principal",
  },
  eadv: {
    key: "eadv",
    issuing_organization: "European Academy of Dermatology and Venereology (EADV)",
    title: "EADV guidelines and consensus statements",
    clinical_topic: "Dermatology — European guidance and consensus",
    version: "living collection",
    publication_year: null,
    source_url: "https://www.eadv.org/",
    population: "Adults and children receiving dermatological care in Europe",
    status: "current",
    evidence_grading:
      "EADV publishes guideline and consensus documents for its own topics; the evidence scheme is stated within each document and is read at the source.",
    status_note:
      "Documents are published individually. Where an EADV document and an AAD guideline cover the same topic, both are cited and the difference is recorded rather than resolved by AMedix.",
  },
  bad: {
    key: "bad",
    issuing_organization: "British Association of Dermatologists (BAD)",
    title: "BAD clinical guidelines",
    clinical_topic: "Dermatology — UK guidance for specific conditions and treatments",
    version: "living collection",
    publication_year: null,
    source_url: "https://www.bad.org.uk/",
    population: "Adults and children receiving dermatological care",
    status: "current",
    evidence_grading:
      "BAD guidelines state the strength of recommendation and the quality of evidence using the scheme printed in each guideline, and state where evidence is limited or consensus-based.",
    status_note:
      "Each BAD guideline states the date it was produced and when it is due for review; that date must be read at the source before the note claims a current edition.",
  },
  ilds: {
    key: "ilds",
    issuing_organization: "International League of Dermatological Societies (ILDS)",
    title: "ILDS consensus and global dermatology programmes",
    clinical_topic: "Dermatology — international consensus and global skin health",
    version: "living collection",
    publication_year: null,
    source_url: "https://www.ilds.org/",
    population: "Global dermatology populations",
    status: "current",
    evidence_grading:
      "ILDS is a federation of dermatological societies: its consensus documents are expert consensus rather than a single graded guideline series, and they are cited as consensus, never as graded evidence.",
    status_note:
      "ILDS material is cited for global consensus context and for its classification and skin-health programmes; a specific treatment claim is traced to the specialty guideline that makes it.",
  },
  who_icd11: {
    key: "who_icd11",
    issuing_organization: "World Health Organization (WHO)",
    title: "ICD-11 Mortality and Morbidity Statistics (MMS)",
    clinical_topic: "ICD-11 coding of dermatological diagnoses",
    version: "ICD-11 MMS",
    publication_year: null,
    source_url: "https://icd.who.int/",
    population: "All patients whose diagnoses are coded",
    status: "current",
    evidence_grading:
      "A classification, not a treatment guideline: it defines categories, inclusion and exclusion terms and coding rules. It makes no recommendation about treatment.",
    status_note:
      "The release in force is recorded with every stored code, and a signed note keeps the release it was coded against even after WHO publishes a newer one.",
  },
  nccn: {
    key: "nccn",
    issuing_organization: "National Comprehensive Cancer Network (NCCN)",
    title: "NCCN Clinical Practice Guidelines in Oncology — skin cancers",
    clinical_topic: "Skin cancer — melanoma, basal cell and squamous cell carcinoma",
    version: "living collection, versioned by year",
    publication_year: null,
    source_url: "https://www.nccn.org/guidelines",
    population: "Adults with skin cancer",
    status: "current",
    evidence_grading:
      "NCCN grades both the category of evidence and the level of consensus (categories 1, 2A, 2B and 3), and states that category 1 requires uniform consensus.",
    status_note:
      "NCCN guidelines are revised frequently and each version is dated; the version followed must be recorded in the note, and no version is quoted by AMedix.",
  },
};

export const DM_REFERENCES_LIST = Object.values(DM_REFERENCES);

// Which references stand behind each note type's documentation structure.
export const DM_NOTE_REFERENCES = {
  derm_consultation: ["aad", "eadv", "who_icd11"],
  derm_followup: ["aad", "eadv"],
  derm_lesion_assessment: ["aad", "nccn", "who_icd11"],
  derm_skin_procedure_note: ["aad", "bad"],
  derm_biopsy_note: ["aad", "bad", "nccn"],
  derm_operative_note: ["bad", "nccn"],
  derm_pathology_request: ["aad", "nccn"],
  derm_discharge_followup: ["aad", "bad"],
  derm_referral: ["aad", "ilds"],
  dm_comprehensive_assessment: ["aad", "eadv", "who_icd11"],
  dm_acne_review: ["aad", "eadv"],
  dm_eczema_review: ["aad", "eadv", "bad"],
  dm_psoriasis_review: ["aad", "eadv", "bad"],
  dm_infection_review: ["aad", "bad"],
  dm_skin_cancer_review: ["aad", "nccn", "who_icd11"],
  dm_hair_nail_review: ["aad", "eadv"],
  dm_pigmentary_review: ["aad", "eadv"],
  dm_pediatric_review: ["aad", "eadv", "ilds"],
  dm_autoimmune_review: ["aad", "bad", "eadv"],
  dm_other_conditions_review: ["aad", "eadv"],
  dm_severe_reaction_assessment: ["aad", "bad", "who_icd11"],
  dm_phototherapy_review: ["aad", "bad"],
  dm_biologic_review: ["aad", "eadv", "bad"],
};

export const dmGuidanceForNote = (noteKey) =>
  (DM_NOTE_REFERENCES[noteKey] || []).map((k) => DM_REFERENCES[k]).filter(Boolean);

// Local protocols are stored separately from international recommendations and stay
// empty until the institution registers one. An empty list is reported as such.
export const dmLocalProtocolsFor = () => [];

export const DM_LOCAL_PROTOCOL_NOTICE =
  "No local protocol is registered for this note type. The references listed are international recommendations recorded as documentation support — they are not a local approval.";

export const dmGuidanceBasis = (noteKey) => {
  const refs = dmGuidanceForNote(noteKey);
  if (!refs.length) return "Documentation structure — no international reference registered for this note type.";
  const principal = refs.find((r) => r.key === DM_PRINCIPAL_REFERENCE);
  const others = refs.filter((r) => r.key !== DM_PRINCIPAL_REFERENCE);
  const parts = [];
  if (principal) parts.push(`${principal.issuing_organization} — ${principal.title} (principal dermatology reference)`);
  others.forEach((r) => parts.push(`${r.issuing_organization} — ${r.title}`));
  return `Documentation structure follows: ${parts.join("; ")}. These are international recommendations recorded as documentation support, not local approval. Where a body revises a document continuously (AAD, EADV, BAD, NCCN), the edition followed must be stated in the note.`;
};

// Conditional guidance shown beside a documented finding. Each item names its
// source and states what the cited document addresses; none of it orders treatment.
export const DM_REFERENCE_GUIDANCE = {
  melanoma: {
    source: "nccn",
    text: "The cited guidance addresses the biopsy technique and margins that allow accurate Breslow measurement, the pathology reporting elements required, staging and the follow-up schedule. The decision to biopsy and the definitive management remain the treating dermatologist's documented decision.",
  },
  keratinocyte: {
    source: "nccn",
    text: "The cited guidance addresses risk stratification of basal and squamous cell carcinoma by site, size, depth, perineural involvement and immunosuppression, together with margin assessment and follow-up intensity.",
  },
  actinic_keratosis: {
    source: "aad",
    text: "The cited guideline addresses field-directed and lesion-directed treatment options for actinic keratosis and the need to document the number, site and extent of lesions treated, since field cancerisation is not visible lesion by lesion.",
  },
  atopic_dermatitis: {
    source: "aad",
    text: "The cited guideline addresses emollient use, topical corticosteroid potency selection by site and age, topical calcineurin inhibitors, and when systemic or phototherapy is considered. The potency chosen and the site treated are recorded in the note.",
  },
  psoriasis: {
    source: "aad",
    text: "The cited guidance addresses topical, phototherapy and systemic options with their monitoring, and the assessment of severity and psoriatic arthritis. PASI, BSA and DLQI describe severity and do not by themselves choose treatment.",
  },
  acne: {
    source: "aad",
    text: "The cited guideline addresses topical and oral treatment combinations, antibiotic stewardship, and the monitoring required during isotretinoin treatment, including pregnancy prevention. A dose is never calculated or defaulted by AMedix.",
  },
  dermatophytosis: {
    source: "bad",
    text: "The cited guideline addresses confirming the diagnosis before systemic treatment (KOH microscopy and culture), the sampling method for nail and scalp disease, and the duration of treatment by site.",
  },
  blistering: {
    source: "bad",
    text: "The cited guidance addresses the biopsy and direct immunofluorescence sampling required to establish a blistering diagnosis, the serological tests used alongside it, and the treatment and monitoring of the confirmed disease.",
  },
  drug_reaction: {
    source: "bad",
    text: "The cited guidance addresses identifying and stopping the culprit drug, the spectrum from maculopapular eruption to Stevens-Johnson syndrome and toxic epidermal necrolysis, the urgency of referral for mucosal or extensive skin involvement, and the reporting of the reaction.",
  },
  urticaria: {
    source: "eadv",
    text: "The cited guidance addresses the duration criterion that separates acute from chronic urticaria, the role of provocation testing, and the stepwise treatment of chronic spontaneous urticaria. Angioedema with airway involvement is an emergency independent of any score.",
  },
  alopecia: {
    source: "aad",
    text: "The cited guidance addresses distinguishing non-scarring from scarring hair loss, the value of the pull test and trichoscopy, and the biopsy indications when scarring alopecia is suspected.",
  },
  vitiligo: {
    source: "eadv",
    text: "The cited guidance addresses confirming the diagnosis, assessing extent and activity, photoprotection, and the topical, phototherapy and surgical options with their evidence. Repigmentation expectations are documented, not promised.",
  },
  hidradenitis: {
    source: "eadv",
    text: "The cited guidance addresses Hurley staging as a description of severity, the combination of medical and surgical management, and the need to document lesion counts and drainage in the same way at each review.",
  },
};

export const dmReferenceGuidance = (key) => {
  const item = DM_REFERENCE_GUIDANCE[key];
  if (!item) return null;
  const ref = DM_REFERENCES[item.source];
  return { ...item, organization: ref?.issuing_organization || "", title: ref?.title || "", url: ref?.source_url || "" };
};