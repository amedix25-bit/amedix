import { jsPDF } from "jspdf";

const TEAL = [12, 98, 92];
const DARK = [23, 40, 45];
const GRAY = [105, 115, 120];
const LIGHT = [236, 245, 244];

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
  const W = 210, M = 15, R = W - M, RX = 118;
  let y;

  const ensure = (h) => {
    if (y + h > 280) {
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
  doc.text("A&M Healthcare", M, 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text("Connected Care. Better Health.", M, 18.5);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12.5);
  doc.text("LABORATORY REQUEST FORM", R, 12, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(`Request ID: ${req.request_id || "-"}`, R, 18.5, { align: "right" });
  doc.text(`Issued: ${new Date().toLocaleString()}`, R, 23, { align: "right" });

  // ===== Patient =====
  y = 36;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.text("PATIENT", M, y);
  doc.setTextColor(...DARK);
  doc.setFontSize(16);
  doc.text(String(req.patient_name || "-"), M, y + 7.5, { maxWidth: 95 });

  // Prominent CIN box
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

  // Patient details (right column)
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
  doc.text("REQUESTING PHYSICIAN", M, y);
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
  doc.text("DESTINATION LABORATORY", RX, y + 2);
  doc.setFontSize(10.5);
  doc.setTextColor(...DARK);
  doc.text(String(req.lab_name || "-"), RX, y + 7, { maxWidth: R - RX });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...GRAY);
  doc.text("DATE & TIME REQUESTED", RX, y + 14);
  doc.setFontSize(10.5);
  doc.setTextColor(...DARK);
  doc.text(`${req.date_requested || "-"}   ${new Date().toLocaleTimeString()}`, RX, y + 19, { maxWidth: R - RX });
  doc.setFont("helvetica", "normal");

  y += 26;
  doc.setDrawColor(215, 224, 226);
  doc.line(M, y, R, y);

  // ===== Requested investigations =====
  const grouped = new Map();
  (req.tests || []).forEach((t) => {
    const key = t.category || "Other";
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(t.name);
  });

  y += 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...TEAL);
  doc.text("REQUESTED INVESTIGATIONS", M, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  doc.text(`${(req.tests || []).length} test(s)`, R, y, { align: "right" });
  y += 4;

  let n = 1;
  grouped.forEach((names, category) => {
    ensure(16);
    y += 6;
    doc.setFillColor(...LIGHT);
    doc.rect(M, y - 4.2, R - M, 6.8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...DARK);
    doc.text(category.toUpperCase(), M + 2.5, y);
    y += 7;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...DARK);
    names.forEach((name) => {
      ensure(9);
      doc.text(`${n}.`, M + 2.5, y);
      doc.text(String(name), M + 9, y, { maxWidth: R - M - 12 });
      doc.setDrawColor(236, 240, 241);
      doc.line(M, y + 2, R, y + 2);
      y += 7;
      n += 1;
    });
    y += 1;
  });

  // ===== Clinical sections =====
  const section = (label, value) => {
    if (!value || !String(value).trim()) return;
    const lines = doc.splitTextToSize(String(value), R - M - 2);
    ensure(16 + lines.length * 5.2);
    y += 7;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    doc.text(label.toUpperCase(), M, y);
    y += 5.5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...DARK);
    lines.forEach((l) => {
      doc.text(l, M, y);
      y += 5.2;
    });
  };
  y += 3;
  section("CLINICAL INDICATION / REASON FOR TESTING", req.indication);
  section("RELEVANT CLINICAL INFORMATION", req.clinical_info);
  section("LABORATORY INSTRUCTIONS", req.instructions);

  // ===== Signature =====
  ensure(34);
  y = Math.max(y + 14, 238);
  doc.setDrawColor(110, 120, 124);
  doc.setLineWidth(0.4);
  doc.line(M, y, M + 75, y);
  doc.line(RX + 20, y, R, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.text("Requesting physician — signature & stamp", M, y + 5);
  doc.text("Date", RX + 20, y + 5);

  doc.setFontSize(7.5);
  doc.text("Generated by A&M Healthcare — Connected Care. Better Health.", W / 2, 291, { align: "center" });

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

    // Bottom-right corner of the form — content and design otherwise untouched.
    // The QR encodes ONLY the unique request reference (LR-...) — no patient data.
    const size = 24;
    doc.setPage(1);
    doc.addImage(canvas.toDataURL("image/png"), "PNG", 195 - size, 260, size, size);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.setTextColor(...GRAY);
    doc.text("Scan QR Code to View", 195, 288, { align: "right" });
    doc.text("Laboratory Request", 195, 291.5, { align: "right" });
  } catch (err) {
    console.warn("Request barcode could not be added:", err);
  }
}