// Guideline basis for the existing Otolaryngology (ENT) note types.
//
// Every entry below was retrieved from the organization's own official website
// (or its official journal DOI record) on the review date recorded here —
// nothing in this file is a citation from memory. Each reference records what
// it supports in AMedix and how strongly it binds the documentation:
//
//   documentation_standard — the documentation elements AMedix expects for that
//     note to stand as a complete record. These describe what must be
//     documented, never what the clinical decision must be.
//   clinical_recommendation — society guidance: recommended practice, not a
//     mandate, and always subject to the treating clinician's judgement.
//   classification_standard — coding / classification only. ICD-11 codes
//     diagnoses; it is never used as procedural or treatment guidance.
//
// Items that could not be verified, are paywalled, conflict with the app's
// existing shared rules, or depend on local policy are listed in
// ENT_REFERENCE_FLAGS and surfaced rather than quietly omitted.

export const ENT_REFERENCES_REVIEWED = "2026-10-28";

export const ENT_REFERENCE_LEVELS = {
  documentation_standard: "Documentation standard",
  clinical_recommendation: "Clinical recommendation",
  classification_standard: "Classification / coding",
};

export const ENT_REFERENCES = [
  {
    id: "aao_sinusitis_2025",
    organization: "AAO-HNSF",
    title: "Clinical Practice Guideline: Adult Sinusitis Update",
    version: "2025 (published 31 July 2025)",
    url: "https://www.entnet.org/quality-practice/quality-products/clinical-practice-guidelines/cpg-adult-sinusitis/",
    doi: "10.1002/ohn.1344",
    level: "clinical_recommendation",
    supports:
      "ENT Consultation and ENT Follow-Up — documented symptom duration and pattern (distinguishing acute bacterial from viral rhinosinusitis), examination findings, decision between observation and antibiotic treatment, and shared decision-making with the patient. Chronic rhinosinusitis: documented objective confirmation and the criterion used.",
    status: "verified_on_official_site",
  },
  {
    id: "aao_crs_surgery_2025",
    organization: "AAO-HNSF",
    title: "Clinical Practice Guideline: Surgical Management of Chronic Rhinosinusitis",
    version: "2025 (published 27 May 2025)",
    url: "https://www.entnet.org/quality-practice/quality-products/clinical-practice-guidelines/cpg-surgical-management-of-chronic-rhinosinusitis/",
    doi: "10.1002/ohn.1287",
    level: "clinical_recommendation",
    supports:
      "Pre-Operative Assessment (ENT), Operative Note (ENT), Post-Operative Note (ENT) and Discharge Summary (ENT) — documented indication and extent of endoscopic sinus surgery, documented preoperative expectations discussion with the patient, and a structured postoperative plan with debridement/follow-up intervals.",
    status: "verified_on_official_site",
  },
  {
    id: "aao_tinnitus_2026",
    organization: "AAO-HNSF",
    title: "Clinical Practice Guideline: Tinnitus Update",
    version: "2026 (published 12 October 2026)",
    url: "https://www.entnet.org/quality-practice/quality-products/clinical-practice-guidelines/cpg-tinnitus-update/",
    doi: "10.1002/ohn.70417",
    level: "clinical_recommendation",
    supports:
      "ENT Consultation and ENT Follow-Up for adults (18 years and older) with persistent, bothersome tinnitus — documented tinnitus history and impact, focused examination and hearing assessment, the management plan chosen, and the documented discussion of sound enrichment and mental-health support where offered.",
    status: "verified_on_official_site",
  },
  {
    id: "aao_arhl_2024",
    organization: "AAO-HNSF",
    title: "Clinical Practice Guideline: Age-Related Hearing Loss",
    version: "2024 (published 30 April 2024)",
    url: "https://www.entnet.org/quality-practice/quality-products/clinical-practice-guidelines/cpg-age-related-hearing-loss/",
    doi: "10.1002/ohn.750",
    level: "clinical_recommendation",
    supports:
      "Audiology / Diagnostic Report and ENT Follow-Up — documented hearing assessment for adults aged 50 and older, the audiometric basis for the stated degree of hearing loss, and the hearing-care pathway offered (amplification, communication support, referral).",
    status: "verified_on_official_site",
  },
  {
    id: "aao_sudden_hearing_loss_2019",
    organization: "AAO-HNSF",
    title: "Clinical Practice Guideline: Sudden Hearing Loss (Update)",
    version: "2019",
    url: "https://www.entnet.org/resource/clinical-practice-guideline-sudden-hearing-loss-update/",
    level: "clinical_recommendation",
    supports:
      "Audiology / Diagnostic Report and ENT Consultation — sudden sensorineural hearing loss recorded as a time-critical presentation: documented onset and interval to assessment, audiometric confirmation, and the treatment decision.",
    status: "verified_on_official_site",
  },
  {
    id: "aao_hoarseness_2018",
    organization: "AAO-HNSF",
    title: "Clinical Practice Guideline: Hoarseness (Dysphonia) Update",
    version: "2018",
    url: "https://www.entnet.org/resource/clinical-practice-guideline-hoarseness-dysphonia/",
    level: "clinical_recommendation",
    supports:
      "ENT Consultation and ENT Follow-Up — documented dysphonia history and duration, laryngeal examination findings, and the decision on voice therapy, medical or surgical management. Also supports the airway/voice elements of the Post-Operative Note and the Operative Note where recurrent laryngeal nerve risk is documented.",
    status: "verified_on_official_site",
  },
  {
    id: "aao_neck_mass_2017",
    organization: "AAO-HNSF",
    title: "Clinical Practice Guideline: Evaluation of the Neck Mass in Adults",
    version: "2017",
    url: "https://www.entnet.org/resource/clinical-practice-guideline-evaluation-of-the-neck-mass-in-adults/",
    level: "clinical_recommendation",
    supports:
      "ENT Consultation — documented neck mass evaluation: history (including risk factors), the structured neck examination, whether a neck mass is a persistent unexplained finding requiring further assessment, and the imaging / tissue-diagnosis decision.",
    status: "verified_on_official_site",
  },
  {
    id: "aao_tympanostomy_2022",
    organization: "AAO-HNSF",
    title: "Clinical Practice Guideline: Tympanostomy Tubes in Children (Update)",
    version: "2022",
    url: "https://www.entnet.org/quality-practice/quality-products/clinical-practice-guidelines/tympanostomy-tubes-in-children/",
    level: "clinical_recommendation",
    supports:
      "Pre-Operative Assessment (ENT), Operative Note (ENT), Post-Operative Note (ENT) and Discharge Summary (ENT) — documented indication for tympanostomy tube placement in children, the documented preoperative counselling, and the postoperative follow-up and water-precautions advice actually given.",
    status: "verified_on_official_site",
  },
  {
    id: "aao_ome_2016",
    organization: "AAO-HNSF",
    title: "Clinical Practice Guideline: Otitis Media with Effusion (Update)",
    version: "2016",
    url: "https://www.entnet.org/resource/clinical-practice-guideline-otitis-media-with-effusion-ome/",
    level: "clinical_recommendation",
    supports:
      "ENT Consultation and Audiology / Diagnostic Report — documented middle-ear effusion findings (pneumatic otoscopy / tympanometry), documented watchful-waiting versus intervention decision, and hearing assessment where effusion persists.",
    status: "verified_on_official_site",
  },
  {
    id: "aao_allergic_rhinitis_2015",
    organization: "AAO-HNSF",
    title: "Clinical Practice Guideline: Allergic Rhinitis",
    version: "2015",
    url: "https://www.entnet.org/resource/clinical-practice-guideline-allergic-rhinitis/",
    level: "clinical_recommendation",
    supports:
      "ENT Consultation — documented allergic rhinitis diagnosis and the treatment class selected (intranasal corticosteroid, oral antihistamine, referral for allergy evaluation), plus documented patient education.",
    status: "verified_on_official_site",
  },
  {
    id: "aao_aoe_2014",
    organization: "AAO-HNSF",
    title: "Clinical Practice Guideline: Acute Otitis Externa (Update)",
    version: "2014",
    url: "https://www.entnet.org/resource/clinical-practice-guideline-acute-otitis-externa/",
    level: "clinical_recommendation",
    supports:
      "ENT Consultation — documented acute otitis externa diagnosis, the topical preparation chosen, and the documented basis for any systemic antibiotic considered.",
    status: "verified_on_official_site",
  },
  {
    id: "aao_bells_palsy_2013",
    organization: "AAO-HNSF",
    title: "Clinical Practice Guideline: Bell's Palsy",
    version: "2013 (update in development at review date)",
    url: "https://www.entnet.org/resource/clinical-practice-guideline-bells-palsy/",
    level: "clinical_recommendation",
    supports:
      "ENT Consultation and ENT Follow-Up — documented facial nerve function at presentation and at follow-up, the documented distinction from other causes, and the treatment decision with its timing relative to onset.",
    status: "verified_on_official_site_update_pending",
  },
  {
    id: "aao_bppv_2017",
    organization: "AAO-HNSF",
    title: "Clinical Practice Guideline: Benign Paroxysmal Positional Vertigo (Update)",
    version: "2017",
    url: "https://www.entnet.org/resource/clinical-practice-guideline-benign-paroxysmal-positional-vertigo-bppv/",
    level: "clinical_recommendation",
    supports:
      "ENT Consultation, ENT Follow-Up and ENT Procedure Note — documented Dix-Hallpike / positional testing result, the canal identified, and the repositioning manoeuvre performed with its outcome.",
    status: "verified_on_official_site",
  },
  {
    id: "aao_cerumen_2017",
    organization: "AAO-HNSF",
    title: "Clinical Practice Guideline: Earwax (Cerumen Impaction) Update",
    version: "2017",
    url: "https://www.entnet.org/resource/clinical-practice-guideline-cerumen-impaction/",
    level: "clinical_recommendation",
    supports:
      "ENT Procedure Note — documented cerumen impaction, the removal method used, the outcome, and any contraindication recorded before instrumentation or irrigation.",
    status: "verified_on_official_site",
  },
  {
    id: "aao_epistaxis_2020",
    organization: "AAO-HNSF",
    title: "Clinical Practice Guideline: Nosebleed (Epistaxis)",
    version: "2020",
    url: "https://www.entnet.org/resource/clinical-practice-guideline-nosebleed-epistaxis/",
    level: "clinical_recommendation",
    supports:
      "ENT Procedure Note, Post-Operative Note (nasal packing status) and Discharge Summary — documented bleeding site and laterality, the intervention performed (pressure, cautery, packing), and the documented post-procedure instructions and warning signs.",
    status: "verified_on_official_site",
  },
  {
    id: "aao_menieres_2020",
    organization: "AAO-HNSF",
    title: "Clinical Practice Guideline: Ménière's Disease",
    version: "2020",
    url: "https://www.entnet.org/quality-practice/quality-products/clinical-practice-guidelines/menieres-disease/",
    level: "clinical_recommendation",
    supports:
      "ENT Consultation and ENT Follow-Up — documented episodic vertigo with its duration and frequency, documented hearing fluctuation and aural symptoms, and the staged management decision.",
    status: "verified_on_official_site",
  },
  {
    id: "aao_opioid_2021",
    organization: "AAO-HNSF",
    title:
      "Clinical Practice Guideline: Opioid Prescribing for Analgesia After Common Otolaryngology Operations",
    version: "2021",
    url: "https://www.entnet.org/resource/clinical-practice-guideline-opioid-prescribing-for-analgesia-after-common-otolaryngology-operations/",
    level: "clinical_recommendation",
    supports:
      "Discharge Summary (ENT) and Post-Operative Note (ENT) — documented postoperative analgesia plan, including whether an opioid was prescribed, the quantity, and the documented non-opioid alternative.",
    status: "verified_on_official_site",
  },
  {
    id: "aao_voice_thyroid_2013",
    organization: "AAO-HNSF",
    title: "Clinical Practice Guideline: Improving Voice Outcomes After Thyroid Surgery",
    version: "2013",
    url: "https://www.entnet.org/quality-practice/quality-products/clinical-practice-guidelines/voice-outcomes-after-thyroid-surgery/",
    level: "clinical_recommendation",
    supports:
      "Operative Note (ENT) and Post-Operative Note (ENT) for thyroid surgery — documented preoperative voice assessment, documented recurrent laryngeal nerve identification, and documented postoperative voice check.",
    status: "verified_on_official_site",
  },
  {
    id: "who_icd11_mms",
    organization: "World Health Organization",
    title: "International Classification of Diseases 11th Revision — Mortality and Morbidity Statistics (ICD-11 MMS)",
    version: "Latest release on icd.who.int (reviewed 2026-10-28)",
    url: "https://icd.who.int/browse/latest-release/mms/en",
    level: "classification_standard",
    supports:
      "Every ENT note's diagnosis coding. ICD-11 codes classify the documented diagnosis; they never confirm a diagnosis, never replace the clinician's differential, and never choose treatment. Codes are entered only from the WHO ICD-11 Browser (or the app's verified TerminologyCode mapping), with the code and its official display term recorded together.",
    status: "verified_official_browser",
  },
];

