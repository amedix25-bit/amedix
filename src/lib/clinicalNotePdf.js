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
import {
  drawHeader,
  drawCard,
  drawBox,
  drawVitals,
  drawFollowUp,
  drawSignatureRow,
  drawFooters,
  rowsToLines,
  examToLines,
} from "@/lib/clinicalNoteTemplate";
import { getSpecialtyLabel, getDocDef } from "@/lib/specialtyDocuments";
import { formatStoredValue } from "@/lib/examinations/clinicalExaminations";
import {
  PAGE,
  textWidth,
  wrap,
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
    if (items.some((item) => item.label === label && item.value === text)) return;
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
    if (/exam|physical/i.test(`${label} ${type} ${declared.section || ""}`)) {
      if (!examinations.some(([, existing]) => existing.trim() === value)) examinations.push([label, value]);
      return;
    }
    add(sectionFor(group), label, value);
  });

  return { items, sensitive, vitals, examinations };
}

const CHIEF = /chief|presenting complaint|reason for (visit|consultation)|^complaint/i;
const FOLLOW = /follow.?up|return precaution|safety.?net|review in|next visit/i;

export async function generateClinicalNotePdf(note, { logo, profile } = {}) {
  const artwork = logo || (await loadRequestLogo());
  const doc = new jsPDF();
  const ref = note.note_reference ? `Reference: ${note.note_reference}` : "";
  const when = note.encounter_datetime || note.date;
  const whenText = when && !Number.isNaN(new Date(when).getTime()) ? new Date(when).toLocaleString("en-GB") : "";
  const specialty = note.specialty ? getSpecialtyLabel(note.specialty) : "";

  let y = drawHeader(doc, artwork, ref);

  y = drawCard(
    doc,
    "PATIENT INFORMATION",
    [
      { label: "Full name", value: note.patient_name, big: true },
      { label: "CIN / National ID", value: note.patient_cin, big: true },
      { value: `Date of birth: ${note.patient_dob || "—"}` },
      { value: `Sex: ${profile?.gender || "—"}  |  Blood type: ${profile?.blood_type || "—"}` },
    ],
    y,
    { tinted: true }
  );
  y = drawCard(
    doc,
    "ENCOUNTER DETAILS",
    [
      { value: `Date / time: ${whenText || "—"}` },
      { value: `Note type: ${note.document_type_label || "Clinical Note"}` },
      { value: `Treating doctor: ${note.doctor_name || "—"}${specialty ? `  (${specialty})` : ""}` },
      { value: `Hospital: ${note.hospital || "—"}` },
    ],
    y,
    { tinted: false }
  );

  const meta = fieldMeta(note);
  const { items, sensitive, vitals, examinations } = collect(note, meta);
  const rowsAt = (index, keep = () => true) =>
    items.filter((item) => item.at === index && keep(item)).map(({ label, value }) => ({ label, value }));

  const chiefRows = items.filter((item) => item.at === 0 && CHIEF.test(item.label)).map(({ label, value }) => ({ label, value }));
  const followRows = items.filter((item) => item.at === 6 && FOLLOW.test(item.label));
  const section = (title, hint, rows) => {
    if (rows.length > 0) y = drawBox(doc, title, hint, rowsToLines(doc, rows), y, ref);
  };

  section("Chief Complaint", "", chiefRows);
  section("History of Present Illness (HPI)", "", rowsAt(0, (item) => !CHIEF.test(item.label)));
  section("Relevant History", "PMH  |  PSH  |  Medications  |  Allergies", rowsAt(1));

  const vitalGroups = vitals
    .map(([label, value]) => {
      const grid = parseVitals(value);
      return grid.length > 0 ? grid : [{ label, value }];
    })
    .filter((group) => group.length > 0);
  if (vitalGroups.length > 0) y = drawVitals(doc, vitalGroups, y, ref);

  if (examinations.length > 0) {
    const lines = examinations.flatMap(([label, value], i) => [
      ...(i > 0 ? [{ gap: true, h: 2 }] : []),
      ...examToLines(doc, label, value),
    ]);
    y = drawBox(doc, "Review of Systems & Physical Examination", "", lines, y, ref);
  }

  section("Investigations & Results", "", rowsAt(4));
  section("Assessment / Diagnosis", "Include differential when relevant", rowsAt(5));
  section(
    "Plan & Management",
    "Treatment  |  Investigations  |  Referrals  |  Advice",
    rowsAt(6, (item) => !FOLLOW.test(item.label))
  );
  if (followRows.length > 0) {
    y = drawFollowUp(doc, followRows.map((r) => r.value).join("\n"), y, ref);
  }
  section("Additional Clinical Documentation", "", rowsAt(7));
  section(
    "Sexual & Reproductive History (Sensitive)",
    "",
    sensitive.map(([label, value]) => ({ label, value }))
  );

  y = drawSignatureRow(
    doc,
    {
      physician: [note.signed_by_name || note.doctor_name, specialty].filter(Boolean).join(" / "),
      license: note.signed_by_license || note.doctor_license,
      signedAt: note.signed_datetime ? new Date(note.signed_datetime).toLocaleString("en-GB") : "",
    },
    y + 2,
    ref
  );

  drawFooters(doc);
  return doc;
}