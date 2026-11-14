// The clinical note as an AMedix official document.
//
// The sheet follows a hospital record's own order — patient and doctor
// identification, the note type and reference, then the encounter grouped into
// history, vitals, examination, investigations, assessment and management — set
// in one typographic system: navy section headings, small muted field labels, and
// every recorded value in the same regular-weight dark text. Nothing recorded on
// the note is dropped or reworded: each answered field prints under its own
// section, in the order its specialty declares.
import { jsPDF } from "jspdf";
import { loadRequestLogo } from "@/lib/requestPdfLayout";
import { getSpecialtyLabel, getDocDef } from "@/lib/specialtyDocuments";
import { formatStoredValue } from "@/lib/examinations/clinicalExaminations";
import {
  isDocumentedValue,
  isDecisionSupportType,
  documentedActions,
  stripCodingPrompts,
  isRawPayload,
} from "@/lib/clinicalNotePdfContent";
import {
  openNotePage,
  drawNoteFooter,
  writePatientName,
  writeDocumentHead,
  flushDocumentHead,
  writeSection,
  writeFieldGrid,
  writeSubBlock,
  writeVitalGrid,
  writeExamination,
  writeSignature,
  parseVitals,
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

// ===== Identification =====
function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function formatDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (isNaN(date.getTime())) return String(value);
  const day = formatDate(date);
  // A recorded date alone carries no time to report.
  if (typeof value === "string" && !/\d{1,2}:\d{2}/.test(value) && !/T\d{2}/.test(value)) return day;
  const time = date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return `${day} · ${time}`;
}

// The signing time exactly as recorded, shown in the reader's local time zone
// with that zone named, so the moment of signing is unambiguous.
function formatSignedAt(value) {
  if (!value) return "";
  const date = new Date(value);
  if (isNaN(date.getTime())) return String(value);
  const stamp = date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  return zone && !stamp.includes(zone) ? `${stamp} (${zone})` : stamp;
}

function patientAge(dob) {
  if (!dob) return "";
  const date = new Date(dob);
  if (isNaN(date.getTime())) return "";
  const now = new Date();
  let age = now.getFullYear() - date.getFullYear();
  const month = now.getMonth() - date.getMonth();
  if (month < 0 || (month === 0 && now.getDate() < date.getDate())) age -= 1;
  return age >= 0 ? `${age} years` : "";
}

const capitalise = (value) => {
  const text = String(value || "").trim();
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : "";
};

function patientFacts(note, profile) {
  const dob = note.patient_dob;
  return [
    { label: "Clinical Identification Number (CIN)", value: note.patient_cin },
    { label: "Date of birth", value: [formatDate(dob), patientAge(dob)].filter(Boolean).join("  ·  ") },
    { label: "Gender", value: capitalise(profile?.gender) },
    { label: "Blood group", value: profile?.blood_type },
  ];
}

