// Strengthening the EXISTING Neurology note types.
//
// The eleven templates declared in src/lib/specialtyDocuments.js — Neurology
// Consultation, Neurology Follow-Up, Neurology Admission Note, Neurology Progress
// Note, Neurology Discharge Summary, Neurologic Procedure Note, EEG Report, EMG /
// NCS Report, Stroke Assessment / Record, Seizure / Epilepsy Follow-Up and
// Neurology Referral — are NOT recreated, renamed, replaced or reorganised. Their
// keys, labels, order and every existing field stay exactly as they are, so saved
// notes keep their meaning and every view, report and PDF that reads a note by key
// keeps working.
//
// This module only APPENDS: the ICD-11 MMS coding field and the structured sections
// described in neurologyClinicalSections.js. Fields are appended in order, and a
// key the note already declares is never added twice.

import { NEURO_ENHANCEMENTS } from "./neurologyClinicalSections.js";

export const withNeurologyStandards = (docs) =>
  docs.map((doc) => {
    const sections = NEURO_ENHANCEMENTS[doc.key];
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