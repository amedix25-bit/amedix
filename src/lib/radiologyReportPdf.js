import { jsPDF } from "jspdf";
import {
  PDF_INK,
  PDF_PAGE,
  loadRequestLogo,
  drawRequestHeader,
  drawIdentityBlock,
  drawSectionLabel,
  drawField,
  drawDivider,
  drawWrappedBlock,
  drawSignatureInline,
  drawRequestFooter,
} from "@/lib/requestPdfLayout";

const TITLE = "IMAGING REPORT";

// Generates the finalized imaging report PDF the radiologist submits with the
// results, in the shared AMedix document layout. Only the sections the
// radiologist filled in are included — the radiologist controls what goes into
// the report.
export async function generateRadiologyReportPdf({
  patientName,
  patientCin,
  scanType,
  examination,
  requestRef,
  doctorName,
  radiologistName,
  date,
  sections = [],
}, logo) {
  const artwork = logo || (await loadRequestLogo());
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const { margin: M, right: R } = PDF_PAGE;

  let y = drawRequestHeader(doc, { logo: artwork, title: TITLE });

  y = drawIdentityBlock(doc, { name: patientName, cin: patientCin }, y);

  // ===== Study & report =====
  const top = y + 7;
  drawSectionLabel(doc, "Study & Report", top);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...PDF_INK.ink);
  doc.text(`${scanType || "—"} — ${examination || "—"}`, M, top + 9, { maxWidth: R - M });

  drawField(doc, "Ordering Physician", `Dr. ${doctorName || "—"}`, M, top + 18, { width: 84 });
  drawField(doc, "Reported By", radiologistName, M + 92, top + 18);
  drawField(doc, "Report Date", date, M, top + 33);
  drawField(doc, "Request Reference", requestRef, M + 92, top + 33);

  y = top + 44;
  drawDivider(doc, y);
  y += 9;

  // ===== The radiologist's own sections =====
  sections.forEach(([heading, text]) => {
    y = drawWrappedBlock(doc, heading, String(text), y, artwork, TITLE);
  });

  // ===== Signature =====
  drawSignatureInline(doc, {
    doctorName: radiologistName,
    detail: "Reporting Radiologist",
    note: `Report date ${date || "—"}`,
  }, y, artwork, TITLE);

  drawRequestFooter(doc, requestRef);
  return doc;
}