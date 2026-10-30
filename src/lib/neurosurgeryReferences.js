// Neurosurgery — international guideline attribution and ICD-11 compliance.
//
// WHAT THIS MODULE GUARANTEES
//   - Every reference is a real published document with its own title, edition,
//     population and link. Nothing is invented.
//   - Where a document's edition or publication date has not been confirmed from
//     the publisher, the record says so ("edition/date to be confirmed") instead
//     of showing a plausible-looking date. Fabricating a citation or an ICD-11
//     code is never acceptable, and this file is the one place references are
//     defined so that cannot drift.
//   - Attribution is PER DOCUMENT, not per organisation: a note records which
//     document its structure follows, for which population.
//   - Where sources differ in scope or population (adult vs paediatric, European
//     joint guidance vs national protocol), both are shown and the record asks
//     which one was applied. No universal recommendation is synthesised.
//   - Review state and version travel with the note and its saved text.

// ---- ICD-11 ---------------------------------------------------------------
// The release the app codes against. Codes are never generated, completed or
// substituted by AMedix: each is copied from the WHO browser and stored with the
// release and source it was checked against.
export const NSG_ICD11 = {
  system: "ICD-11-MMS",
  label: "WHO ICD-11 MMS",
  release: "2026-01",
  system_uri: "http://id.who.int/icd/release/11/mms",
  browser_url: "https://icd.who.int/browse/2026-01/mms/en",
  structure: [
    "Code the stem or subcategory exactly as published — a block or range code is recorded only when the record is at that level of detail, and the note says so.",
    "Postcoordination detail (site, laterality, temporal course, severity) is recorded in the note's own structured fields; the app does not build a cluster.",
    "External causes, complications of care and device complications are coded from their own chapters, in addition to the clinical condition.",
    "Every entry stores the release it was checked against, the source it came from and its mapping state (verified / review required / unresolved).",
  ],
};

// ---- Review state ---------------------------------------------------------
// `checked` is when the citations in this file were checked against the
// publishers. It is NOT clinical ratification: that is signed off by the
// neurosurgical lead, and until then every note says so.
export const NSG_REVIEW = {
  checked: "2026-10-30",
  state: "pending_clinical_review",
  label: "Citations checked against the publishers on 30 Oct 2026 — neurosurgical clinical review pending",
};

export const NSG_ATTRIBUTION_STATE = {
  verified: { label: "Document, edition and date confirmed", tone: "text-success" },
  title_verified: { label: "Document confirmed — edition/date to be confirmed at local review", tone: "text-warning" },
};

