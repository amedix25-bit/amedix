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
// This module only APPENDS: the ICD-11 MMS coding field, the structured pediatric
// blocks, the advisory safety review and the guideline-basis record described in
// pedsClinicalSections.js. Fields are appended in order, and a key the note already
// declares is never added twice.

import { PEDS_ENHANCEMENTS } from "@/lib/pedsClinicalSections";

export const PEDS_ENHANCED_KEYS = Object.keys(PEDS_ENHANCEMENTS);

export const withPediatricsStandards = (docs) =>
  docs.map((doc) => {
    const sections = PEDS_ENHANCEMENTS[doc.key];
    if (!sections) return doc;
    const existing = new Set((doc.fields || []).map((f) => f.key));
    const additions = sections().filter((f) => {
      if (existing.has(f.key)) return false;
      existing.add(f.key);
      return true;
    });
    if (!additions.length) return doc;
    return { ...doc, fields: [...(doc.fields || []), ...additions] };
  });