// References reviewed but NOT applied to any existing ENT note type yet, so no
// requirement is attached to them and no field pretends to follow them.
export const ENT_REFERENCES_NOT_YET_APPLIED = [
  {
    id: "aao_rhinoplasty_2017",
    title: "Clinical Practice Guideline: Improving Nasal Form and Function after Rhinoplasty",
    version: "2017",
    reason: "No existing ENT note type documents rhinoplasty; applicable only if a rhinoplasty note type is added.",
  },
  {
    id: "aao_immunotherapy_2024",
    title: "Clinical Practice Guideline: Immunotherapy for Inhalant Allergy",
    version: "2024",
    reason:
      "Allergy immunotherapy is not documented in any existing ENT note type; the Allergic Rhinitis guideline covers the current consultation scope only.",
  },
];

// Verification issues that must stay visible to the clinical lead. These are
// recorded, not hidden, and none of them silently changes clinical behaviour.
export const ENT_REFERENCE_FLAGS = [
  {
    id: "sinusitis_target_population",
    reference: "aao_sinusitis_2025",
    issue:
      "The AAO-HNS guideline page states the target patients are 'any individuals aged 50 years and older', which does not match an 'Adult Sinusitis' scope. Verify against the published article before any age-conditioned logic; until then AMedix applies no age gate and leaves the age judgement to the clinician.",
  },
  {
    id: "full_text_paywalled",
    reference: "aao_*",
    issue:
      "Full guideline texts are published behind a Wiley subscription. Only the official summaries, patient resources and DOI records were verifiable. AMedix therefore encodes the documentation elements the guideline addresses, never quoted key-action-statement wording.",
  },
  {
    id: "us_population_guidance",
    reference: "aao_*",
    issue:
      "AAO-HNSF guidance is written for the US population and US practice. It informs documentation and decision support only; local formulary, antibiotic availability and national policy take precedence when they differ.",
  },
  {
    id: "icd11_codes_not_yet_entered",
    reference: "who_icd11_mms",
    issue:
      "No ENT diagnosis codes are stored in TerminologyCode yet (the only ENT-adjacent mappings are thyroid-related). An ENT ICD-11 catalogue must be built from individually verified WHO Browser entries before coded diagnoses are offered.",
  },
  {
    id: "guideline_in_development",
    reference: "aao_bells_palsy_2013",
    issue:
      "The Bell's Palsy guideline is under revision at the review date; the current 2013 recommendations are used only as documentation requirements, not as treatment mandates.",
  },
];