import { jsPDF } from "jspdf";
import { calcAge } from "@/lib/labRequestPdf";
import {
  PDF_PAGE,
  PDF_INK,
  drawRequestHeader,
  ensureSpace,
  ensureSignatureRoom,
  textBlockHeight,
  drawPatientBlock,
  drawDoctorBlock,
  drawInvestigationsHeading,
  drawInvestigationLine,
  drawSectionLabel,
  drawField,
  drawTextBlock,
  drawSignatureBlock,
  drawRequestFooter,
} from "@/lib/requestPdfLayout";

// Phase 9 — request references are not predictable: a cryptographic suffix of
// 6 unambiguous characters (~28 bits) on top of the date prefix.
const ID_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export function makeImagingRequestId() {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  let suffix = "";
  for (const b of bytes) suffix += ID_CHARS[b % ID_CHARS.length];
  return `IR-${ymd}-${suffix}`;
}

export function generateImagingRequestPdf(req) {
  const doc = new jsPDF();
  const { margin: M, right: R } = PDF_PAGE;
  const logo = req.logo;

  let y = drawRequestHeader(doc, { logo });
  y = drawPatientBlock(doc, req, y);
  y = drawDoctorBlock(doc, req, y);
  y = drawInvestigationsHeading(doc, y, req.priority);

  // Only the examination actually requested — never laboratory terminology.
  const examination = [req.scan_type, req.examination || req.body_part].filter(Boolean).join(" — ");
  y = drawInvestigationLine(doc, y, examination, "");

  y += 2;
  [
    ["Clinical Indication", req.clinical_indication],
    ["Working Diagnosis / Clinical Question", req.working_diagnosis],
  ].forEach(([label, value]) => {
    if (!String(value || "").trim()) return;
    y = ensureSpace(doc, y, textBlockHeight(doc, value), logo);
    y = drawTextBlock(doc, label, value, y);
  });

  // ===== Contrast =====
  const contrastRows = [];
  if (req.contrast && req.contrast !== "Not applicable") contrastRows.push(["Contrast", req.contrast]);
  if (req.contrast_allergy) contrastRows.push(["Contrast Allergy", req.contrast_allergy]);
  if (req.previous_contrast_reaction) contrastRows.push(["Previous Contrast Reaction", req.previous_contrast_reaction]);
  contrastRows.forEach(([label, value]) => {
    y = ensureSpace(doc, y, 11, logo);
    drawField(doc, label, value, M, y, { width: 150 });
    y += 11;
  });

  // ===== MRI safety screening =====
  if (req.scan_type === "MRI") {
    const safety = [
      ["Metal or metallic implant in the body", req.mri_metal_implant],
      ["Pacemaker or implanted cardiac device", req.mri_pacemaker],
      ["Other implanted medical device", req.mri_other_device],
      ["Possible metallic foreign body, especially in the eye", req.mri_metallic_foreign_body],
    ].filter(([, value]) => value);
    if (safety.length) {
      y = ensureSpace(doc, y, 8 + Math.max(0, safety.length - 1) * 7.5, logo);
      drawSectionLabel(doc, "MRI Safety Screening", y);
      y += 8;
      safety.forEach(([question, answer]) => {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.5);
        doc.setTextColor(...PDF_INK.ink);
        doc.text(String(question), M, y, { maxWidth: 130 });
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...PDF_INK.muted);
        doc.text(String(answer), R, y, { align: "right" });
        y += 7.5;
      });
    }
    if (String(req.mri_other_concern || "").trim()) {
      y = ensureSpace(doc, y, textBlockHeight(doc, req.mri_other_concern), logo);
      y = drawTextBlock(doc, "Other MRI Safety Concern", req.mri_other_concern, y);
    }
  }

  // ===== Signature at the foot of the document =====
  y = ensureSignatureRoom(doc, y, logo);
  drawSignatureBlock(doc, {
    doctorName: req.doctor_name,
    detail: [req.doctor_specialization, req.doctor_hospital].filter(Boolean).join("  ·  "),
    note: "Requesting doctor",
  });

  drawRequestFooter(doc, req.request_id);
  return doc;
}