import { jsPDF } from "jspdf";
import {
  PDF_PAGE,
  PDF_INK,
  CONTENT_BOTTOM,
  loadRequestLogo,
  drawRequestHeader,
  startPage,
  ensureSignatureRoom,
  drawPatientBlock,
  drawDoctorBlock,
  drawSectionLabel,
  drawDivider,
  drawSignatureBlock,
  drawRequestFooter,
} from "@/lib/requestPdfLayout";
import { getSpecialtyLabel } from "@/lib/specialtyDocuments";
import { formatStoredValue } from "@/lib/examinations/clinicalExaminations";
import { hasArabic, wrapArabicText, drawArabicLine, arabicWidth } from "@/lib/pdfText";

const TITLE = "Clinical Note";
const SUBTITLE = "Official Medical Document";
const { margin: M, right: R } = PDF_PAGE;
const WIDTH = R - M;

// The guideline basis and its reference register are documentation aids kept
// with the note itself — they are never printed on the patient's document.
const NOT_ON_DOCUMENT = /guideline\s*basis|reference\s*register|guideline_basis|reference_register/i;

function textWidth(doc, text, size, weight) {
  if (hasArabic(text)) return arabicWidth(text, size, weight);
  doc.setFont("helvetica", weight);
  doc.setFontSize(size);
  return doc.getTextWidth(String(text || ""));
}

// Nothing may run past the right margin: a line that is still too wide (a long
// reference, a word with no spaces) is broken at the character that fits.
function fitLines(doc, lines, size, weight = "normal") {
  const out = [];
  lines.forEach((line) => {
    if (textWidth(doc, line, size, weight) <= WIDTH + 0.5) {
      out.push(line);
      return;
    }
    let current = "";
    Array.from(String(line)).forEach((character) => {
      if (current && textWidth(doc, current + character, size, weight) > WIDTH) {
        out.push(current);
        current = character;
      } else {
        current += character;
      }
    });
    if (current) out.push(current);
  });
  return out;
}

// Lines of a paragraph, measured the way they will be printed: Arabic with the
// browser's own text engine, everything else with the PDF's text metrics — and
// every line guaranteed to fit the text column.
function wrap(doc, text, width, size, weight = "normal") {
  const lines = hasArabic(text)
    ? wrapArabicText(text, width, size, weight)
    : doc.splitTextToSize(String(text || ""), width);
  return fitLines(doc, lines, size, weight);
}

// The note type across the head of the sheet, with its reference. A long type
// name wraps instead of running off the page, and the reference moves to its
// own line when there is no room beside it.
function writeNoteHead(doc, title, reference, y) {
  const label = String(title || "Clinical Note").toUpperCase();
  const ref = String(reference || "").trim();
  const labelWidth = textWidth(doc, label, 7.6, "bold") + label.length * 1.1;
  const refWidth = ref ? textWidth(doc, ref, 7.6, "bold") + ref.length * 1.1 : 0;
  let yy = y;

  if (!ref || labelWidth + refWidth + 8 <= WIDTH) {
    drawSectionLabel(doc, label, yy);
    if (ref) drawSectionLabel(doc, ref, yy, R, "right");
    return yy + 8;
  }

  wrap(doc, label, WIDTH, 7.6, "bold").forEach((line) => {
    drawSectionLabel(doc, line, yy);
    yy += 5.4;
  });
  drawSectionLabel(doc, ref, yy, R, "right");
  return yy + 8;
}

// One line, at its baseline. Arabic lines are shaped and printed as a crisp
// image; Latin lines stay selectable PDF text.
function writeLine(doc, line, y, { size = 9.4, weight = "normal", color = PDF_INK.ink, x = M, width = WIDTH, align = "left" } = {}) {
  if (hasArabic(line)) {
    drawArabicLine(doc, line, x, y, { size, weight, color, width, align });
    return;
  }
  doc.setFont("helvetica", weight);
  doc.setFontSize(size);
  doc.setTextColor(...color);
  doc.text(line, x, y, align === "right" ? { align: "right" } : undefined);
}

// Body text that flows across pages inside the framed template. Content stops
// above the signature band, and a continuation page repeats the letterhead.
function writeFlow(doc, text, y, artwork, { size = 9.4, lineHeight = 4.9 } = {}) {
  const value = String(text || "").trim();
  if (!value) return y;
  let yy = y;
  wrap(doc, value, WIDTH, size).forEach((line) => {
    if (yy > CONTENT_BOTTOM) {
      yy = startPage(doc, artwork, TITLE) + 2;
    }
    writeLine(doc, line, yy, { size, color: PDF_INK.ink });
    yy += lineHeight;
  });
  return yy;
}

