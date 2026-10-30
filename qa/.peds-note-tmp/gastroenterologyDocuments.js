// Strengthening the EXISTING Gastroenterology note types.
//
// The templates in src/lib/specialtyDocuments.js (GASTROENTEROLOGY DOCS: GI
// CONSULTATION, GI FOLLOW-UP, GI ADMISSION NOTE, GI PROGRESS NOTE, ENDOSCOPY
// REPORT, COLONOSCOPY REPORT, ERCP PROCEDURE REPORT, GI PROCEDURE NOTE,
// BIOPSY / PATHOLOGY REQUEST, DISCHARGE SUMMARY) are NOT recreated, renamed,
// replaced or reorganised. Their keys, labels and order stay exactly as they are,
// and nothing already in them is removed, so every saved note keeps its meaning
// and every report that reads a note by key keeps working. This module only
// APPENDS fields.
//
// HEPATOLOGY lives inside the same specialty — a liver patient is documented on
// the same consultation, admission, progress and discharge notes — so the liver
// content is added to those notes rather than to a parallel catalogue.
//
// GUIDELINES INTEGRATED INTO THE CONTENT ITSELF
//   1. Alarm features are recorded explicitly (bleeding, dysphagia, weight loss,
//      anaemia, mass/organomegaly, family history), with the escalation they
//      triggered — the ACG and AGA requirement that new GI symptoms with alarm
//      features are expedited.
//   2. GI bleeding is documented the way ACG and Baveno VII act on it: haemodynamic
//      state, transfusion, antithrombotic therapy with a reversal and restart
//      plan, endoscopy timing, Forrest class, endoscopic haemostasis and, in
//      cirrhosis, vasoactive therapy with antibiotic prophylaxis.
//   3. IBD is documented by extent, activity instrument, endoscopic severity,
//      pre-treatment screening before immunosuppression, C. difficile testing in a
//      flare, acute severe colitis with rescue planning, and the surveillance and
//      bone-health questions AGA guidance requires.
//   4. Liver disease records the aetiology with its evidence, a non-invasive
//      fibrosis assessment, decompensation events, encephalopathy grade, variceal
//      screening and prophylaxis (Baveno VII), diagnostic paracentesis and SBP
//      prophylaxis (AASLD), HCC surveillance (AASLD) and alcohol or drug causality
//      assessment (AASLD / EASL).
//   5. Acute pancreatitis records the two-of-three diagnostic criteria, the
//      aetiology work-up, the Revised Atlanta severity, fluid therapy and feeding
//      (ACG).
//   6. Every endoscopic procedure records consent, time-out, sedation monitoring,
//      and the quality indicators endoscopy guidance measures; colonoscopy adds
//      preparation scale, cecal intubation, withdrawal time, polyp detail and the
//      surveillance interval with the guideline it was based on; ERCP adds the
//      Schutz grade, post-ERCP pancreatitis prophylaxis and the perforation check.
//   7. WHO ICD-11 MMS is the mandatory classification for every note: a structured
//      primary/secondary diagnosis field and a SEPARATE differential field, each
//      entry carrying its own code, release, source, role, status, mapping state
//      and clinical basis. A code never confirms a diagnosis, and an unresolved
//      diagnosis stores no code at all.
//
// AUDIT RULES APPLIED HERE (the same rules the other specialties follow)
//   - Nothing duplicates a shared AMedix surface: vital signs, the structured
//     abdominal examination (Select Examination), laboratory and imaging results,
//     medications, allergies and the patient's recorded history are provided by
//     the shared note tabs and the unified Patient Record.
//   - Every field is optional; a blank field is read as not documented, never as
//     normal, and "Not assessed" is a real answer everywhere it appears.
//   - Conditional questions (`showIf`) appear only where the context makes them
//     relevant, so a follow-up note never asks for a Forrest class.
//   - The advisory prompts never block saving and never change a diagnosis.

import { gastroenterologyCatalogFor } from "./gastroenterologyIcd11.js";
import { gastroGuidelineBasis } from "./gastroenterologyReferences.js";
import { GASTRO_BLOCKS } from "./gastroenterologyModules.js";

const blockField = (key) => ({ key, label: GASTRO_BLOCKS[key].title, type: "gi_modules" });