// ---- Source organisations -------------------------------------------------
// The six professional societies the Neurosurgery content follows, plus NICE and
// WHO. `documents` are the specific publications, each with its own population.
export const NSG_SOURCE_ORGS = [
  {
    key: "aans",
    organization: "AANS",
    full_name: "American Association of Neurological Surgeons",
    url: "https://www.aans.org",
    scope: "Neurotrauma, neuro-oncology, degenerative spine — evidence-based guideline programme, co-published with CNS.",
    documents: [
      {
        id: "aans_tbi_4th",
        short: "AANS/CNS severe TBI, 4th ed",
        title: "Guidelines for the Management of Severe Traumatic Brain Injury",
        edition: "4th edition",
        published: "2017",
        citation: "Carney N, Totten AM, O'Reilly C, et al. Neurosurgery. 2017;80(1):6–15",
        kind: "Evidence-based guideline",
        population: "Adults with severe traumatic brain injury",
        url: "https://braintrauma.org/coma/guidelines/severe-tbi",
        attribution: "verified",
      },
    ],
  },
  {
    key: "cns",
    organization: "CNS",
    full_name: "Congress of Neurological Surgeons",
    url: "https://www.cns.org/guidelines",
    scope: "Systematic-review-based guidelines, including paediatric hydrocephalus and spinal conditions.",
    documents: [
      {
        id: "cns_pediatric_hydrocephalus",
        short: "CNS paediatric hydrocephalus",
        title: "Pediatric hydrocephalus: systematic literature review and evidence-based guidelines",
        edition: "CNS guideline series",
        published: null,
        citation: null,
        kind: "Evidence-based guideline",
        population: "Children with hydrocephalus",
        url: "https://www.cns.org/guidelines/pediatric-hydrocephalus/1-introduction-methodology-4",
        attribution: "title_verified",
      },
    ],
  },
  {
    key: "eans",
    organization: "EANS",
    full_name: "European Association of Neurosurgical Societies",
    url: "https://www.eans.org",
    scope: "European consensus statements and joint guidelines with ESO and ESMINT.",
    documents: [
      {
        id: "eso_eans_esmint_asah",
        short: "ESO/EANS/ESMINT — aneurysmal SAH",
        title: "ESO/EANS/ESMINT guideline on aneurysmal subarachnoid haemorrhage",
        edition: "Joint society guideline",
        published: null,
        citation: null,
        kind: "Joint society guideline",
        population: "Adults with aneurysmal subarachnoid haemorrhage (European context)",
        url: "https://www.eans.org",
        attribution: "title_verified",
      },
    ],
  },
  {
    key: "wfns",
    organization: "WFNS",
    full_name: "World Federation of Neurosurgical Societies",
    url: "https://www.wfns.org",
    scope: "Clinical grading scales and international consensus, including the SAH grading scale.",
    documents: [
      {
        id: "wfns_sah_scale",
        short: "WFNS SAH grading scale",
        title: "WFNS subarachnoid haemorrhage grading scale",
        edition: "WFNS committee report",
        published: "1988",
        citation: "A universal subarachnoid haemorrhage scale: report of a committee of the WFNS. J Neurol Neurosurg Psychiatry. 1988;51(11):1457",
        kind: "Clinical grading scale",
        population: "Adults with aneurysmal subarachnoid haemorrhage",
        url: "https://www.wfns.org",
        attribution: "verified",
      },
    ],
  },
  {
    key: "ao_spine",
    organization: "AO Spine",
    full_name: "AO Spine",
    url: "https://www.aofoundation.org/spine/clinical-library-and-tools/guidelines",
    scope: "Spinal injury classification systems, injury scores and clinical practice recommendations.",
    documents: [
      {
        id: "ao_spine_tl_classification",
        short: "AO Spine thoracolumbar classification",
        title: "AOSpine Thoracolumbar Spine Injury Classification System",
        edition: "Morphology, neurological status and modifiers",
        published: "2013",
        citation: "Vaccaro AR, Oner C, Kepler CK, et al. Spine. 2013;38(23):2028–37",
        kind: "Classification system",
        population: "Adults; a paediatric comparative validation is published separately",
        url: "https://www.aofoundation.org/spine/clinical-library-and-tools/aospine-classification-systems",
        attribution: "verified",
      },
      {
        id: "ao_spine_tl_aosis",
        short: "Thoracolumbar AOSpine Injury Score",
        title: "The Thoracolumbar AOSpine Injury Score (TL AOSIS)",
        edition: "Score accompanying the thoracolumbar classification",
        published: "2016",
        citation: "Kepler CK, Vaccaro AR, Koerner JD, et al. Global Spine J. 2016;6(4):329–34",
        kind: "Injury score",
        population: "Adults with thoracolumbar trauma",
        url: "https://www.aofoundation.org/spine/clinical-library-and-tools/aospine-classification-systems",
        attribution: "verified",
      },
      {
        id: "ao_spine_subaxial",
        short: "AO Spine subaxial cervical classification",
        title: "AOSpine Subaxial Cervical Spine Injury Classification System",
        edition: "Classification system",
        published: null,
        citation: null,
        kind: "Classification system",
        population: "Adults with subaxial cervical trauma",
        url: "https://surgeryreference.aofoundation.org/spine/trauma/subaxial-cervical/further-reading/classification",
        attribution: "title_verified",
      },
    ],
  },
  {
    key: "ispn",
    organization: "ISPN",
    full_name: "International Society for Pediatric Neurosurgery",
    url: "https://ispn.guide",
    scope: "Paediatric neurosurgery guidance across the specialty, including hydrocephalus and CSF disorders.",
    documents: [
      {
        id: "ispn_guide",
        short: "ISPN Guide to Pediatric Neurosurgery",
        title: "ISPN Guide to Pediatric Neurosurgery",
        edition: "Living online guide",
        published: null,
        citation: null,
        kind: "Expert guide — continuously updated, not a graded guideline",
        population: "Children",
        url: "https://ispn.guide",
        attribution: "title_verified",
      },
    ],
  },
  {
    key: "nice",
    organization: "NICE",
    full_name: "National Institute for Health and Care Excellence",
    url: "https://www.nice.org.uk/guidance",
    scope: "Head injury and spinal referral pathways with an explicit age scope.",
    documents: [
      {
        id: "nice_ng232",
        short: "NICE NG232",
        title: "Head injury: assessment and early management (NG232)",
        edition: "NICE guideline NG232",
        published: "2023",
        citation: null,
        kind: "National clinical guideline",
        population: "Infants, children and adults",
        url: "https://www.nice.org.uk/guidance/ng232",
        attribution: "verified",
      },
      {
        id: "nice_ng59",
        short: "NICE NG59",
        title: "Low back pain and sciatica in over 16s: assessment and management (NG59)",
        edition: "NICE guideline NG59",
        published: "2016",
        citation: null,
        kind: "National clinical guideline",
        population: "People over 16 years",
        url: "https://www.nice.org.uk/guidance/ng59",
        attribution: "verified",
      },
    ],
  },
  {
    key: "who",
    organization: "WHO",
    full_name: "World Health Organization",
    url: "https://icd.who.int",
    scope: "Diagnostic classification and tumour classification.",
    documents: [
      {
        id: "icd11_mms",
        short: "WHO ICD-11 MMS",
        title: "ICD-11 for Mortality and Morbidity Statistics (MMS)",
        edition: `Release ${NSG_ICD11.release}`,
        published: NSG_ICD11.release,
        citation: null,
        kind: "Statistical classification",
        population: "All ages",
        url: NSG_ICD11.browser_url,
        attribution: "verified",
      },
      {
        id: "who_cns5",
        short: "WHO CNS tumour classification",
        title: "WHO Classification of Tumours: Central Nervous System Tumours",
        edition: "5th edition",
        published: "2021",
        citation: null,
        kind: "Classification",
        population: "All ages, including paediatric-specific entities",
        url: "https://tumourclassification.iarc.who.int",
        attribution: "verified",
      },
    ],
  },
];

