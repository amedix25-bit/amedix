// Ophthalmology investigations — one structured record per test.
//
// Every ophthalmic investigation is stored with the five things a reader of the
// record needs to judge it and act on it: which test, which eye, when, why it was
// done, what it showed, how it was interpreted, and what changed because of it.
//
// The status is never inferred. A test that was not done, one whose report is not
// accessible, and one whose result is still awaited are three different facts and
// are recorded as three different answers — none of them is read as normal.
//
// Nothing here generates a result, a measurement or an interpretation: the record
// only holds what the clinician entered.

import { str } from "./ophthFieldKit.js";

export const OPHTH_INVESTIGATION_MODALITIES = [
  "OCT — macula",
  "OCT — optic nerve / retinal nerve fibre layer",
  "OCT angiography",
  "Anterior segment OCT",
  "Visual field test",
  "Fundus photography",
  "External eye photography",
  "Fluorescein angiography",
  "Indocyanine green angiography",
  "Corneal topography",
  "Corneal pachymetry",
  "Ocular ultrasound — A-scan biometry",
  "Ocular ultrasound — B-scan",
  "Ultrasound biomicroscopy",
  "Electrophysiology — ERG or VEP",
  "CT",
  "MRI",
  "Other — documented",
];

export const OPHTH_INVESTIGATION_EYES = ["Right", "Left", "Both", "Not applicable"];

export const OPHTH_INVESTIGATION_STATUSES = [
  "Performed — findings documented below",
  "Performed — report or images not available",
  "Ordered — result pending",
  "Not performed — reason documented",
  "Not indicated — documented",
];

export const emptyOphthInvestigation = () => ({
  modality: "",
  eye: "",
  date: "",
  indication: "",
  status: "",
  findings: "",
  interpretation: "",
  management_impact: "",
});

// A record is complete when the test, the eye and its status are recorded; the
// findings and interpretation are required only when the test was performed.
export const ophthInvestigationIncomplete = (record) => {
  const r = record || {};
  if (!str(r.modality)) return "Select the test.";
  if (!str(r.status)) return "Record what happened to this test.";
  const performed = str(r.status).startsWith("Performed — findings");
  if (performed && !str(r.findings)) return "Document the findings reported by the test.";
  if (performed && !str(r.eye)) return "Record the eye examined.";
  return "";
};

export const ophthInvestigationCount = (value) =>
  (Array.isArray(value) ? value : []).filter((r) => str(r?.modality)).length;

// The text a saved note, its print view and its PDF carry.
export const formatOphthInvestigations = (value) => {
  const records = (Array.isArray(value) ? value : []).filter((r) => str(r?.modality));
  if (!records.length) return "";
  return records
    .map((r) => {
      const head = [str(r.modality), str(r.eye) && `Eye: ${str(r.eye)}`, str(r.date), str(r.status)]
        .filter(Boolean)
        .join(" · ");
      const detail = [
        str(r.indication) && `Indication: ${str(r.indication)}`,
        str(r.findings) && `Findings: ${str(r.findings)}`,
        str(r.interpretation) && `Interpretation: ${str(r.interpretation)}`,
        str(r.management_impact) && `Effect on management: ${str(r.management_impact)}`,
      ]
        .filter(Boolean)
        .join("; ");
      return detail ? `${head} — ${detail}` : head;
    })
    .join("\n");
};