// A labelled field: a small muted label over its value.
function writeLabelled(doc, label, value, y, artwork) {
  const text = String(value || "").trim();
  if (!text) return y;
  let yy = y;
  if (yy > CONTENT_BOTTOM - 12) yy = startPage(doc, artwork, TITLE) + 2;

  wrap(doc, String(label || ""), WIDTH, 6.9, "bold").forEach((line) => {
    writeLine(doc, line, yy, { size: 6.9, weight: "bold", color: PDF_INK.muted });
    yy += 3.4;
  });
  yy += 1.4;
  yy = writeFlow(doc, text, yy, artwork);
  return yy + 3.2;
}

// The specialty-specific documentation stored on the note, exactly as it was
// recorded: every answered field with its own label. Sexual & reproductive
// history is kept in its own clearly marked block.
function documentedFields(note) {
  const entries = Object.entries(note.data || {}).filter(
    ([, field]) => field && field.value !== null && field.value !== undefined && field.value !== ""
  );
  const main = [];
  const sensitive = [];
  entries.forEach(([key, field]) => {
    if (NOT_ON_DOCUMENT.test(`${key} ${field.label || ""}`)) return;
    const value = formatStoredValue(field.value).trim();
    if (!value) return;
    (key.startsWith("srh.") ? sensitive : main).push([field.label || key, value]);
  });
  return { main, sensitive };
}

// Builds the clinical note as an AMedix official document — the same framed
// sheet, patient and doctor blocks, and signed foot as the laboratory and
// imaging request forms.
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
  y += 8;
  if (y > CONTENT_BOTTOM - 20) y = startPage(doc, artwork, TITLE) + 6;
  y = writeNoteHead(
    doc,
    note.document_type_label || "Clinical Note",
    note.note_reference ? `Reference: ${note.note_reference}` : "",
    y
  );
  drawDivider(doc, y);
  y += 9;

  // ===== Provisional diagnosis =====
  const dxList = (Array.isArray(note.provisional_diagnoses) && note.provisional_diagnoses.length > 0
    ? note.provisional_diagnoses
    : [note.diagnosis]
  ).filter((d) => String(d || "").trim());

  if (dxList.length > 0) {
    if (y > CONTENT_BOTTOM - 16) y = startPage(doc, artwork, TITLE) + 2;
    drawSectionLabel(doc, "Provisional Diagnosis", y);
    y += 7;
    dxList.forEach((diagnosis, index) => {
      y = writeFlow(doc, `${index + 1}. ${diagnosis}`, y, artwork, { size: 10 });
      y += 1;
    });
    y += 5;
  }

  // ===== Encounter documentation =====
  [
    ["History", note.history],
    ["Vital Signs", note.vital_signs],
    ["Physical Examination", note.physical_examination],
    ["Prescriptions", note.prescription],
    ["Interventions", note.interventions],
    ["Biopsy", note.biopsy],
    ["Doctor's Recommendations", note.recommendations],
    ["Additional Notes", note.notes],
  ].forEach(([label, value]) => {
    y = writeLabelled(doc, label, value, y, artwork);
  });

  // ===== Specialty-specific clinical documentation =====
  const { main, sensitive } = documentedFields(note);
  if (main.length > 0) {
    if (y > CONTENT_BOTTOM - 16) y = startPage(doc, artwork, TITLE) + 2;
    drawSectionLabel(doc, "Clinical Documentation", y);
    y += 7;
    main.forEach(([label, value]) => {
      y = writeLabelled(doc, label, value, y, artwork);
    });
    y += 2;
  }
  if (sensitive.length > 0) {
    if (y > CONTENT_BOTTOM - 20) y = startPage(doc, artwork, TITLE) + 2;
    drawSectionLabel(doc, "Sexual & Reproductive History (Sensitive)", y);
    y += 7;
    sensitive.forEach(([label, value]) => {
      y = writeLabelled(doc, label, value, y, artwork);
    });
    y += 2;
  }

  // ===== Patient snapshot recorded with the note =====
  y = writeLabelled(doc, "Allergies", note.allergies || "None recorded", y, artwork);
  y = writeLabelled(
    doc,
    "Current Medications",
    (note.current_medications || []).join(", ") || "None recorded",
    y,
    artwork
  );

  // ===== Signature at the foot of the document =====
  y = ensureSignatureRoom(doc, y, artwork, TITLE);
  drawSignatureBlock(doc, {
    doctorName: note.signed_by_name || note.doctor_name,
    detail: [note.specialty ? getSpecialtyLabel(note.specialty) : "", note.hospital].filter(Boolean).join("  ·  "),
    note: note.signed_datetime
      ? `Electronically signed ${new Date(note.signed_datetime).toLocaleString("en-GB")}`
      : "Electronically signed",
  });

  drawRequestFooter(doc, note.note_reference || note.id);
  return doc;
}