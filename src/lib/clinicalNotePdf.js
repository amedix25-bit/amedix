import { jsPDF } from "jspdf";
import {
  PDF_INK,
  PDF_PAGE,
  FLOW_BOTTOM,
  loadRequestLogo,
  drawRequestHeader,
  startPage,
  drawIdentityBlock,
  drawSectionLabel,
  drawField,
  drawDivider,
  drawWrappedBlock,
  drawSignatureInline,
  drawRequestFooter,
} from "@/lib/requestPdfLayout";

const TITLE = "CLINICAL NOTE";

// Builds a patient-facing PDF for a saved clinical note, in the same document
// family as every other AMedix document: the full encounter documentation —
// patient identity, doctor, date/time, location, provisional diagnoses, vital
// signs, examination findings, management and recommendations.
export async function generateClinicalNotePdf(note, logo) {
  const artwork = logo || (await loadRequestLogo());
  const doc = new jsPDF();
  const { margin: M, right: R } = PDF_PAGE;

  let y = drawRequestHeader(doc, { logo: artwork, title: TITLE });

  const dt = note.encounter_datetime ? new Date(note.encounter_datetime) : null;
  const valid = dt && !isNaN(dt.getTime());
  const dateStr = valid
    ? dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : note.date || "—";
  const timeStr = valid ? dt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "";

  y = drawIdentityBlock(doc, {
    name: note.patient_name,
    cin: note.patient_cin,
    fields: [["Date of Birth", note.patient_dob]],
  }, y);

  // ===== Treating doctor & encounter =====
  const top = y + 7;
  drawSectionLabel(doc, "Treating Doctor", top);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...PDF_INK.ink);
  doc.text(String(note.doctor_name || "").trim() || "—", M, top + 9);

  drawField(doc, "Date & Time Seen", [dateStr, timeStr].filter(Boolean).join("  ·  "), M, top + 18);
  drawField(doc, "Clinical Location", note.location, M + 92, top + 18);
  drawField(doc, "Specialty", note.specialty, M, top + 33);
  drawField(doc, "Hospital / Clinic", note.hospital, M + 92, top + 33);

  y = top + 44;
  drawDivider(doc, y);
  y += 9;

  // ===== Provisional diagnosis =====
  const dxList = Array.isArray(note.provisional_diagnoses) && note.provisional_diagnoses.length > 0
    ? note.provisional_diagnoses
    : [note.diagnosis].filter(Boolean);

  if (dxList.length > 0) {
    if (y > FLOW_BOTTOM - 16) y = startPage(doc, artwork, TITLE) + 4;
    drawSectionLabel(doc, "Provisional Diagnosis", y);
    y += 7.5;
    dxList.forEach((diagnosis, index) => {
      y = drawWrappedBlock(doc, null, `${index + 1}. ${diagnosis}`, y, artwork, TITLE, { gap: 1.5, fontSize: 10.5 }) + 1;
    });
    y += 4;
  }

  // ===== Documentation =====
  [
    ["Vital Signs", note.vital_signs],
    ["History", note.history],
    ["Physical Examination", note.physical_examination],
    ["Prescriptions", note.prescription],
    ["Interventions", note.interventions],
    ["Biopsy", note.biopsy],
    ["Doctor's Recommendations", note.recommendations],
    ["Additional Notes", note.notes],
  ].forEach(([label, value]) => {
    y = drawWrappedBlock(doc, label, value, y, artwork, TITLE);
  });

  // ===== Electronic signature =====
  y = drawSignatureInline(doc, {
    doctorName: note.signed_by_name || note.doctor_name,
    detail: [note.specialty, note.hospital].filter(Boolean).join("  ·  "),
    note: note.signed_datetime
      ? `Electronically signed ${new Date(note.signed_datetime).toLocaleString("en-GB")}`
      : "Electronically signed",
  }, y, artwork, TITLE);

  drawRequestFooter(doc, note.note_reference || note.id);
  return doc;
}