// Flattened documents, the shape the notes, prompts and saved text all use.
export const NSG_REFERENCES = NSG_SOURCE_ORGS.flatMap((org) =>
  org.documents.map((doc) => ({
    key: doc.id,
    short: doc.short,
    organization: org.organization,
    organization_full: org.full_name,
    version: doc.edition ? `${doc.title} — ${doc.edition}` : doc.title,
    label: doc.title,
    title: doc.title,
    edition: doc.edition,
    published: doc.published,
    citation: doc.citation,
    kind: doc.kind,
    population: doc.population,
    attribution: doc.attribution,
    url: doc.url,
  }))
);

// Superseded keys kept so no call site breaks.
const ALIASES = { aans_cns: "aans_tbi_4th" };

export const nsgReference = (key) => NSG_REFERENCES.find((r) => r.key === (ALIASES[key] || key)) || null;

export const NSG_PROVENANCE = {
  guideline: "Guideline-based",
  safety: "Safety-critical documentation",
  local_decision: "Local documentation requirement",
};

// ---- Per note attribution -------------------------------------------------
// Which published documents each note's structure follows, the population they
// cover, and where they diverge. The divergence text never merges the sources
// into one recommendation — it names the scope of each and requires the
// clinician to record which one was applied.
const icd = "icd11_mms";

