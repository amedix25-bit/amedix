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
  drawDivider,
  drawSignatureInline,
  drawRequestFooter,
} from "@/lib/requestPdfLayout";
import { getSpecialtyLabel, getDocDef } from "@/lib/specialtyDocuments";
import { formatStoredValue } from "@/lib/examinations/clinicalExaminations";
import {
  PAGE,
  writeDocumentHead,
  writeSection,
  writeFieldGrid,
  writeSubBlock,
  writeVitalGrid,
  writeExamination,
  parseVitals,
  nextPage,
} from "@/lib/clinicalNotePdfLayout";
import { renderAuditedDocument, setDocumentDensity } from "@/lib/pdfLayoutAudit";

const TITLE = "Clinical Note";
const SUBTITLE = "Official Medical Document";

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
  { at: 0, test: /history|complaint|present|symptom|system|psychosocial|growth|development|nutrition|lifestyle|adolescent|safeguarding|menstrual|obstetric|gynae|pregnan|contracept|menopause/i },
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

// The note's own template: every field the specialty declares, keyed by field
// key, with the position it holds in that template. A stored field finds the
// section and type it was recorded under, and the order its specialty wrote it
// in, without reading the template twice.
function fieldIndex(note) {
  const def = note.document_type ? getDocDef(note.document_type) : null;
  const meta = new Map();
  const order = new Map();
  (def?.fields || []).forEach((field, index) => {
    if (!meta.has(field.key)) meta.set(field.key, field);
    if (!order.has(field.key)) order.set(field.key, index);
  });
  return { meta, order };
}

// Gathers everything the note recorded into the headings it actually has: a
// specialty field prints under the section its own template declares, and the
// note's core fields (or a field whose template declares no section) print
// under the clinical heading their label belongs to. One heading per section,
// however many sub-options it holds, so nothing is printed twice and nothing of
// the specialty's own structure is renamed, merged or dropped.
function collect(note, meta, order) {
  const blocks = new Map();
  const sensitive = [];

  const block = (title, at, position) => {
    const key = String(title || SECTIONS[7]).trim() || SECTIONS[7];
    if (!blocks.has(key)) {
      blocks.set(key, {
        title: key,
        at: at ?? sectionFor(key),
        order: position ?? 900,
        entries: [],
        subs: [],
        groups: [],
        vitals: [],
      });
    }
    const found = blocks.get(key);
    found.order = Math.min(found.order, position ?? 900);
    return found;
  };

  const addEntry = (target, label, value) => {
    const text = String(value ?? "").trim();
    if (!text) return;
    if (target.entries.some((entry) => entry.label === label && entry.value === text)) return;
    target.entries.push({ label, value: text });
  };

  const vitalsBlock = block(SECTIONS[2], 2, 0);
  const examBlock = block(SECTIONS[3], 3, 0);
  const addVital = (label, value) => {
    const text = String(value ?? "").trim();
    if (!text) return;
    if (vitalsBlock.vitals.some(([, existing]) => existing === text)) return;
    vitalsBlock.vitals.push([label, text]);
  };

  // The encounter's own record leads its section; the specialty's fields follow.
  const core = (index, label, value) => addEntry(block(SECTIONS[index], index, 0), label, value);

  addVital("Vital Signs", note.vital_signs);
  if (String(note.physical_examination || "").trim()) {
    examBlock.groups.push(["Physical Examination", note.physical_examination]);
  }

  core(0, "History", note.history);
  core(1, "Allergies", note.allergies || "None recorded");
  core(1, "Current Medications", (note.current_medications || []).join(", ") || "None recorded");

  const diagnoses = (Array.isArray(note.provisional_diagnoses) && note.provisional_diagnoses.length > 0
    ? note.provisional_diagnoses
    : [note.diagnosis]
  ).filter((item) => String(item || "").trim());
  if (diagnoses.length > 0) {
    core(5, "Provisional Diagnosis", diagnoses.map((item) => `• ${String(item).trim()}`).join("\n"));
  }

  core(4, "Biopsy", note.biopsy);
  core(6, "Prescriptions", note.prescription);
  core(6, "Interventions", note.interventions);
  core(6, "Doctor's Recommendations", note.recommendations);
  core(7, "Additional Notes", note.notes);

  Object.entries(note.data || {}).forEach(([key, field], index) => {
    if (!field) return;
    const declared = meta.get(key) || {};
    const label = field.label || declared.label || key;
    if (NOT_ON_DOCUMENT.test(`${key} ${label}`)) return;
    const value = formatStoredValue(field.value).trim();
    if (!value) return;
    if (key.startsWith("srh.")) {
      sensitive.push({ label, value });
      return;
    }

    const type = String(field.type || declared.type || "");
    const position = order.has(key) ? order.get(key) : 900 + index;
    const section = String(declared.section || "").trim();
    // A structured examination keeps its own system groups inside its section.
    const grouped = /^\s*•/m.test(value) && !/^\s*•/.test(value);

    if (type === "examinations" || (/exam/i.test(`${section} ${label}`) && grouped)) {
      block(section || SECTIONS[3], 3, position).groups.push([label, value]);
      return;
    }

    // Vital signs print together as one grid, never as a vertical list.
    if (type === "vitals" || (/^vital signs?\b/i.test(label) && parseVitals(value).length > 0)) {
      addVital(label, value);
      return;
    }

    const at = section ? sectionFor(`${section} ${label}`) : sectionFor(`${label} ${type}`);
    const target = block(section || SECTIONS[at], at, position);

    // A bulleted list prints as its own labelled findings, one entry per
    // bullet, under the label the clinician documented it as.
    const lines = value
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    if (lines.length > 1 && lines.every((line) => /^•/.test(line) && line.includes(":"))) {
      const findings = lines
        .map((line) => {
          const clean = line.replace(/^•\s*/, "");
          const colon = clean.indexOf(":");
          return { label: clean.slice(0, colon).trim(), value: clean.slice(colon + 1).trim() };
        })
        .filter((entry) => entry.label && entry.value);
      if (findings.length > 0) {
        target.subs.push({ label, entries: findings });
        return;
      }
    }

    addEntry(target, label, value);
  });

  return { blocks, sensitive };
}