function doctorFacts(note) {
  return [
    { label: "Treating doctor", value: note.doctor_name },
    { label: "Specialty", value: note.specialty ? getSpecialtyLabel(note.specialty) : "" },
    { label: "Hospital", value: note.hospital },
    { label: "Date and time", value: formatDateTime(note.encounter_datetime || note.date) },
  ];
}

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
  // Patient-record snapshots print only when the record holds them: an absent
  // snapshot is not a documented finding and is never shown as "None recorded".
  core(1, "Allergies", note.allergies);
  core(1, "Current Medications", (note.current_medications || []).join(", "));

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

  // ICD-11 coding prints from the note's own structured entries: the documented
  // diagnosis with its role, status and clinical basis. Coding metadata, mapping
  // prompts and provenance lines are audit detail, not documentation, and never
  // print. A note without structured coding falls back to its recorded field text.
  const coded = (Array.isArray(note.icd11_coded_diagnoses) ? note.icd11_coded_diagnoses : []).filter(
    (entry) => entry && String(entry.display || "").trim()
  );
  const codedField = [...meta.values()].find((field) => field.type === "icd11_diagnoses");
  if (coded.length > 0) {
    const section = String(codedField?.section || "").trim();
    const at = section ? sectionFor(`${section} diagnosis`) : 5;
    const target = block(
      section || SECTIONS[5],
      at,
      codedField && order.has(codedField.key) ? order.get(codedField.key) : 0
    );
    coded.forEach((entry) => {
      const head = [String(entry.code || "").trim(), String(entry.display || "").trim()].filter(Boolean).join("  ");
      const basis = String(entry.basis || "").trim();
      const follow = String(entry.follow_up || "").trim();
      addEntry(
        target,
        [entry.role, entry.status].filter(Boolean).join(" · ") || "Diagnosis",
        [head, basis ? `Clinical basis: ${basis}` : "", follow ? `Follow-up: ${follow}` : ""].filter(Boolean).join("\n")
      );
    });
  }

  // A structured examination prints its own documented findings, so the same
  // findings flattened beside it are not printed a second time.
  const hasStructuredExam = Object.entries(note.data || {}).some(([key, field]) => {
    const declared = meta.get(key) || {};
    const type = String(field?.type || declared.type || "");
    const label = String(field?.label || declared.label || key);
    const text = stripCodingPrompts(formatStoredValue(field?.value));
    if (!isDocumentedValue(text)) return false;
    return type === "examinations" || (/exam/i.test(label) && /^\s*•/m.test(text) && !/^\s*•/.test(text));
  });

  Object.entries(note.data || {}).forEach(([key, field], index) => {
    if (!field || key.includes("__")) return;
    if (hasStructuredExam && key.startsWith("exam.")) return;
    const declared = meta.get(key) || {};
    const label = field.label || declared.label || key;
    if (NOT_ON_DOCUMENT.test(`${key} ${label}`)) return;
    const raw = stripCodingPrompts(formatStoredValue(field.value));
    if (!isDocumentedValue(raw) || isRawPayload(raw)) return;
    const value = raw.trim();
    if (key.startsWith("srh.")) {
      sensitive.push({ label, value });
      return;
    }

    const type = String(field.type || declared.type || "");
    // The coded diagnoses already printed above, from their structured record.
    if (coded.length > 0 && type === "icd11_diagnoses") return;
    const position = order.has(key) ? order.get(key) : 900 + index;
    const section = String(declared.section || "").trim();

    // Decision support reduces to what the clinician documented — an action, a
    // decision, an escalation, an additional concern. A block carrying only rule
    // text, prompts or provenance has nothing documented and prints nothing.
    if (isDecisionSupportType(type) || /safety concern/i.test(section)) {
      const documented = documentedActions(value);
      if (documented.length === 0) return;
      const at = section ? sectionFor(`${section} ${label}`) : 6;
      const target = block(section || SECTIONS[6], at, position);
      documented.forEach((entry) => addEntry(target, entry.label, entry.value));
      return;
    }

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
  const ctx = { artwork, title: TITLE, subtitle: SUBTITLE };

  let y = openNotePage(doc, ctx);

  // ===== Patient and doctor identification =====
  writeSection(doc, "Patient Information");
  y = writePatientName(doc, note.patient_name, y, ctx);
  y = writeFieldGrid(doc, patientFacts(note, profile), y, ctx);

  writeSection(doc, "Treating Doctor & Hospital");
  y = writeFieldGrid(doc, doctorFacts(note), y, ctx);

  // ===== Note type & reference =====
  // Held back and printed together with the first clinical section, so the head
  // of the record is never left alone at the foot of a page.
  writeDocumentHead(
    doc,
    note.document_type_label || "Clinical Note",
    note.note_reference ? `Reference: ${note.note_reference}` : ""
  );

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
      // The heading is held back until the block beneath it is measured, so the
      // two are always placed together on the same page.
      writeSection(doc, item.title);

      item.vitals.forEach(([label, value]) => {
        const grid = parseVitals(value);
        const caption = /^vital signs?$/i.test(String(label).trim()) ? "" : label;
        y =
          grid.length > 0
            ? writeVitalGrid(doc, grid, y, ctx, { caption })
            : writeFieldGrid(doc, [{ label, value }], y, ctx);
      });

      item.groups.forEach(([label, value]) => {
        y = writeExamination(doc, value, y, ctx, { label });
      });

      y = writeFieldGrid(doc, item.entries, y, ctx);

      item.subs.forEach((sub) => {
        y = writeSubBlock(doc, sub.label, sub.entries, y, ctx);
      });
    });

  // ===== Sexual & reproductive history — its own clearly marked block =====
  if (sensitive.length > 0) {
    writeSection(doc, "Sexual & Reproductive History (Sensitive)");
    y = writeFieldGrid(doc, sensitive, y, ctx);
  }

  // A record with no clinical section still carries its title and reference.
  y = flushDocumentHead(doc, y, ctx);

  // ===== Electronic signature at the end of the record =====
  // The panel reports the note's own signing event, recorded server-side when the
  // physician signed. Producing the PDF never creates, changes or re-timestamps a
  // signature, and the signed content stays as it was finalized.
  const signed = Boolean(
    String(note.signed_datetime || "").trim() && String(note.signed_by_name || "").trim()
  );
  writeSignature(
    doc,
    {
      signed,
      doctorName: note.signed_by_name || note.doctor_name,
      specialty: note.specialty ? getSpecialtyLabel(note.specialty) : note.department,
      hospital: note.hospital,
      signedAt: signed ? formatSignedAt(note.signed_datetime) : "",
      reference: note.note_reference,
    },
    y,
    ctx
  );

  drawNoteFooter(doc, note.note_reference || note.id);
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