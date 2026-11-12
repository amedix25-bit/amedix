import { AMEDIX_LOGO_URL } from "@/lib/amedixBrand";

// Shared A4 geometry (millimetres) for every AMedix request form, so the
// laboratory and imaging requests are one and the same document.
export const PDF_PAGE = { width: 210, height: 297, margin: 20, right: 190 };

export const PDF_INK = {
  navy: [23, 50, 77],
  ink: [28, 42, 54],
  muted: [110, 120, 128],
  hair: [215, 223, 230],
};

// The narrative content may run to here; the signature is anchored below it.
export const CONTENT_BOTTOM = 240;
export const SIGNATURE_TOP = 264;

const LOGO_MAX_WIDTH = 240; // ~350 dpi at header size, keeps the PDF light
let logoPromise = null;

function imageFromDataUrl(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Logo could not be read."));
    img.src = src;
  });
}

function fileToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Logo could not be read."));
    reader.readAsDataURL(blob);
  });
}

async function buildLogo() {
  const res = await fetch(AMEDIX_LOGO_URL, { mode: "cors" });
  if (!res.ok) throw new Error(`Logo unavailable (${res.status})`);
  const img = await imageFromDataUrl(await fileToDataUrl(await res.blob()));
  const scale = Math.min(1, LOGO_MAX_WIDTH / img.naturalWidth);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);
  canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
  return { dataUrl: canvas.toDataURL("image/png"), ratio: canvas.width / canvas.height };
}

// The official AMedix mark, fetched once per session and reused so every form
// carries exactly the same artwork. Returns null if it cannot be loaded — the
// form is still produced rather than blocking the request.
export async function loadRequestLogo() {
  if (!logoPromise) logoPromise = buildLogo();
  try {
    return await logoPromise;
  } catch (e) {
    logoPromise = null;
    return null;
  }
}

export function drawRequestHeader(doc, { logo } = {}) {
  const { margin: M, right: R } = PDF_PAGE;

  let placed = false;
  if (logo?.dataUrl) {
    try {
      doc.addImage(logo.dataUrl, "PNG", M, 11, 15 * (logo.ratio || 1.13), 15);
      placed = true;
    } catch (e) {
      placed = false;
    }
  }
  if (!placed) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.setTextColor(...PDF_INK.navy);
    doc.text("AMedix", M, 21);
  }

  // One generic title — never "laboratory" or "imaging" on the form itself.
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setCharSpace(1.4);
  doc.setTextColor(...PDF_INK.navy);
  doc.text("MEDICAL REQUEST", R, 22, { align: "right" });
  doc.setCharSpace(0);

  doc.setDrawColor(...PDF_INK.hair);
  doc.setLineWidth(0.5);
  doc.line(M, 33, R, 33);
  return 42;
}

// A continuation page repeats the letterhead, so no page looks unsupported.
export function startPage(doc, logo) {
  doc.addPage();
  return drawRequestHeader(doc, { logo }) + 10;
}

export function ensureSpace(doc, y, needed, logo) {
  if (y + needed > CONTENT_BOTTOM) return startPage(doc, logo);
  return y;
}

// The signature is anchored at the foot of the page, so content that has run
// too low continues on a fresh page rather than crowding it.
export function ensureSignatureRoom(doc, y, logo) {
  // `y` sits one line-step below the last used baseline.
  return y - 9 > CONTENT_BOTTOM ? startPage(doc, logo) : y;
}

export function drawSectionLabel(doc, text, y, x = PDF_PAGE.margin) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setCharSpace(1.1);
  doc.setTextColor(...PDF_INK.muted);
  doc.text(String(text).toUpperCase(), x, y);
  doc.setCharSpace(0);
}

export function drawField(doc, label, value, x, y, { width = 76, bold = false, color = PDF_INK.ink } = {}) {
  drawSectionLabel(doc, label, y, x);
  doc.setFont("helvetica", bold ? "bold" : "normal");
  doc.setFontSize(11);
  doc.setTextColor(...color);
  doc.text(String(value || "").trim() || "—", x, y + 6, { maxWidth: width });
}

export function drawDivider(doc, y) {
  const { margin: M, right: R } = PDF_PAGE;
  doc.setDrawColor(...PDF_INK.hair);
  doc.setLineWidth(0.3);
  doc.line(M, y, R, y);
}

function calcAge(dob) {
  if (!dob) return "";
  const d = new Date(dob);
  if (isNaN(d.getTime())) return "";
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age >= 0 ? `${age} years` : "";
}

