// Strengthening the EXISTING Pediatrics note types.
//
// The eighteen pediatric templates declared in src/lib/specialtyDocuments.js —
// Pediatric Consultation, Pediatric Follow-Up, Well-Child Visit, Pediatric Admission
// Note, Pediatric Daily Progress Note, Pediatric Discharge Summary, Pediatric
// Procedure Note, Chronic Disease Follow-Up (Pediatric), Growth & Development Record,
// Immunization Record, Screening Record, Anticipatory Guidance, Newborn Record, Birth
// History, Neonatal Progress Note, Newborn Discharge Summary, Adolescent Health
// Assessment and Confidential Adolescent Note — are NOT recreated, renamed, replaced
// or reorganised. Their keys, labels, order and every existing field stay exactly as
// they are, so saved notes keep their meaning and every view, report and PDF that
// reads a note by key keeps working.
//
// This module only APPENDS, in clinical order:
//   1. the note's own history & context, measurements & examination, and assessment
//      & differential sections (src/lib/pedsNoteProfiles.js), so each note is
//      strengthened according to its clinical purpose;
//   2. the specialty records described in pedsClinicalSections.js (ICD-11 MMS coding,
//      the structured specialty blocks, the advisory safety review and the guideline
//      basis);
//   3. the note's own management, medication-safety, monitoring and follow-up record,
//      which follows the diagnosis rather than preceding it;
//   4. the safety review and then the guideline basis, both last.
// A key a note already declares is never added twice.

import { PEDS_ENHANCEMENTS } from "./pedsClinicalSections.js";
import { pedsNoteSections } from "./pedsNoteStrengthening.js";

export const PEDS_ENHANCED_KEYS = Object.keys(PEDS_ENHANCEMENTS);

export const withPediatricsStandards = (docs) =>
  docs.map((doc) => {
    const standards = PEDS_ENHANCEMENTS[doc.key] ? PEDS_ENHANCEMENTS[doc.key]() : [];
    const noteSections = pedsNoteSections(doc.key);

    const noteFront = noteSections.filter((f) => !f.key.startsWith("peds_care_"));
    const noteCare = noteSections.filter((f) => f.key.startsWith("peds_care_"));
    const clinical = standards.filter((f) => f.type !== "peds_safety" && f.type !== "peds_guidance");
    const safety = standards.filter((f) => f.type === "peds_safety");
    const guidance = standards.filter((f) => f.type === "peds_guidance");

    const ordered = [...noteFront, ...clinical, ...noteCare, ...safety, ...guidance];
    if (!ordered.length) return doc;

    const existing = new Set((doc.fields || []).map((f) => f.key));
    const additions = ordered.filter((f) => {
      if (existing.has(f.key)) return false;
      existing.add(f.key);
      return true;
    });
    if (!additions.length) return doc;
    return { ...doc, fields: [...(doc.fields || []), ...additions] };
  });