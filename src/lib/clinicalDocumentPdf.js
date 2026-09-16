import { jsPDF } from "jspdf";
import { base44 } from "@/api/base44Client";

const TEAL = [12, 98, 92];
const DARK = [23, 40, 45];
const GRAY = [105, 115, 120];

const fmt = (iso) => {
  const d = iso ? new Date(iso) : null;
  return d && !isNaN(d.getTime())
    ? d.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "-";
};

// Builds the official PDF of a completed clinical document — the full
// automatic header (patient identity, encounter context, AMedix Document ID,
// version, amendment status) plus the clinical content and the digital
// signature block — and uploads it so it is stored in the patient's Clinical
// Notes/Documents.
export async function generateClinicalDocumentPdfUrl(doc) {
  const pdf = new jsPDF();
  const W = 210, M = 15, R = W - M, boxW = R - M;

  const ensure = (yy, needed) => {
    if (yy + needed > 278) {
      pdf.addPage();
      return 20;
    }
    return yy;
  };

  // ===== Header band =====
  pdf.setFillColor(...TEAL);
  pdf.rect(0, 0, W, 27, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.text("AMedix", M, 12);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8.5);
  pdf.text("Connected Care. Better Health.", M, 18.5);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.text(String(doc.document_type_label || "CLINICAL DOCUMENT").toUpperCase(), R, 12, { align: "right" });
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8.5);
  pdf.text(`AMedix Document ID: ${doc.document_id || "-"}`, R, 18.5, { align: "right" });

  // ===== Patient =====
  let y = 36;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.setTextColor(...GRAY);
  pdf.text("PATIENT", M, y);
  pdf.setTextColor(...DARK);
  pdf.setFontSize(15);
  pdf.text(String(doc.patient_name || "-"), M, y + 7, { maxWidth: 95 });

  pdf.setFillColor(240, 249, 248);
  pdf.setDrawColor(...TEAL);
  pdf.setLineWidth(0.4);
  pdf.roundedRect(M, y + 10.5, 95, 12, 1.5, 1.5, "FD");
  pdf.setFontSize(7.5);
  pdf.setTextColor(...GRAY);
  pdf.text("CLINICAL IDENTIFICATION NUMBER (CIN)", M + 3.5, y + 14.5);
  pdf.setFontSize(12.5);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...TEAL);
  pdf.text(String(doc.patient_cin || "-"), M + 3.5, y + 20);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(...DARK);
  pdf.text(`Date of birth: ${doc.patient_dob || "-"}`, M + 55, y + 20);

  const detailRow = (label, value, ly) => {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7.5);
    pdf.setTextColor(...GRAY);
    pdf.text(label, 118, ly);
    pdf.setFontSize(9.5);
    pdf.setTextColor(...DARK);
    pdf.text(String(value || "-"), 118, ly + 4.5, { maxWidth: R - 118 });
  };
  detailRow("DOCTOR", doc.doctor_name, y + 2);
  detailRow("SPECIALTY", doc.doctor_specialty, y + 10);
  detailRow("HOSPITAL / CLINIC", doc.hospital, y + 18);
  detailRow("DEPARTMENT", doc.department, y + 26);
  detailRow("DATE & TIME", fmt(doc.created_datetime), y + 34);

  y += 48;
  pdf.setFillColor(248, 250, 250);
  pdf.setDrawColor(215, 224, 226);
  pdf.setLineWidth(0.3);
  pdf.roundedRect(M, y, boxW, 9, 1.5, 1.5, "FD");
  pdf.setFontSize(8);
  pdf.setTextColor(...GRAY);
  pdf.text(`Encounter ID: ${doc.encounter_id || "-"}    Version: ${doc.version || 1}    Amendment status: ${doc.amendment_status === "amendment" ? "Amendment" : "Original"}    Status: ${doc.status === "signed" ? "Signed" : "Draft"}`, M + 3, y + 5.5);

  // ===== Structured specialty fields =====
  if (doc.data && Object.keys(doc.data).length > 0) {
    y += 8;
    Object.values(doc.data).forEach((f) => {
      if (!f || f.value === null || f.value === undefined || String(f.value) === "") return;
      const label = String(f.label || "");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      y = ensure(y, 12);
      pdf.text(label, M, y);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9.5);
      const valLines = pdf.splitTextToSize(String(f.value), boxW - 6);
      y = ensure(y, 5 + valLines.length * 4.8);
      pdf.text(valLines, M + 4, y + 4.5);
      y += 4.5 + valLines.length * 4.8 + 1.5;
    });
  }

  // ===== Content =====
  y += 8;
  const lines = pdf.splitTextToSize(String(doc.content || ""), boxW - 2);
  pdf.setFontSize(10.5);
  pdf.setTextColor(...DARK);
  lines.forEach((l) => {
    y = ensure(y, 6);
    pdf.text(l, M, y);
    y += 5;
  });

  // ===== Digital signature block =====
  if (doc.status === "signed") {
    y = ensure(y, 26);
    y += 6;
    pdf.setFillColor(240, 249, 248);
    pdf.setDrawColor(...TEAL);
    pdf.setLineWidth(0.4);
    pdf.roundedRect(M, y, boxW, 20, 2, 2, "FD");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9.5);
    pdf.setTextColor(...TEAL);
    pdf.text(`Electronically signed by Dr. ${doc.signed_by_name || "-"}`, M + 4, y + 7);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(...GRAY);
    pdf.text(`Date & time signed: ${fmt(doc.signed_datetime)}`, M + 4, y + 12.5);
    pdf.text(`AMedix Document ID: ${doc.document_id}    Version: ${doc.version}    ${doc.amendment_status === "amendment" ? "Amendment" : "Original"}`, M + 4, y + 17);
  }

  pdf.setFontSize(7.5);
  pdf.setTextColor(...GRAY);
  pdf.text("Generated by AMedix — Connected Care. Better Health.", W / 2, 291, { align: "center" });

  const blob = pdf.output("blob");
  const file = new File([blob], `AMedix-${doc.document_id}-v${doc.version}.pdf`, { type: "application/pdf" });
  const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
  return file_url;
}