// One complete render of the record at a given spacing density.
function renderNote(note, { artwork, profile, density = 1 }) {
  const doc = new jsPDF();
  setDocumentDensity(doc, density);

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
  y = writeDocumentHead(
    doc,
    note.document_type_label || "Clinical Note",
    note.note_reference ? `Reference: ${note.note_reference}` : "",
    y
  );
  drawDivider(doc, y);
  y += 6;

  const { meta, order } = fieldIndex(note);
  const { blocks, sensitive } = collect(note, meta, order);

  // Every heading the note actually has, in the order a clinical record is read:
  // each section printed once, its sub-options laid out beside each other.
  [...blocks.values()]
    .filter(
      (item) =>
        item.entries.length > 0 || item.subs.length > 0 || item.groups.length > 0 || item.vitals.length > 0
    )
    .sort((a, b) => a.at - b.at || a.order - b.order)
    .forEach((item) => {
      y = writeSection(doc, item.title, y, artwork, TITLE);

      item.vitals.forEach(([label, value]) => {
        const grid = parseVitals(value);
        const caption = /^vital signs?$/i.test(String(label).trim()) ? "" : label;
        y = grid.length > 0
          ? writeVitalGrid(doc, grid, y, artwork, TITLE, { caption })
          : writeFieldGrid(doc, [{ label, value }], y, artwork, TITLE);
      });

      item.groups.forEach(([label, value]) => {
        y = writeExamination(doc, value, y, artwork, TITLE, { label });
      });

      y = writeFieldGrid(doc, item.entries, y, artwork, TITLE);

      item.subs.forEach((sub) => {
        y = writeSubBlock(doc, sub.label, sub.entries, y, artwork, TITLE);
      });
      y += 2;
    });

  // ===== Sexual & reproductive history — its own clearly marked block =====
  if (sensitive.length > 0) {
    y = writeSection(doc, "Sexual & Reproductive History (Sensitive)", y, artwork, TITLE);
    y = writeFieldGrid(doc, sensitive, y, artwork, TITLE);
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

// A clinical record is issued only once its pages pass the layout audit: the
// sheet is rendered, every page checked for clipped, overlapping or orphaned
// content, and re-rendered with tighter spacing when the first pass is not
// clean — never with smaller type.
export async function generateClinicalNotePdf(note, { logo, profile } = {}) {
  const artwork = logo || (await loadRequestLogo());
  return renderAuditedDocument((density) => renderNote(note, { artwork, profile, density }));
}