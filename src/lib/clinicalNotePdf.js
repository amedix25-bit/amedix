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
  drawSectionHead,
  drawDivider,
  drawSignatureBlock,
  drawRequestFooter,
} from "@/lib/requestPdfLayout";
import { getSpecialtyLabel } from "@/lib/specialtyDocuments";
import { formatStoredValue } from "@/lib/examinations/clinicalExaminations";

const TITLE = "Clinical Note";
const SUBTITLE = "Official Medical Document";
const { margin: M, right: R } = PDF_PAGE;
const WIDTH = R - M;

// Body text that flows across pages inside the framed template. Content stops
// above the signature band, and a continuation page repeats the letterhead.
function writeFlow(doc, text, y, artwork, { size = 9.4, lineHeight = 4.9 } = {}) {
  const value = String(text || "").trim();
  if (!value) return y;
  let yy = y;
  doc.splitTextToSize(value, WIDTH).forEach((line) => {
    if (yy > CONTENT_BOTTOM) {
      yy = startPage(doc, artwork, TITLE) + 2;
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(size);
    doc.setTextColor(...PDF_INK.ink);
    doc.text(line, M, yy);
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

  doc.splitTextToSize(String(label || ""), WIDTH).forEach((line) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.9);
    doc.setTextColor(...PDF_INK.muted);
    doc.text(line, M, yy);
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
  drawSectionHead(
    doc,
    note.document_type_label || "Clinical Note",
    y,
    note.note_reference ? `Reference: ${note.note_reference}` : ""
  );
  y += 8;
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