const icdBlock = (domains, placeholder) => [
  {
    key: "icd11_diagnoses",
    label: "Primary & Secondary Diagnoses (ICD-11 MMS)",
    type: "icd11_diagnoses",
    catalog: gastroenterologyCatalogFor(domains),
    searchPlaceholder: placeholder,
    roles: ["Primary", "Secondary"],
  },
  {
    key: "icd11_differential",
    label: "Differential Diagnoses — not confirmed (ICD-11 MMS)",
    type: "icd11_diagnoses",
    catalog: gastroenterologyCatalogFor(domains),
    searchPlaceholder: "Search ICD-11 — a diagnosis under consideration, not a confirmed one…",
    roles: ["Differential"],
    statuses: ["Suspected", "Provisional"],
  },
];

const scoresBlock = (scores) => ({
  key: "gi_scores",
  label: "Clinical Scores (calculated only from documented values)",
  type: "gi_scores",
  scores,
});

const safetyBlock = () => ({
  key: "gi_safety",
  label: "Safety Concerns & Documented Action",
  type: "gi_safety",
});

const guidanceBlock = (noteKey) => ({
  key: "gi_guidance",
  label: "Guideline Basis & Attribution",
  type: "gi_guidance",
  noteKey,
});

const LUMINAL = ["oesophagus", "stomach_duodenum", "small_intestine", "large_intestine"];
const LIVER = ["liver", "viral_hepatitis", "biliary"];

