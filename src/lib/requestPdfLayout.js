import { AMEDIX_LOGO_URL } from "@/lib/amedixBrand";

// Shared A4 geometry (millimetres) for every AMedix document. Request forms,
// clinical notes, clinical documents, referral letters, imaging reports and
// pharmacy receipts are one and the same document family: the AMedix mark top
// left, the document title top right, a hairline, airy letter-spaced labels and
// a single footer carrying the document reference.
export const PDF_PAGE = { width: 210, height: 297, margin: 20, right: 190 };

export const PDF_INK = {
  navy: [23, 50, 77],
  ink: [28, 42, 54],
  muted: [110, 120, 128],
  hair: [215, 223, 230],
};

// Where the narrative content of a request may end — the signature is anchored below it.
export const CONTENT_BOTTOM = 240;
export const SIGNATURE_TOP = 264;
// Free-flowing documents (notes, letters, reports) use the room above the footer.
export const FLOW_BOTTOM = 266;

const DEFAULT_TITLE = "MEDICAL REQUEST";
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

// The official AMedix mark, fetched once per session and reused so every
// document carries exactly the same artwork. Returns null if it cannot be
// loaded — the document is still produced rather than blocking the request.
export async function loadRequestLogo() {
  if (!logoPromise) logoPromise = buildLogo();
  try {
    return await logoPromise;
  } catch (e) {
    logoPromise = null;
    return null;
  }
}

export function drawRequestHeader(doc, { logo, title = DEFAULT_TITLE } = {}) {
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

  // One title per document type — never "laboratory" or "imaging" on a request.
  const text = String(title || DEFAULT_TITLE).toUpperCase();
  doc.setFont("helvetica", "bold");
  let size = 14;
  doc.setFontSize(size);
  while (size > 8.5 && doc.getTextWidth(text) + text.length * 1.4 > 118) {
    size -= 0.5;
    doc.setFontSize(size);
  }
  doc.setCharSpace(1.4);
  doc.setTextColor(...PDF_INK.navy);
  doc.text(text, R, 22, { align: "right" });
  doc.setCharSpace(0);

  doc.setDrawColor(...PDF_INK.hair);
  doc.setLineWidth(0.5);
  doc.line(M, 33, R, 33);
  return 42;
}

// A continuation page repeats the letterhead, so no page looks unsupported.
export function startPage(doc, logo, title) {
  doc.addPage();
  return drawRequestHeader(doc, { logo, title }) + 10;
}

export function ensureSpace(doc, y, needed, logo, title) {
  if (y + needed > CONTENT_BOTTOM) return startPage(doc, logo, title);
  return y;
}

// The signature is anchored at the foot of the page, so content that has run
// too low continues on a fresh page rather than crowding it.
export function ensureSignatureRoom(doc, y, logo, title) {
  // `y` sits one line-step below the last used baseline.
  return y - 9 > CONTENT_BOTTOM ? startPage(doc, logo, title) : y;
}

export function drawSectionLabel(doc, text, y, x = PDF_PAGE.margin, align = "left") {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setCharSpace(1.1);
  doc.setTextColor(...PDF_INK.muted);
  doc.text(String(text).toUpperCase(), x, y, { align });
  doc.setCharSpace(0);
}

