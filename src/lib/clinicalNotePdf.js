// The clinical note as an AMedix official document.
//
// The sheet follows a hospital record's own order — patient and doctor
// identification, the note type and reference, then the encounter grouped into
// history, vitals, examination, investigations, assessment and management — in
// aligned label/value rows, one compact vital-signs grid and system-grouped
// examination blocks. Nothing recorded on the note is dropped: every answered
// field is printed in its own section, in the order its specialty declares.
import { jsPDF } from "jspdf";
import {
  loadRequestLogo,
  drawRequestHeader,
  drawPatientBlock,
  drawDoctorBlock,
  drawSectionLabel,
  drawDivider,
  drawSignatureInline,
  drawRequestFooter,
} from "@/lib/requestPdfLayout";
import { getSpecialtyLabel, getDocDef } from "@/lib/specialtyDocuments";
import { formatStoredValue } from "@/lib/examinations/clinicalExaminations";
import {
  PAGE,
  textWidth,
  wrap,
  writeLine,
  writeRow,
  writeSection,
  writeVitalGrid,
  writeExamination,
  parseVitals,
  nextPage,
} from "@/lib/clinicalNotePdfLayout";

const TITLE = "Clinical Note";
const SUBTITLE = "Official Medical Document";
const { W } = PAGE;

// Documentation aids kept with the note (its evidence base and reference
// register) are never printed on the patient's document.
const NOT_ON_DOCUMENT = /guideline\s*basis|reference\s*register|guideline_basis|reference_register/i;

// The order a clinical record is read in. A field's own section decides where
// it prints; when it declares none, its label decides.
const SECTIONS = [
  "History & Presentation",
  "Past Medical, Medication & Allergy History",
  "Vital Signs",
  "Physical Examination",
  "Investigations & Results",
  "Assessment & Diagnosis",
  "Management, Treatment & Follow-Up",
  "Additional Clinical Documentation",
];

const RULES = [
  { at: 0, test: /history|complaint|present|symptom|system|psychosocial|growth|development|nutrition|lifestyle|adolescent|safeguarding/i },
  { at: 1, test: /past|previous|background|medication|drug|allerg|immunis|vaccin|co-?morbid|social|family/i },
  { at: 4, test: /investigation|laborator|radiolog|imaging|ecg|echocardiogra|endoscop|biopsy|patholog|scan|panel|result/i },
  { at: 5, test: /diagnos|assessment|differential|reasoning|impression|icd/i },
  {
    at: 6,
    test: /management|treatment|plan|prescription|therap|procedure|intervention|referral|follow.?up|disposition|monitor|safety|resuscitation|escalat|education|advice|counsel|admission|operative|postop/i,
  },
];

const sectionFor = (text) => {
  const found = RULES.find((rule) => rule.test.test(text));
  return found ? found.at : 7;
};

// Every label/value the specialty document declares, keyed by field key, so a
// stored field can find the section and type it was recorded under.
function fieldMeta(note) {
  const def = note.document_type ? getDocDef(note.document_type) : null;
  const map = new Map();
  (def?.fields || []).forEach((field) => map.set(field.key, field));
  return map;
}

// The note type across the head with its reference: a long type name wraps and
// the reference drops to its own line rather than running off the sheet.
function writeDocHead(doc, title, reference, y) {
  const label = String(title || "Clinical Note").toUpperCase();
  const ref = String(reference || "").trim();
  const labelWidth = textWidth(doc, label, 7.6, "bold") + label.length * 1.1;
  const refWidth = ref ? textWidth(doc, ref, 7.6, "bold") + ref.length * 1.1 : 0;
  let yy = y;

  if (!ref || labelWidth + refWidth + 8 <= W) {
    drawSectionLabel(doc, label, yy);
    if (ref) drawSectionLabel(doc, ref, yy, PAGE.R, "right");
    return yy + 6;
  }
  wrap(doc, label, W, 7.6, "bold").forEach((line) => {
    drawSectionLabel(doc, line, yy);
    yy += 5.2;
  });
  drawSectionLabel(doc, ref, yy, PAGE.R, "right");
  return yy + 6;
}

// Gathers everything the note recorded into sections, once, so nothing is
// printed twice and nothing is left out.
function collect(note, meta) {
  const items = [];
  const sensitive = [];
  const vitals = [];
  const examinations = [];

  const add = (at, label, value) => {
    const text = String(value ?? "").trim();
    if (!text) return;
    items.push({ at, label, value: text });
  };

  if (String(note.vital_signs || "").trim()) vitals.push(["Vital Signs", note.vital_signs]);
  if (String(note.physical_examination || "").trim()) {
    examinations.push(["Physical Examination", note.physical_examination]);
  }

  // The encounter's own record leads its section; the specialty's fields follow.
  add(0, "History", note.history);
  add(1, "Allergies", note.allergies || "None recorded");
  add(1, "Current Medications", (note.current_medications || []).join(", ") || "None recorded");

  const diagnoses = (Array.isArray(note.provisional_diagnoses) && note.provisional_diagnoses.length > 0
    ? note.provisional_diagnoses
    : [note.diagnosis]
  ).filter((item) => String(item || "").trim());
  if (diagnoses.length > 0) {
    add(5, "Provisional Diagnosis", diagnoses.map((item) => `• ${String(item).trim()}`).join("\n"));
  }

  add(4, "Biopsy", note.biopsy);
  add(6, "Prescriptions", note.prescription);
  add(6, "Interventions", note.interventions);
  add(6, "Doctor's Recommendations", note.recommendations);
  add(7, "Additional Notes", note.notes);

  Object.entries(note.data || {}).forEach(([key, field]) => {
    if (!field) return;
    const label = field.label || key;
    if (NOT_ON_DOCUMENT.test(`${key} ${label}`)) return;
    const value = formatStoredValue(field.value).trim();
    if (!value) return;
    if (key.startsWith("srh.")) {
      sensitive.push([label, value]);
      return;
    }
    const declared = meta.get(key) || {};
    const type = String(field.type || declared.type || "");
    const group = `${declared.section || ""} ${label} ${type}`;

    if (/vital/i.test(`${label} ${type}`)) {
      if (!vitals.some(([, existing]) => existing.trim() === value)) vitals.push([label, value]);
      return;
    }
    if (/exam|physical/i.test(`${label} ${type}`) || /^\s*•/m.test(value)) {
      if (!examinations.some(([, existing]) => existing.trim() === value)) examinations.push([label, value]);
      return;
    }
    add(sectionFor(group), label, value);
  });

  return { items, sensitive, vitals, examinations };
}

