// Strengthening the EXISTING Orthopedics & Traumatology note types.
//
// The eleven templates declared in src/lib/specialtyDocuments.js — Orthopedic
// Consultation, Orthopedic Follow-Up, Fracture Assessment, Injury Assessment,
// Pre-Operative Assessment, Operative Note, Procedure Note, Post-Operative Note,
// Daily Orthopedic Progress Note, Discharge Summary and Rehabilitation Plan — are
// NOT recreated, renamed, replaced or reorganised. Their keys, labels, order and
// every existing field stay exactly as they are, so saved notes keep their
// meaning and every view, report and PDF that reads a note by key keeps working.
//
// This module only APPENDS: the ICD-11 MMS coding field and the structured
// sections described in orthopedicsClinicalSections.js, then one orthopaedic
// patient-safety review to every note type. Fields are appended in order and a
// key that the note already declares is never added twice.

import { ORTHO_CLINICAL_SECTIONS } from "./orthopedicsClinicalSections.js";

export const ORTHO_ENHANCED_KEYS = Object.keys(ORTHO_CLINICAL_SECTIONS);

export const withOrthopedicsStandards = (docs) =>
  docs.map((doc) => {
    const sections = ORTHO_CLINICAL_SECTIONS[doc.key];
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