// ===== Patient information — identical on every request type =====
export function drawPatientBlock(doc, req, y) {
  const { margin: M } = PDF_PAGE;
  const col2 = M + 92;

  drawSectionLabel(doc, "Patient Information", y);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.setTextColor(...PDF_INK.ink);
  doc.text(String(req.patient_name || "").trim() || "—", M, y + 11);

  const age = calcAge(req.patient_dob);
  const dobLine = req.patient_dob ? (age ? `${req.patient_dob} (${age})` : req.patient_dob) : "—";
  drawField(doc, "Clinical Identification Number (CIN)", req.patient_cin, M, y + 20, { bold: true, color: PDF_INK.navy });
  drawField(doc, "Date of Birth", dobLine, col2, y + 20);
  drawField(doc, "Gender", req.patient_gender, M, y + 36);
  drawField(doc, "Blood Group", req.patient_blood_type, col2, y + 36);

  drawDivider(doc, y + 47);
  return y + 47;
}

// ===== Requesting doctor & hospital — no licence number on the form =====
export function drawDoctorBlock(doc, req, y) {
  const { margin: M } = PDF_PAGE;
  const col2 = M + 92;
  const top = y + 7;

  drawSectionLabel(doc, "Requesting Doctor", top);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...PDF_INK.ink);
  doc.text(String(req.doctor_name || "").trim() || "—", M, top + 9);

  const requestTime = req.request_time || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  drawField(doc, "Specialty", req.doctor_specialization, M, top + 18);
  drawField(doc, "Hospital", req.doctor_hospital, col2, top + 18);
  drawField(doc, "Request Date", req.date_requested, M, top + 33);
  drawField(doc, "Request Time", requestTime, col2, top + 33);

  drawDivider(doc, top + 44);
  return top + 44;
}

// ===== Requested investigations — generic heading, no numbering =====
export function drawInvestigationsHeading(doc, y, priority) {
  const { right: R } = PDF_PAGE;
  const top = y + 9;
  drawSectionLabel(doc, "Requested Investigations", top);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setCharSpace(0.8);
  doc.setTextColor(...PDF_INK.muted);
  doc.text(`PRIORITY: ${String(priority || "Routine").toUpperCase()}`, R, top, { align: "right" });
  doc.setCharSpace(0);
  return top + 11;
}

export function drawInvestigationLine(doc, y, name, note) {
  const { margin: M, right: R } = PDF_PAGE;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11.5);
  doc.setTextColor(...PDF_INK.ink);
  doc.text(String(name || "").trim() || "—", M, y, { maxWidth: 130 });
  if (note) {
    doc.setFontSize(8);
    doc.setTextColor(...PDF_INK.muted);
    doc.text(String(note), R, y, { align: "right" });
  }
  return y + 8.5;
}

// A titled paragraph — the clinical narrative sections of the form.
export function drawTextBlock(doc, label, value, y, { gap = 6 } = {}) {
  const text = String(value || "").trim();
  if (!text) return y;
  const { margin: M, right: R } = PDF_PAGE;
  drawSectionLabel(doc, label, y);
  const lines = doc.splitTextToSize(text, R - M);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...PDF_INK.ink);
  let yy = y + 6.5;
  lines.forEach((line) => {
    doc.text(line, M, yy);
    yy += 5.2;
  });
  return yy + gap;
}

export function textBlockHeight(doc, value) {
  const text = String(value || "").trim();
  if (!text) return 0;
  const lines = doc.splitTextToSize(text, PDF_PAGE.right - PDF_PAGE.margin).length;
  return 12.5 + Math.max(0, lines - 1) * 5.2;
}

// The doctor's applied signature, with the printed name underneath,
// anchored to the bottom of the document.
export function drawSignatureBlock(doc, { image, imageFormat, doctorName, detail, note }) {
  const { margin: M } = PDF_PAGE;
  const top = SIGNATURE_TOP;

  if (image) {
    try {
      doc.addImage(String(image), imageFormat || "PNG", M + 2, top - 19, 54, 15, undefined, "FAST");
    } catch (e) {
      // A request is never issued without its signature — stop rather than
      // print a form that only looks signed.
      throw new Error("The signature could not be placed on the request form.");
    }
  }

  doc.setDrawColor(150, 160, 168);
  doc.setLineWidth(0.4);
  doc.line(M, top, M + 78, top);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(...PDF_INK.ink);
  doc.text(String(doctorName || "").trim() || "—", M, top + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...PDF_INK.muted);
  let yy = top + 12.5;
  if (detail) {
    doc.text(String(detail), M, yy, { maxWidth: 118 });
    yy += 5;
  }
  if (note) {
    doc.setFontSize(7.5);
    doc.text(String(note), M, yy, { maxWidth: 118 });
  }
}

export function drawRequestFooter(doc, reference) {
  const { margin: M, right: R } = PDF_PAGE;
  doc.setDrawColor(...PDF_INK.hair);
  doc.setLineWidth(0.3);
  doc.line(M, 284, R, 284);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...PDF_INK.muted);
  doc.text("AMedix — Connected Care. Better Health.", M, 289);
  doc.text(`Reference: ${reference || "—"}`, R, 289, { align: "right" });
}