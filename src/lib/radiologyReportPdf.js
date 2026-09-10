import { jsPDF } from "jspdf";

// Generates the finalized imaging report PDF the radiologist submits with the
// results. Only the sections the radiologist filled in are included — the
// radiologist controls what goes into the report.
export function generateRadiologyReportPdf({
  patientName,
  patientCin,
  scanType,
  examination,
  requestRef,
  doctorName,
  radiologistName,
  date,
  sections = [],
}) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let y = 20;

  const write = (text, { size = 10, style = "normal", gap = 5 } = {}) => {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    const lineHeight = size * 0.42;
    const lines = doc.splitTextToSize(String(text), contentWidth);
    if (y + lines.length * lineHeight > pageHeight - 18) {
      doc.addPage();
      y = 20;
    }
    doc.text(lines, margin, y);
    y += lines.length * lineHeight + gap;
  };

  const rule = () => {
    if (y + 8 > pageHeight - 18) {
      doc.addPage();
      y = 20;
    }
    doc.setDrawColor(200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;
  };

  doc.setFillColor(13, 110, 100);
  doc.rect(0, 0, pageWidth, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Imaging Report", margin, 18);
  y = 40;
  doc.setTextColor(30, 30, 30);

  write(`Patient: ${patientName || "—"}`, { style: "bold" });
  write(`CIN: ${patientCin || "—"}`);
  write(`Examination: ${scanType || "—"} — ${examination || "—"}`);
  write(`Request Reference: ${requestRef || "—"}`);
  write(`Ordering Physician: Dr. ${doctorName || "—"}`);
  write(`Reported by (Radiologist): ${radiologistName || "—"}`);
  write(`Report Date: ${date || "—"}`);
  rule();

  sections.forEach(([heading, text]) => {
    write(heading, { size: 11, style: "bold", gap: 3 });
    write(String(text).trim(), { gap: 8 });
  });

  return doc;
}