const GASTRO_ENHANCEMENTS = {
  gi_consultation: () => [
    blockField("gi_alarm"),
    blockField("gi_nutrition"),
    blockField("gi_upper_gi"),
    blockField("gi_functional"),
    blockField("gi_coeliac"),
    blockField("gi_viral_hepatitis"),
    blockField("gi_masld"),
    blockField("gi_immune_metabolic"),
    blockField("gi_liver"),
    blockField("gi_cirrhosis"),
    blockField("gi_paracentesis_proc"),
    blockField("gi_drug_safety"),
    ...icdBlock([...LUMINAL, "ibd", "functional", ...LIVER, "pancreas"], "Search ICD-11 — the GI or liver diagnosis this consultation documents…"),
    scoresBlock(["fib4", "apri", "child_pugh", "meld_na"]),
    safetyBlock(),
    guidanceBlock("gi_consultation"),
  ],

  gi_followup: () => [
    blockField("gi_ibd"),
    blockField("gi_upper_gi"),
    blockField("gi_functional"),
    blockField("gi_coeliac"),
    blockField("gi_biliary"),
    blockField("gi_viral_hepatitis"),
    blockField("gi_masld"),
    blockField("gi_liver"),
    blockField("gi_cirrhosis"),
    blockField("gi_nutrition"),
    blockField("gi_drug_safety"),
    ...icdBlock(["ibd", "functional", "large_intestine", "small_intestine", ...LIVER], "Search ICD-11 — the condition being followed up…"),
    scoresBlock(["partial_mayo", "hbi", "fib4", "apri", "child_pugh"]),
    safetyBlock(),
    guidanceBlock("gi_followup"),
  ],

  gi_admission_note: () => [
    blockField("gi_bleeding"),
    blockField("gi_pancreatitis"),
    blockField("gi_pancreatic"),
    blockField("gi_infection"),
    blockField("gi_biliary"),
    blockField("gi_immune_metabolic"),
    blockField("gi_liver"),
    blockField("gi_cirrhosis"),
    blockField("gi_acute"),
    blockField("gi_drug_safety"),
    ...icdBlock([...LUMINAL, ...LIVER, "pancreas", "vascular", "diverticular"], "Search ICD-11 — the diagnosis this admission documents…"),
    scoresBlock(["blatchford", "bisap", "child_pugh", "meld_na", "apri"]),
    safetyBlock(),
    guidanceBlock("gi_admission_note"),
  ],

  gi_progress_note: () => [
    blockField("gi_bleeding"),
    blockField("gi_infection"),
    blockField("gi_liver"),
    blockField("gi_cirrhosis"),
    blockField("gi_acute"),
    blockField("gi_drug_safety"),
    ...icdBlock(["oesophagus", "stomach_duodenum", "large_intestine", ...LIVER, "pancreas"], "Search ICD-11 — the active problem this progress note documents…"),
    scoresBlock(["child_pugh", "meld_na", "bisap"]),
    safetyBlock(),
    guidanceBlock("gi_progress_note"),
  ],

  gi_endoscopy_report: () => [
    blockField("gi_endoscopy"),
    blockField("gi_bleeding"),
    blockField("gi_upper_gi"),
    blockField("gi_proc_safety"),
    blockField("gi_capsule"),
    blockField("gi_eus"),
    ...icdBlock(["oesophagus", "stomach_duodenum", "small_intestine", "neoplasm"], "Search ICD-11 — the endoscopic diagnosis documented above…"),
    scoresBlock(["blatchford"]),
    safetyBlock(),
    guidanceBlock("gi_endoscopy_report"),
  ],

  gi_colonoscopy_report: () => [
    blockField("gi_polypectomy"),
    blockField("gi_endoscopy"),
    blockField("gi_proc_safety"),
    blockField("gi_colorectal"),
    blockField("gi_ibd"),
    ...icdBlock(["large_intestine", "ibd", "anal", "diverticular", "vascular", "neoplasm"], "Search ICD-11 — the colonic diagnosis or polyp condition documented…"),
    safetyBlock(),
    guidanceBlock("gi_colonoscopy_report"),
  ],

  gi_ercp_report: () => [
    blockField("gi_ercp"),
    blockField("gi_endoscopy"),
    blockField("gi_proc_safety"),
    blockField("gi_biliary"),
    blockField("gi_pancreatic"),
    ...icdBlock(["biliary", "pancreas", "liver", "neoplasm"], "Search ICD-11 — the biliary or pancreatic diagnosis this ERCP documents…"),
    safetyBlock(),
    guidanceBlock("gi_ercp_report"),
  ],

  gi_procedure_note: () => [
    blockField("gi_endoscopy"),
    blockField("gi_proc_safety"),
    blockField("gi_liver_biopsy"),
    blockField("gi_paracentesis_proc"),
    blockField("gi_eus"),
    blockField("gi_capsule"),
    blockField("gi_upper_gi"),
    blockField("gi_drug_safety"),
    ...icdBlock([...LUMINAL, ...LIVER, "pancreas", "anal"], "Search ICD-11 — the diagnosis this procedure documents…"),
    safetyBlock(),
    guidanceBlock("gi_procedure_note"),
  ],

  gi_pathology_request: () => [
    blockField("gi_endoscopy"),
    blockField("gi_colorectal"),
    blockField("gi_coeliac"),
    ...icdBlock([...LUMINAL, ...LIVER, "ibd", "pancreas", "neoplasm"], "Search ICD-11 — the coded diagnosis this specimen relates to…"),
    safetyBlock(),
    guidanceBlock("gi_pathology_request"),
  ],

  gi_discharge_summary: () => [
    blockField("gi_discharge"),
    blockField("gi_infection"),
    blockField("gi_biliary"),
    blockField("gi_liver"),
    blockField("gi_cirrhosis"),
    blockField("gi_ibd"),
    blockField("gi_drug_safety"),
    ...icdBlock([...LUMINAL, ...LIVER, "ibd", "pancreas", "neoplasm"], "Search ICD-11 — the discharge diagnoses…"),
    scoresBlock(["child_pugh", "meld_na", "apri"]),
    safetyBlock(),
    guidanceBlock("gi_discharge_summary"),
  ],
};

// Appends — never replaces — so a saved note keeps every field it already had.
export const withGastroenterologyStandards = (docs) =>
  docs.map((doc) => {
    const extra = GASTRO_ENHANCEMENTS[doc.key];
    if (!extra) return doc;
    const existing = new Set((doc.fields || []).map((f) => f.key));
    const additions = extra().filter((f) => {
      if (existing.has(f.key)) return false;
      existing.add(f.key);
      return true;
    });
    if (!additions.length) return doc;
    return {
      ...doc,
      fields: [...(doc.fields || []), ...additions],
      // The guideline basis the note's content was built from, recorded on the
      // template so the note header and its PDF state it without re-typing.
      guidelineBasis: gastroGuidelineBasis(doc.key),
    };
  });