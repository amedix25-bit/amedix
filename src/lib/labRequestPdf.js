import { jsPDF } from "jspdf";
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
  drawTextBlock,
  drawSignatureBlock,
  drawRequestFooter,
} from "@/lib/requestPdfLayout";

export function makeRequestId() {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `LR-${ymd}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export function calcAge(dob) {
  if (!dob) return "";
  const d = new Date(dob);
  if (isNaN(d.getTime())) return "";
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age >= 0 ? `${age} years` : "";
}

export function generateLabRequestPdf(req) {
  const doc = new jsPDF();
  const logo = req.logo;

  let y = drawRequestHeader(doc, {
    logo,
    title: "Medical Request",
    subtitle: "Official Medical Document",
    framed: true,
  });
  y = drawPatientBlock(doc, req, y);
  y = drawDoctorBlock(doc, req, y);
  y = drawInvestigationsHeading(doc, y, req.priority);

  // One investigation per line — no numbering, no request numbers.
  const tests = Array.isArray(req.tests) ? req.tests : [];
  if (!tests.length) y = drawInvestigationLine(doc, y, "—", "");
  tests.forEach((test) => {
    y = ensureSpace(doc, y, 10, logo);
    y = drawInvestigationLine(doc, y, test.name, test.specimen);
  });

  y += 2;
  [
    ["Clinical Indication", req.indication],
    ["Relevant Clinical Information", req.clinical_info],
    ["Laboratory Instructions", req.instructions],
  ].forEach(([label, value]) => {
    if (!String(value || "").trim()) return;
    y = ensureSpace(doc, y, textBlockHeight(doc, value), logo);
    y = drawTextBlock(doc, label, value, y);
  });

  // ===== Signature at the foot of the document =====
  y = ensureSignatureRoom(doc, y, logo);
  const sig = req.signature || null;
  drawSignatureBlock(doc, {
    image: sig?.image_data_url,
    imageFormat: sig?.image_format,
    doctorName: req.doctor_name,
    detail: [req.doctor_specialization, req.doctor_hospital].filter(Boolean).join("  ·  "),
    note: sig
      ? [`Electronically signed ${sig.signed_at || ""}`.trim(), sig.reference ? `Signature ${sig.reference}` : ""]
          .filter(Boolean)
          .join("  ·  ")
      : req.signature_status === "legacy_unsigned"
        ? "Issued before professional signing was introduced — this request is not electronically signed."
        : "",
  });

  drawRequestFooter(doc, req.request_id);
  return doc;
}

// ===== Request barcode (the only added element) =====
// Unique scannable barcode linked to this specific request: encodes the Request ID,
// so the laboratory/technician can scan it to instantly identify the request in the system.
const loadBarcodeImage = (url) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });

export async function addRequestBarcode(doc, requestId) {
  if (!requestId) return;
  try {
    const img = await loadBarcodeImage(
      `https://api.qrserver.com/v1/create-qr-code/?size=200x200&qzone=2&data=${encodeURIComponent(requestId)}`
    );
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    canvas.getContext("2d").drawImage(img, 0, 0);

    // Bottom-right of the sheet, between the signature block and the footer.
    // The QR encodes ONLY the unique request reference — no patient data.
    const size = 13;
    doc.setPage(doc.getNumberOfPages());
    doc.addImage(canvas.toDataURL("image/png"), "PNG", 176, 251, size, size);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(5.6);
    doc.setTextColor(...PDF_INK.muted);
    doc.text("Scan to view this request", 190, 267, { align: "right" });
  } catch (err) {
    console.warn("Request barcode could not be added:", err);
  }
}