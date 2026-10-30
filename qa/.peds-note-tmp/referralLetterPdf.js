import { jsPDF } from "jspdf";
import { calcAge } from "./labRequestPdf.js";

const TEAL = [23, 50, 77]; // #17324D dark blue
const DARK = [23, 40, 45];
const GRAY = [105, 115, 120];

const URGENCY_COLORS = {
  Routine: [16, 122, 87],
  Urgent: [176, 102, 7],
  Emergency: [185, 28, 28],
};

export function makeReferralId() {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `RF-${ymd}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export function makeVerificationCode() {
  const part = () => Math.random().toString(36).slice(2, 6).toUpperCase();
  return `AMH-${part()}-${part()}`;
}

// Professional referral letter PDF — same visual language as the lab and
// imaging request forms. All optional sections are skipped when empty.
export function generateReferralLetterPdf(ref) {
  const doc = new jsPDF();
  const W = 210, M = 15, R = W - M, RX = 112;
  let y;

  const ensure = (h) => {
    if (y + h > 278) {
      doc.addPage();
      y = 20;
    }
  };

  // ===== Header band =====
  doc.setFillColor(...TEAL);
  doc.rect(0, 0, W, 27, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("AMedix", M, 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text("Connected Care. Better Health.", M, 18.5);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12.5);
  doc.text("REFERRAL LETTER", R, 12, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(`Referral No: ${ref.referral_number || "-"}`, R, 18.5, { align: "right" });
  doc.text(`Date: ${ref.referral_date || "-"}`, R, 23, { align: "right" });

  // Urgency chip
  const uColor = URGENCY_COLORS[ref.urgency] || URGENCY_COLORS.Routine;
  doc.setFillColor(...uColor);
  doc.roundedRect(M, 31, 42, 7, 1.5, 1.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text(String(ref.urgency || "Routine").toUpperCase(), M + 21, 35.7, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.text(`Verification Code: ${ref.verification_code || "-"}`, R, 35.7, { align: "right" });

  // ===== Referring doctor & patient =====
  y = 44;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.text("REFERRING DOCTOR", M, y);
  doc.text("PATIENT", RX, y);
  doc.setFontSize(12);
  doc.setTextColor(...DARK);
  doc.text(String(ref.doctor_name || "-"), M, y + 6.5, { maxWidth: RX - M - 8 });
  doc.text(String(ref.patient_name || "-"), RX, y + 6.5, { maxWidth: R - RX });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  const docLines = [
    [ref.doctor_specialization, ref.doctor_hospital].filter(Boolean).join(" — "),
    ref.doctor_contact ? `Contact: ${ref.doctor_contact}` : "",
    ref.doctor_license ? `Doctor ID / Reg. No: ${ref.doctor_license}` : "",
  ].filter(Boolean);
  docLines.forEach((l, i) => doc.text(l, M, y + 12.5 + i * 5, { maxWidth: RX - M - 8 }));

  const age = calcAge(ref.patient_dob);
  const patLines = [
    `CIN: ${ref.patient_cin || "-"}`,
    ref.patient_dob ? `DOB: ${ref.patient_dob}${age ? ` (${age})` : ""}` : "",
    [ref.patient_sex ? `Sex: ${ref.patient_sex}` : "", ref.patient_contact ? `Contact: ${ref.patient_contact}` : ""].filter(Boolean).join("   "),
  ].filter(Boolean);
  patLines.forEach((l, i) => doc.text(l, RX, y + 12.5 + i * 5, { maxWidth: R - RX }));

  y += 14 + Math.max(docLines.length, patLines.length) * 5 + 2;
  doc.setDrawColor(215, 224, 226);
  doc.setLineWidth(0.3);
  doc.line(M, y, R, y);

  // ===== Section builders =====
  const sectionHeader = (title) => {
    ensure(14);
    y += 7;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(...TEAL);
    doc.text(title, M, y);
    y += 2.5;
  };

  const labelValue = (label, value) => {
    if (!value || !String(value).trim()) return;
    const lines = doc.splitTextToSize(String(value), R - M - 2);
    ensure(12 + lines.length * 4.8);
    y += 6;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...GRAY);
    doc.text(label.toUpperCase(), M, y);
    y += 4.8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...DARK);
    lines.forEach((l) => {
      ensure(5.5);
      doc.text(l, M, y);
      y += 4.8;
    });
  };

  // ===== Referral information =====
  sectionHeader("REFERRAL INFORMATION");
  labelValue("RECEIVING DOCTOR / DEPARTMENT", [ref.receiving_doctor, ref.receiving_specialty].filter(Boolean).join(" — "));
  labelValue("RECEIVING HOSPITAL / CLINIC", ref.receiving_hospital);
  labelValue("RECEIVING DOCTOR CONTACT", ref.receiving_contact);
  labelValue("REASON FOR REFERRAL", ref.reason_for_referral);
  labelValue("PRIMARY / WORKING DIAGNOSIS", ref.working_diagnosis);

  // ===== Clinical information =====
  sectionHeader("CLINICAL INFORMATION");
  labelValue("RELEVANT SYMPTOMS & DURATION", ref.symptoms_duration);
  labelValue("PAST MEDICAL HISTORY", ref.past_medical_history);
  labelValue("PAST SURGICAL HISTORY", ref.past_surgical_history);
  labelValue("CURRENT MEDICATIONS", ref.current_medications);
  labelValue("ALLERGIES", ref.allergies);
  labelValue("PHYSICAL EXAMINATION FINDINGS", ref.physical_examination);
  labelValue("VITAL SIGNS", ref.vital_signs);

  // ===== Investigations =====
  sectionHeader("INVESTIGATIONS");
  labelValue("RELEVANT LABORATORY RESULTS", ref.lab_results);
  labelValue("IMAGING RESULTS", ref.imaging_results);
  labelValue("PATHOLOGY / BIOPSY RESULTS", ref.pathology_results);
  labelValue("OTHER RELEVANT INVESTIGATIONS", ref.other_investigations);

  // ===== Treatment already provided =====
  sectionHeader("TREATMENT ALREADY PROVIDED");
  labelValue("MEDICATIONS", ref.treatment_medications);
  labelValue("PROCEDURES", ref.treatment_procedures);
  labelValue("PREVIOUS TREATMENTS", ref.previous_treatments);
  labelValue("RESPONSE TO TREATMENT", ref.treatment_response);

  // ===== Specific request =====
  sectionHeader("SPECIFIC REQUEST TO RECEIVING DOCTOR");
  labelValue("EVALUATION / INVESTIGATION / OPINION / MANAGEMENT REQUESTED", ref.specific_request);

  // ===== Attachments =====
  if ((ref.attachments || []).length > 0) {
    sectionHeader("ATTACHED DOCUMENTS");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...DARK);
    (ref.attachments || []).forEach((a, i) => {
      ensure(7);
      y += 5.5;
      doc.text(`${i + 1}. ${a.title || a.file_name || "Document"}`, M, y, { maxWidth: R - M });
    });
  }

  // ===== Electronic signature =====
  ensure(40);
  y = Math.max(y + 16, 240);
  doc.setDrawColor(110, 120, 124);
  doc.setLineWidth(0.4);
  doc.line(M, y, M + 85, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.text(`Dr. ${String(ref.doctor_name || "").replace(/^Dr\.?\s*/i, "")} — ${ref.doctor_specialization || ""}`, M, y + 5, { maxWidth: 85 });
  doc.text("Electronically signed & approved", M, y + 9.5);
  doc.text(`Date/Time: ${new Date().toLocaleString()}`, RX, y + 5, { maxWidth: R - RX });
  doc.text(`Referral No: ${ref.referral_number}`, RX, y + 9.5, { maxWidth: R - RX });
  doc.text(`Verification Code: ${ref.verification_code || "-"}`, RX, y + 14, { maxWidth: R - RX });

  doc.setFontSize(7.5);
  doc.setTextColor(...GRAY);
  doc.text("Generated by A&M Healthcare — Connected Care. Better Health.", W / 2, 291, { align: "center" });

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
    const size = 24;
    doc.setPage(1);
    doc.addImage(canvas.toDataURL("image/png"), "PNG", 195 - size, 260, size, size);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.setTextColor(...GRAY);
    doc.text("Scan QR Code to Verify", 195, 288, { align: "right" });
    doc.text("Referral Letter", 195, 291.5, { align: "right" });
  } catch (err) {
    console.warn("Referral QR could not be added:", err);
  }
}