export const NSG_NOTE_SOURCES = {
  nsg_consultation: {
    population: "Adults",
    documents: ["nice_ng59", "ao_spine_subaxial", "aans_tbi_4th", icd],
    divergences: [
      "NICE NG59 covers people over 16. A child with the same presentation is documented against the paediatric source and the age is recorded.",
    ],
  },
  nsg_spine: {
    population: "Adults (paediatric spinal injury documented separately)",
    documents: ["ao_spine_tl_classification", "ao_spine_tl_aosis", "ao_spine_subaxial", "nice_ng59", icd],
    divergences: [
      "AO Spine classifications define injury morphology and instability; NICE NG59 defines the referral pathway for back pain and sciatica over 16. They answer different questions — record which is being applied.",
      "Paediatric spinal injury is not covered by the adult AO Spine population: record the paediatric source applied.",
    ],
  },
  nsg_neurotrauma: {
    population: "Adults with severe TBI (NICE NG232 covers all ages)",
    documents: ["aans_tbi_4th", "nice_ng232", "ao_spine_tl_classification", icd],
    divergences: [
      "The AANS/CNS 4th edition is an adult guideline. NICE NG232 covers infants, children and adults. In a child, record that the paediatric pathway was applied and do not carry adult thresholds across.",
    ],
  },
  nsg_cerebrovascular: {
    population: "Adults with aneurysmal subarachnoid haemorrhage",
    documents: ["wfns_sah_scale", "eso_eans_esmint_asah", icd],
    divergences: [
      "The WFNS scale grades the clinical state only; the ESO/EANS/ESMINT guideline is European joint guidance on management. Where the local protocol differs, record the source applied.",
    ],
  },
  nsg_hydrocephalus: {
    population: "Children (paediatric sources) — adult hydrocephalus recorded separately",
    documents: ["cns_pediatric_hydrocephalus", "ispn_guide", icd],
    divergences: [
      "Paediatric hydrocephalus: CNS paediatric hydrocephalus guidance and the ISPN Guide. Adult hydrocephalus and normal-pressure hydrocephalus follow adult criteria — record which population and source apply.",
    ],
  },
  nsg_neuro_oncology: {
    population: "All ages — paediatric-specific tumour entities included",
    documents: ["who_cns5", icd],
    divergences: [
      "Histological and molecular classification follows the WHO CNS tumour classification edition recorded in this note; a radiological impression is never coded as an established neoplasm.",
    ],
  },
  nsg_cranial_operative: {
    population: "Adults",
    documents: ["aans_tbi_4th", "nice_ng232", icd],
    divergences: [
      "Where the operation is a trauma decompression, NICE NG232 covers the acute pathway across ages while the AANS/CNS guideline defines the adult severe-TBI evidence base — record the source applied.",
    ],
  },
  nsg_spinal_operative: {
    population: "Adults",
    documents: ["ao_spine_tl_classification", "ao_spine_tl_aosis", "ao_spine_subaxial", icd],
    divergences: [
      "The AO Spine system classifies the injury that was operated on; it does not dictate the operation. The surgical decision and its rationale are documented in this note.",
    ],
  },
  nsg_postop_progress: {
    population: "Adults",
    documents: ["aans_tbi_4th", icd],
    divergences: [
      "Post-operative thresholds are the treating unit's protocol; where a guideline threshold is quoted, record which document and population it came from.",
    ],
  },
  nsg_discharge: {
    population: "All ages",
    documents: ["nice_ng232", "cns_pediatric_hydrocephalus", icd],
    divergences: [
      "Discharge safety advice after head injury follows NICE NG232 across ages; shunt and device precautions follow the paediatric hydrocephalus sources where the patient is a child.",
    ],
  },
};

export const noteSourcesFor = (noteKey) => {
  const config = NSG_NOTE_SOURCES[noteKey] || { population: null, documents: [icd], divergences: [] };
  return {
    population: config.population,
    divergences: config.divergences || [],
    documents: (config.documents || []).map(nsgReference).filter(Boolean),
  };
};

// Compact labels for the template's own `guidelineBasis`, derived from this
// registry so a note can never cite something that is not defined here.
export const guidelineBasisLabels = (noteKey) =>
  noteSourcesFor(noteKey).documents.map((doc) => (doc.published ? `${doc.short} (${doc.published})` : doc.short));