export async function generateClinicalNotePdf(note, { logo, profile } = {}) {
  const artwork = logo || (await loadRequestLogo());
  const doc = new jsPDF();

  let y = drawRequestHeader(doc, { logo: artwork, title: TITLE, subtitle: SUBTITLE, framed: true });

  y = drawPatientBlock(
    doc,
    {
      patient_name: note.patient_name,
      patient_cin: note.patient_cin,
      patient_dob: note.patient_dob,
      patient_gender: profile?.gender,
      patient_blood_type: profile?.blood_type,
    },
    y
  );

  y = drawDoctorBlock(
    doc,
    {
      doctor_name: note.doctor_name,
      doctor_specialization: note.specialty ? getSpecialtyLabel(note.specialty) : "",
      doctor_hospital: note.hospital,
      date_requested: note.encounter_datetime || note.date,
    },
    y,
    { heading: "Treating Doctor & Hospital", doctorLabel: "Treating doctor" }
  );

  // ===== Note type & reference =====
  y += 7;
  if (y > PAGE.BOTTOM - 24) y = nextPage(doc, artwork, TITLE);
  y = writeDocHead(doc, note.document_type_label || "Clinical Note", note.note_reference ? `Reference: ${note.note_reference}` : "", y);
  drawDivider(doc, y);
  y += 6;

  const meta = fieldMeta(note);
  const { items, sensitive, vitals, examinations } = collect(note, meta);
  const at = (index) => items.filter((item) => item.at === index);

  // ===== History, then past history, medications and allergies =====
  [0, 1].forEach((index) => {
    const rows = at(index);
    if (rows.length === 0) return;
    y = writeSection(doc, SECTIONS[index], y, artwork, TITLE);
    rows.forEach((row) => {
      y = writeRow(doc, row.label, row.value, y, artwork, { noteTitle: TITLE });
    });
    y += 2;
  });

  // ===== Vital signs — one compact grid =====
  const vitalGroups = vitals
    .map(([label, value]) => ({ label, grid: parseVitals(value), raw: value }))
    .filter((group) => group.grid.length > 0 || String(group.raw).trim());
  if (vitalGroups.length > 0) {
    y = writeSection(doc, SECTIONS[2], y, artwork, TITLE);
    vitalGroups.forEach((group) => {
      y =
        group.grid.length === 0
          ? writeRow(doc, group.label, group.raw, y, artwork, { noteTitle: TITLE })
          : writeVitalGrid(doc, group.grid, y, artwork, TITLE);
    });
    y += 2;
  }

  // ===== Physical examination — grouped by system =====
  if (examinations.length > 0) {
    y = writeSection(doc, SECTIONS[3], y, artwork, TITLE);
    examinations.forEach(([label, value]) => {
      y = writeExamination(doc, value, y, artwork, TITLE, { label });
    });
    y += 2;
  }

  // ===== Investigations, assessment, management, additional documentation =====
  [4, 5, 6, 7].forEach((index) => {
    const rows = at(index);
    if (rows.length === 0) return;
    y = writeSection(doc, SECTIONS[index], y, artwork, TITLE);
    rows.forEach((row) => {
      y = writeRow(doc, row.label, row.value, y, artwork, { noteTitle: TITLE });
    });
    y += 2;
  });

  // ===== Sexual & reproductive history — its own clearly marked block =====
  if (sensitive.length > 0) {
    y = writeSection(doc, "Sexual & Reproductive History (Sensitive)", y, artwork, TITLE);
    sensitive.forEach(([label, value]) => {
      y = writeRow(doc, label, value, y, artwork, { noteTitle: TITLE });
    });
    y += 2;
  }

  // ===== Signature at the end of the record =====
  if (y + 44 > PAGE.BOTTOM) y = nextPage(doc, artwork, TITLE);
  drawSignatureInline(
    doc,
    {
      doctorName: note.signed_by_name || note.doctor_name,
      detail: [note.specialty ? getSpecialtyLabel(note.specialty) : "", note.hospital].filter(Boolean).join("  ·  "),
      note: note.signed_datetime
        ? `Electronically signed ${new Date(note.signed_datetime).toLocaleString("en-GB")}`
        : "Electronically signed",
    },
    y,
    artwork,
    TITLE
  );

  drawRequestFooter(doc, note.note_reference || note.id);
  return doc;
}