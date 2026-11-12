import { jsPDF } from "jspdf";
import { calcAge } from "@/lib/labRequestPdf";
import {
  PDF_INK,
  PDF_PAGE,
  FLOW_BOTTOM,
  loadRequestLogo,
  drawRequestHeader,
  startPage,
  drawIdentityBlock,
  drawSectionLabel,
  drawFieldGrid,
  drawDivider,
  drawWrappedBlock,
  drawSignatureInline,
  drawRequestFooter,
} from "@/lib/requestPdfLayout";

const TITLE = "REFERRAL LETTER";

export function makeReferralId() {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `RF-${ymd}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export function makeVerificationCode() {
  const part = () => Math.random().toString(36).slice(2, 6).toUpperCase();
  return `AMH-${part()}-${part()}`;
}

// Professional referral letter PDF — the same document family as the request
// forms: the AMedix letterhead, letter-spaced section labels, no boxes, and a
// single footer carrying the referral reference. Optional sections are skipped
// when empty.
export async function generateReferralLetterPdf(ref, logo) {
  const artwork = logo || (await loadRequestLogo());
  const doc = new jsPDF();
  const { margin: M, right: R } = PDF_PAGE;

  let y = drawRequestHeader(doc, { logo: artwork, title: TITLE });

  const need = (height) => {
    if (y + height > FLOW_BOTTOM) y = startPage(doc, artwork, TITLE) + 4;
  };

  // ===== Patient =====
  const age = calcAge(ref.patient_dob);
  y = drawIdentityBlock(doc, {
    name: ref.patient_name,
    cin: ref.patient_cin,
    fields: [
      ["Date of Birth", ref.patient_dob ? (age ? `${ref.patient_dob} (${age})` : ref.patient_dob) : ""],
      ["Sex", ref.patient_sex],
      ["Contact", ref.patient_contact],
    ],
  }, y);

  // ===== Referring doctor =====
  y += 7;
  drawSectionLabel(doc, "Referring Doctor", y);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...PDF_INK.ink);
  doc.text(String(ref.doctor_name || "").trim() || "—", M, y + 9);

  const urgencyCell = [ref.urgency ? String(ref.urgency) : "", { bold: true, color: PDF_INK.navy }];
  y = drawFieldGrid(doc, [
    ["Specialty", ref.doctor_specialization],
    ["Hospital / Clinic", ref.doctor_hospital],
    ["Referral Date", ref.referral_date],
    urgencyCell,
  ], y + 18);
  drawDivider(doc, y);
  y += 10;

  // ===== Referral information =====
  need(52);
  drawSectionLabel(doc, "Referral Information", y);
  y = drawFieldGrid(doc, [
    ["Receiving Doctor", ref.receiving_doctor],
    ["Receiving Specialty", ref.receiving_specialty],
    ["Receiving Hospital / Clinic", ref.receiving_hospital],
    ["Receiving Contact", ref.receiving_contact],
    ["Referring Doctor Contact", ref.doctor_contact],
    ["Verification Code", ref.verification_code],
  ], y + 7);
  y += 8;

  y = drawWrappedBlock(doc, "Reason for Referral", ref.reason_for_referral, y, artwork, TITLE);
  y = drawWrappedBlock(doc, "Primary / Working Diagnosis", ref.working_diagnosis, y, artwork, TITLE);

  // ===== Clinical information =====
  [
    ["Relevant Symptoms & Duration", ref.symptoms_duration],
    ["Past Medical History", ref.past_medical_history],
    ["Past Surgical History", ref.past_surgical_history],
    ["Current Medications", ref.current_medications],
    ["Allergies", ref.allergies],
    ["Physical Examination Findings", ref.physical_examination],
    ["Vital Signs", ref.vital_signs],
  ].forEach(([label, value]) => {
    y = drawWrappedBlock(doc, label, value, y, artwork, TITLE);
  });

  // ===== Investigations =====
  [
    ["Relevant Laboratory Results", ref.lab_results],
    ["Imaging Results", ref.imaging_results],
    ["Pathology / Biopsy Results", ref.pathology_results],
    ["Other Relevant Investigations", ref.other_investigations],
  ].forEach(([label, value]) => {
    y = drawWrappedBlock(doc, label, value, y, artwork, TITLE);
  });

  // ===== Treatment already provided =====
  [
    ["Treatment — Medications", ref.treatment_medications],
    ["Treatment — Procedures", ref.treatment_procedures],
    ["Previous Treatments", ref.previous_treatments],
    ["Response to Treatment", ref.treatment_response],
  ].forEach(([label, value]) => {
    y = drawWrappedBlock(doc, label, value, y, artwork, TITLE);
  });

  // ===== Specific request =====
  y = drawWrappedBlock(doc, "Evaluation / Investigation / Opinion / Management Requested", ref.specific_request, y, artwork, TITLE);

  // ===== Attachments =====
  const attachments = ref.attachments || [];
  if (attachments.length > 0) {
    need(14);
    drawSectionLabel(doc, "Attached Documents", y);
    y += 7;
    attachments.forEach((file, index) => {
      y = drawWrappedBlock(doc, null, `${index + 1}. ${file.title || file.file_name || "Document"}`, y, artwork, TITLE, { gap: 1.5, fontSize: 9.5 });
    });
    y += 3;
  }

  // ===== Electronic signature =====
  drawSignatureInline(doc, {
    doctorName: ref.doctor_name,
    detail: [ref.doctor_specialization, ref.doctor_hospital].filter(Boolean).join("  ·  "),
    note: `Electronically signed & approved ${new Date().toLocaleString("en-GB")}   ·   Referral ${ref.referral_number || "—"}`,
  }, y, artwork, TITLE);

  drawRequestFooter(
    doc,
    ref.referral_number,
    ref.verification_code ? `Verification code: ${ref.verification_code}` : null,
  );

  return doc;
}

// QR verification code — encodes ONLY the unique referral reference, so anyone
// receiving the letter can verify it against the system. Same mechanism as the
// lab request barcode.
const loadQrImage = (url) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });

export async function addReferralQr(doc, referralNumber) {
  if (!referralNumber) return;
  try {
    const img = await loadQrImage(
      `https://api.qrserver.com/v1/create-qr-code/?size=200x200&qzone=2&data=${encodeURIComponent(referralNumber)}`
    );
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    canvas.getContext("2d").drawImage(img, 0, 0);
    const size = 22;
    doc.setPage(1);
    doc.addImage(canvas.toDataURL("image/png"), "PNG", PDF_PAGE.right - size, 244, size, size);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.setTextColor(...PDF_INK.muted);
    doc.text("Scan to verify this referral", PDF_PAGE.right, 270, { align: "right" });
  } catch (err) {
    console.warn("Referral QR could not be added:", err);
  }
}