export function drawSectionHead(doc, label, y, right) {
  drawSectionLabel(doc, label, y);
  if (right) drawSectionLabel(doc, right, y, PDF_PAGE.right, "right");
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

// Two columns of label/value fields, one row at a time.
export function drawFieldGrid(doc, cells, y) {
  const { margin: M } = PDF_PAGE;
  const col2 = M + 92;
  let rowY = y;
  for (let i = 0; i < cells.length; i += 2) {
    const left = cells[i];
    const right = cells[i + 1];
    if (left) drawField(doc, left[0], left[1], M, rowY, left[2] || {});
    if (right) drawField(doc, right[0], right[1], col2, rowY, right[2] || {});
    rowY += 16;
  }
  return rowY - 4;
}

// The patient block of every non-request document: name, CIN, then whatever
// identity details that document actually holds.
export function drawIdentityBlock(doc, { name, cin, fields = [] } = {}, y) {
  const { margin: M } = PDF_PAGE;
  drawSectionLabel(doc, "Patient Information", y);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.setTextColor(...PDF_INK.ink);
  doc.text(String(name || "").trim() || "—", M, y + 11);

  const cells = [
    ["Clinical Identification Number (CIN)", cin, { bold: true, color: PDF_INK.navy }],
    ...fields.filter(([, value]) => String(value || "").trim()),
  ];
  const end = drawFieldGrid(doc, cells, y + 20);
  drawDivider(doc, end);
  return end;
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
  const top = y + 9;
  drawSectionHead(doc, "Requested Investigations", top, `Priority: ${priority || "Routine"}`);
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

// A titled paragraph — the clinical narrative sections of a form.
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

// A titled paragraph that flows across pages — used by every free-flowing
// document (notes, letters, reports, receipts).
export function drawWrappedBlock(doc, label, value, y, logo, title, {
  gap = 5,
  fontSize = 10,
  bottom = FLOW_BOTTOM,
  width = PDF_PAGE.right - PDF_PAGE.margin,
} = {}) {
  const text = String(value || "").trim();
  if (!text) return y;
  const { margin: M } = PDF_PAGE;

  if (label && y > bottom - 16) y = startPage(doc, logo, title) + 4;
  if (label) {
    drawSectionLabel(doc, label, y);
    y += 6.5;
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(fontSize);
  doc.setTextColor(...PDF_INK.ink);
  doc.splitTextToSize(text, width).forEach((line) => {
    if (y > bottom) {
      y = startPage(doc, logo, title) + 4;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(fontSize);
      doc.setTextColor(...PDF_INK.ink);
    }
    doc.text(line, M, y);
    y += 5.2;
  });
  return y + gap;
}

function signatureAt(doc, { image, imageFormat, doctorName, detail, note }, top) {
  const { margin: M } = PDF_PAGE;

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
    doc.text(String(detail), M, yy, { maxWidth: 128 });
    yy += 5;
  }
  if (note) {
    doc.setFontSize(7.5);
    doc.text(String(note), M, yy, { maxWidth: 128 });
  }
}

// The signature anchored at the foot of a request form, with the printed name
// underneath. Request forms never move it.
export function drawSignatureBlock(doc, opts) {
  signatureAt(doc, opts || {}, SIGNATURE_TOP);
}

// The same signature element at the end of a flowing document.
export function drawSignatureInline(doc, opts, y, logo, title) {
  let top = y + 10;
  if (top + 24 > FLOW_BOTTOM) {
    y = startPage(doc, logo, title) + 2;
    top = y + 10;
  }
  signatureAt(doc, opts || {}, top);
  return top + 26;
}

export function drawRequestFooter(doc, reference, note) {
  const { margin: M, right: R } = PDF_PAGE;
  const total = doc.getNumberOfPages();
  const current = doc.getCurrentPageInfo().pageNumber;

  for (let page = 1; page <= total; page += 1) {
    doc.setPage(page);

    if (note) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(...PDF_INK.muted);
      const noteLines = doc.splitTextToSize(String(note), R - M);
      let ny = 281 - (noteLines.length - 1) * 3.6;
      noteLines.forEach((line) => {
        doc.text(line, M, ny);
        ny += 3.6;
      });
    }

    doc.setDrawColor(...PDF_INK.hair);
    doc.setLineWidth(0.3);
    doc.line(M, 284, R, 284);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...PDF_INK.muted);
    doc.text("AMedix — Connected Care. Better Health.", M, 289);
    doc.text(`Reference: ${reference || "—"}`, R, 289, { align: "right" });
    if (total > 1) doc.text(`Page ${page} of ${total}`, (M + R) / 2, 289, { align: "center" });
  }

  doc.setPage(current);
}