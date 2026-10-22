import { jsPDF } from "jspdf";
import { calcAge } from "@/lib/labRequestPdf";

const TEAL = [23, 50, 77]; // #17324D dark blue
const DARK = [23, 40, 45];
const GRAY = [105, 115, 120];
const LIGHT = [236, 245, 244];

const PRIORITY_COLORS = {
  Routine: [16, 122, 87],
  Urgent: [176, 102, 7],
  Emergency: [185, 28, 28],
};

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
  const W = 210, M = 15, R = W - M, RX = 118, boxW = R - M;
  const ensure = (yy, needed) => {
    if (yy + needed > 278) { doc.addPage(); return 20; }
    return yy;
  };
  let y;

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
  doc.text("IMAGING REQUEST", R, 12, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(`Request ID: ${req.request_id || "-"}`, R, 18.5, { align: "right" });
  doc.text(`Requested: ${req.date_requested || "-"}${req.request_time ? ` ${req.request_time}` : ""}`, R, 23, { align: "right" });

  // ===== Patient =====
  y = 36;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.text("PATIENT", M, y);
  doc.setTextColor(...DARK);
  doc.setFontSize(16);
  doc.text(String(req.patient_name || "-"), M, y + 7.5, { maxWidth: 95 });

  doc.setFillColor(240, 249, 248);
  doc.setDrawColor(...TEAL);
  doc.setLineWidth(0.4);
  doc.roundedRect(M, y + 11, 95, 12.5, 1.5, 1.5, "FD");
  doc.setFontSize(7.5);
  doc.setTextColor(...GRAY);
  doc.text("CLINICAL IDENTIFICATION NUMBER (CIN)", M + 3.5, y + 15.5);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...TEAL);
  doc.text(String(req.patient_cin || "-"), M + 3.5, y + 21.5);

  const age = calcAge(req.patient_dob);
  const dobLine = req.patient_dob ? (age ? `${req.patient_dob} (${age})` : req.patient_dob) : "-";
  const detailRow = (label, value, ly) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...GRAY);
    doc.text(label, RX, ly);
    doc.setFontSize(10.5);
    doc.setTextColor(...DARK);
    doc.text(String(value || "-"), RX, ly + 4.8, { maxWidth: R - RX });
  };
  detailRow("DATE OF BIRTH / AGE", dobLine, y + 2);
  detailRow("GENDER", req.patient_gender, y + 13);
  detailRow("BLOOD TYPE", req.patient_blood_type, y + 24);
  doc.setFont("helvetica", "normal");

  y += 30;
  doc.setDrawColor(215, 224, 226);
  doc.setLineWidth(0.3);
  doc.line(M, y, R, y);

  // ===== Requesting physician =====
  y += 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.text("REQUESTING DOCTOR", M, y);
  doc.setTextColor(...DARK);
  doc.setFontSize(12.5);
  doc.text(String(req.doctor_name || "-"), M, y + 6.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...GRAY);
  const specLine = [req.doctor_specialization, req.doctor_hospital].filter(Boolean).join(" — ");
  doc.text(specLine || "-", M, y + 12, { maxWidth: 95 });
  if (req.doctor_license) {
    doc.text(`License No.: ${req.doctor_license}`, M, y + 17);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...GRAY);
  doc.text("DATE & TIME OF REQUEST", RX, y + 2);
  doc.setFontSize(10.5);
  doc.setTextColor(...DARK);
  doc.text(`${req.date_requested || "-"}   ${req.request_time || ""}`, RX, y + 7, { maxWidth: R - RX });
  doc.setFont("helvetica", "normal");

  y += 26;
  doc.setDrawColor(215, 224, 226);
  doc.line(M, y, R, y);

  // ===== Examination / View + Priority =====
  y = ensure(y + 8, 70);
  y += 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...TEAL);
  doc.text("EXAMINATION / VIEW", M, y);

  const examText = [req.scan_type, req.examination || req.body_part].filter(Boolean).join(" — ");
  const prio = req.priority || "Routine";
  const pc = PRIORITY_COLORS[prio] || PRIORITY_COLORS.Routine;
  const badgeW = 48;
  y += 4;
  doc.setFillColor(...LIGHT);
  doc.roundedRect(M, y, boxW, 15, 2, 2, "F");
  doc.setFontSize(14);
  doc.setTextColor(...DARK);
  doc.text(String(examText || "-"), M + 4, y + 9.5, { maxWidth: boxW - badgeW - 12 });
  doc.setFillColor(...pc);
  doc.roundedRect(R - badgeW, y + 3.5, badgeW, 8, 1.5, 1.5, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.text(prio.toUpperCase(), R - badgeW / 2, y + 9, { align: "center" });
  y += 19;

  const wrap = (t, w) => doc.splitTextToSize(String(t || "-"), w);

  // ===== Clinical Indication =====
  const indLines = wrap(req.clinical_indication, boxW - 8);
  y = ensure(y, 18 + indLines.length * 5);
  const indH = 13 + indLines.length * 5;
  doc.setFillColor(248, 250, 250);
  doc.setDrawColor(215, 224, 226);
  doc.roundedRect(M, y, boxW, indH, 2, 2, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.text("CLINICAL INDICATION", M + 4, y + 6);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...DARK);
  indLines.forEach((l, i) => doc.text(l, M + 4, y + 11.5 + i * 5));
  y += indH + 4;

  // ===== Working Diagnosis / Clinical Question =====
  const dxLines = wrap(req.working_diagnosis, boxW - 8);
  y = ensure(y, 18 + dxLines.length * 5);
  const dxH = 13 + dxLines.length * 5;
  doc.setFillColor(...LIGHT);
  doc.setDrawColor(...TEAL);
  doc.roundedRect(M, y, boxW, dxH, 2, 2, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...TEAL);
  doc.text("WORKING DIAGNOSIS / CLINICAL QUESTION", M + 4, y + 6);
  doc.setFontSize(10.5);
  doc.setTextColor(...DARK);
  dxLines.forEach((l, i) => doc.text(l, M + 4, y + 11.5 + i * 5));
  y += dxH + 4;

  // ===== Contrast =====
  if (req.contrast && req.contrast !== "Not applicable") {
    y = ensure(y, 26);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(...DARK);
    doc.text("Contrast", M, y + 4);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...GRAY);
    doc.text(String(req.contrast), M + 30, y + 4);
    let cy = y + 4;
    if (req.contrast_allergy) {
      cy += 6;
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...DARK);
      doc.text("Contrast allergy", M, cy);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...GRAY);
      doc.text(String(req.contrast_allergy), M + 40, cy);
    }
    if (req.previous_contrast_reaction) {
      cy += 6;
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...DARK);
      doc.text("Previous contrast reaction", M, cy);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...GRAY);
      doc.text(String(req.previous_contrast_reaction), M + 60, cy);
    }
    y = cy + 8;
  }

  // ===== MRI Safety =====
  if (req.scan_type === "MRI") {
    const safety = [
      ["Metal or metallic implant in the body", req.mri_metal_implant],
      ["Pacemaker or implanted cardiac device", req.mri_pacemaker],
      ["Other implanted medical device", req.mri_other_device],
      ["Possible metallic foreign body, especially in the eye", req.mri_metallic_foreign_body],
    ].filter(([, v]) => v);
    const concernLines = req.mri_other_concern ? wrap(req.mri_other_concern, boxW - 8) : [];
    y = ensure(y, 14 + safety.length * 6 + concernLines.length * 5);
    doc.setFillColor(252, 248, 240);
    doc.setDrawColor(215, 224, 226);
    const mriH = 10 + safety.length * 6 + (concernLines.length ? concernLines.length * 5 + 8 : 0);
    doc.roundedRect(M, y, boxW, mriH, 2, 2, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    doc.text("MRI SAFETY SCREENING", M + 4, y + 5.5);
    let sy = y + 11;
    doc.setFontSize(9);
    safety.forEach(([q, a]) => {
      doc.setTextColor(...DARK);
      doc.text(`${q}:`, M + 4, sy);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...GRAY);
      doc.text(String(a), R - 4, sy, { align: "right" });
      doc.setFont("helvetica", "bold");
      sy += 6;
    });
    if (concernLines.length) {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...DARK);
      doc.text("Other MRI safety concern:", M + 4, sy);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...GRAY);
      concernLines.forEach((l, i) => doc.text(l, M + 4, sy + 5 + i * 5));
    }
    y += mriH + 4;
  }

  // ===== Signature =====
  y = ensure(Math.max(y + 8, 240), 20);
  doc.setDrawColor(110, 120, 124);
  doc.setLineWidth(0.4);
  doc.line(M, y, M + 75, y);
  doc.line(RX + 20, y, R, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.text("Requesting doctor — signature & stamp", M, y + 5);
  doc.text("Date", RX + 20, y + 5);

  doc.setFontSize(7.5);
  doc.text("Generated by A&M Healthcare — Connected Care. Better Health.", W / 2, 291, { align: "center" });

  return doc;
}