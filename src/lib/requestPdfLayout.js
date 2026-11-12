import { jsPDF } from "jspdf";
import { AMEDIX_LOGO_URL } from "@/lib/amedixBrand";

// Shared A4 geometry (millimetres) for every AMedix document.
export const PDF_PAGE = { width: 210, height: 297, margin: 20, right: 190 };

export const PDF_INK = {
  navy: [25, 62, 93],
  ink: [22, 22, 22],
  muted: [96, 116, 147],
  hair: [211, 220, 229],
  rule: [185, 205, 224],
  badge: [234, 243, 248],
};

// ===== The request form template =====
// A bordered A4 sheet: a pale blue frame, the AMEDIX lockup on the left, the
// document title on the right, then patient, requesting doctor, investigations
// and the doctor's signature, with the tagline centred at the foot.
const FRAME = { x: 12, y: 12, w: 186, h: 273, r: 2.6 };
const M = 18; // content left edge, inside the frame
const R = 192; // content right edge, inside the frame
const COL2 = 105; // second column of the two-column sections

const HEADER_TOP = 15;
const RULE_Y = 31;
const CONTENT_START = 38.5;
const SIGNATURE_HEADING = 214;
const SIGNATURE_RULE = 240;
const FOOTER_TAGLINE = 274.5;
const FOOTER_REFERENCE = 279.5;

// Content of a request may not run into the signature band.
export const CONTENT_BOTTOM = 205;
export const SIGNATURE_TOP = SIGNATURE_RULE;
// Free-flowing documents (notes, letters, reports) use the room above the footer.
export const FLOW_BOTTOM = 266;

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

function drawFrame(doc) {
  doc.setDrawColor(...PDF_INK.hair);
  doc.setLineWidth(0.45);
  doc.roundedRect(FRAME.x, FRAME.y, FRAME.w, FRAME.h, FRAME.r, FRAME.r, "S");
}

// The mark sits behind the text, barely visible — a watermark, never a
// competing element. Drawn first so every section prints over it.
function drawWatermark(doc, logo) {
  if (!logo?.dataUrl) return;
  try {
    const GState = doc.GState || jsPDF.GState;
    if (!GState) return;
    const width = 122;
    const height = width / (logo.ratio || 1.13);
    doc.setGState(new GState({ opacity: 0.045 }));
    doc.addImage(
      logo.dataUrl,
      "PNG",
      (PDF_PAGE.width - width) / 2,
      (PDF_PAGE.height - height) / 2 - 6,
      width,
      height,
      undefined,
      "FAST"
    );
    doc.setGState(new GState({ opacity: 1 }));
  } catch (e) {
    // The watermark is decorative — it never blocks the document.
  }
}

// ===== Header =====
export function drawRequestHeader(doc, {
  logo,
  title = "MEDICAL REQUEST",
  subtitle = "Official Medical Document",
  framed = false,
} = {}) {
  if (!framed) {
    // Free-flowing documents keep their existing letterhead.
    let placed = false;
    if (logo?.dataUrl) {
      try {
        doc.addImage(logo.dataUrl, "PNG", PDF_PAGE.margin, 11, 15 * (logo.ratio || 1.13), 15);
        placed = true;
      } catch (e) {
        placed = false;
      }
    }
    if (!placed) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(15);
      doc.setTextColor(...PDF_INK.navy);
      doc.text("AMedix", PDF_PAGE.margin, 21);
    }
    const text = String(title || "MEDICAL REQUEST").toUpperCase();
    doc.setFont("helvetica", "bold");
    let size = 14;
    doc.setFontSize(size);
    while (size > 8.5 && doc.getTextWidth(text) + text.length * 1.4 > 118) {
      size -= 0.5;
      doc.setFontSize(size);
    }
    doc.setCharSpace(1.4);
    doc.setTextColor(...PDF_INK.navy);
    doc.text(text, PDF_PAGE.right, 22, { align: "right" });
    doc.setCharSpace(0);
    doc.setDrawColor(...PDF_INK.hair);
    doc.setLineWidth(0.5);
    doc.line(PDF_PAGE.margin, 33, PDF_PAGE.right, 33);
    return 42;
  }

  doc.__amedixFramed = true;
  drawFrame(doc);
  drawWatermark(doc, logo);

  // Mark tile
  doc.setFillColor(...PDF_INK.badge);
  doc.roundedRect(M, HEADER_TOP, 11, 11, 1.9, 1.9, "F");
  if (logo?.dataUrl) {
    try {
      const w = 7.4;
      doc.addImage(logo.dataUrl, "PNG", M + (11 - w) / 2, HEADER_TOP + 1.9, w, w / (logo.ratio || 1.13), undefined, "FAST");
    } catch (e) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(...PDF_INK.navy);
      doc.text("A", M + 5.5, HEADER_TOP + 7.4, { align: "center" });
    }
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...PDF_INK.navy);
    doc.text("A", M + 5.5, HEADER_TOP + 7.4, { align: "center" });
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.4);
  doc.setTextColor(...PDF_INK.navy);
  doc.text("AMEDIX", M + 14.5, HEADER_TOP + 5.2);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(...PDF_INK.muted);
  doc.text("Connected Healthcare", M + 14.5, HEADER_TOP + 9.2);

  // Document title, right aligned
  const heading = String(title || "MEDICAL REQUEST").toUpperCase();
  doc.setFont("helvetica", "bold");
  let size = 10.6;
  doc.setFontSize(size);
  while (size > 7.5 && doc.getTextWidth(heading) + heading.length * 1.05 > 88) {
    size -= 0.4;
    doc.setFontSize(size);
  }
  doc.setCharSpace(1.05);
  doc.setTextColor(...PDF_INK.navy);
  doc.text(heading, R, HEADER_TOP + 4.8, { align: "right" });
  doc.setCharSpace(0);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(...PDF_INK.muted);
  doc.text(String(subtitle || ""), R, HEADER_TOP + 9, { align: "right" });

  doc.setDrawColor(...PDF_INK.rule);
  doc.setLineWidth(0.4);
  doc.line(M, RULE_Y, R, RULE_Y);
  return CONTENT_START;
}

// A continuation page repeats the letterhead, so no page looks unsupported.
export function startPage(doc, logo, title) {
  doc.addPage();
  invIndex = 0;
  return drawRequestHeader(doc, { logo, title, framed: doc.__amedixFramed === true }) + 10;
}

export function ensureSpace(doc, y, needed, logo, title) {
  if (y + needed > CONTENT_BOTTOM) return startPage(doc, logo, title);
  return y;
}

// The signature is anchored at the foot of the page, so content that has run
// too low continues on a fresh page rather than crowding it.
export function ensureSignatureRoom(doc, y, logo, title) {
  return y - 9 > CONTENT_BOTTOM ? startPage(doc, logo, title) : y;
}

// ===== Labels, dividers and fields =====
export function drawSectionLabel(doc, text, y, x = M, align = "left") {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.6);
  doc.setCharSpace(1.1);
  doc.setTextColor(...PDF_INK.navy);
  doc.text(String(text).toUpperCase(), x, y, { align });
  doc.setCharSpace(0);
}

export function drawSectionHead(doc, label, y, right) {
  drawSectionLabel(doc, label, y);
  if (right) drawSectionLabel(doc, right, y, R, "right");
}

export function drawDivider(doc, y) {
  doc.setDrawColor(...PDF_INK.rule);
  doc.setLineWidth(0.35);
  doc.line(M, y, R, y);
}

// A muted label with its bold value underneath — the template's field style.
function drawTemplateField(doc, label, value, x, y, { width = 74, size = 10.2 } = {}) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);
  doc.setTextColor(...PDF_INK.muted);
  doc.text(String(label || ""), x, y);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(size);
  doc.setTextColor(...PDF_INK.ink);
  doc.text(String(value || "").trim() || "—", x, y + 5.4, { maxWidth: width });
}

export function drawField(doc, label, value, x, y, { width = 76, bold = false, color = PDF_INK.ink } = {}) {
  drawSectionLabel(doc, label, y, x);
  doc.setFont("helvetica", bold ? "bold" : "normal");
  doc.setFontSize(11);
  doc.setTextColor(...color);
  doc.text(String(value || "").trim() || "—", x, y + 6, { maxWidth: width });
}

// Two columns of label/value fields, one row at a time.
export function drawFieldGrid(doc, cells, y) {
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

// The patient block of every non-request document.
export function drawIdentityBlock(doc, { name, cin, fields = [] } = {}, y) {
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

function formatRequestedAt(req) {
  const raw = req.date_requested;
  const date = raw ? new Date(raw) : new Date();
  const valid = !isNaN(date.getTime()) ? date : new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const day = `${pad(valid.getDate())}/${pad(valid.getMonth() + 1)}/${valid.getFullYear()}`;
  const time = req.request_time || valid.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return `${day} · ${time}`;
}

// ===== Patient information =====
export function drawPatientBlock(doc, req, y) {
  drawSectionLabel(doc, "Patient Information", y);

  let rowY = y + 9;
  drawTemplateField(doc, "Patient name", req.patient_name, M, rowY, { width: 78 });
  drawTemplateField(doc, "CIN", req.patient_cin, COL2, rowY, { width: 80 });
  rowY += 13;

  const dobLine = req.patient_dob
    ? [req.patient_dob, calcAge(req.patient_dob)].filter(Boolean).join("  ")
    : "";
  drawTemplateField(doc, "Date of birth", dobLine, M, rowY, { width: 78 });
  drawTemplateField(doc, "Gender", req.patient_gender, COL2, rowY, { width: 80 });
  rowY += 13;

  drawTemplateField(doc, "Blood group", req.patient_blood_type, M, rowY, { width: 78 });
  rowY += 13;

  drawDivider(doc, rowY - 4);
  return rowY - 4;
}

// ===== Requesting doctor & hospital =====
export function drawDoctorBlock(doc, req, y) {
  const top = y + 8;
  drawSectionLabel(doc, "Requesting Doctor & Hospital", top);

  let rowY = top + 9;
  drawTemplateField(doc, "Requesting doctor", req.doctor_name, M, rowY, { width: 78 });
  drawTemplateField(doc, "Specialty", req.doctor_specialization, COL2, rowY, { width: 80 });
  rowY += 13;

  drawTemplateField(doc, "Hospital", req.doctor_hospital, M, rowY, { width: 78 });
  drawTemplateField(doc, "Date and time", formatRequestedAt(req), COL2, rowY, { width: 80 });
  rowY += 13;

  drawDivider(doc, rowY - 4);
  return rowY - 4;
}

// ===== Requested investigations =====
let invIndex = 0;

export function drawInvestigationsHeading(doc, y, priority) {
  const top = y + 9;
  invIndex = 0;
  drawSectionHead(doc, "Requested Investigations", top, priority ? `Priority: ${priority}` : "");
  return top + 9;
}

export function drawInvestigationLine(doc, y, name, note) {
  if (invIndex > 0) {
    doc.setDrawColor(232, 238, 244);
    doc.setLineWidth(0.25);
    doc.line(M, y - 5.6, R, y - 5.6);
  }
  invIndex += 1;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.8);
  doc.setTextColor(...PDF_INK.ink);
  doc.text(String(name || "").trim() || "—", M, y, { maxWidth: 128 });
  if (note) {
    doc.setFontSize(7);
    doc.setTextColor(...PDF_INK.muted);
    doc.text(String(note), R, y, { align: "right" });
  }
  return y + 9;
}

// A long panel flows into up to three columns on the SAME sheet, so a request
// never spills onto a second page. Rows fill the first column, then the next.
export function drawInvestigationColumns(doc, tests, y, { bottom = CONTENT_BOTTOM } = {}) {
  const items = (Array.isArray(tests) ? tests : []).filter((t) => String(t?.name || "").trim());
  const rows = items.length ? items : [{ name: "—" }];

  const avail = bottom - y;
  const maxRows = Math.max(1, Math.floor(avail / 9));
  const cols = rows.length <= maxRows ? 1 : rows.length <= maxRows * 2 ? 2 : 3;
  const perCol = Math.ceil(rows.length / cols);
  const lineH = Math.min(9, avail / perCol);
  const gap = 9;
  const colW = (R - M - gap * (cols - 1)) / cols;

  rows.forEach((test, i) => {
    const col = Math.min(cols - 1, Math.floor(i / perCol));
    const row = i % perCol;
    const x = M + col * (colW + gap);
    const top = y + row * lineH;
    const baseline = top + lineH * 0.62;

    if (row > 0) {
      doc.setDrawColor(232, 238, 244);
      doc.setLineWidth(0.25);
      doc.line(x, top - 0.4, x + colW, top - 0.4);
    }

    const note = String(test.specimen || "").trim();
    const reserve = note && cols === 1 ? 34 : 0;
    const maxW = Math.max(12, colW - reserve - 2);
    const name = String(test.name || "").trim();

    // Shrink, then trim, so a name always stays inside its column.
    doc.setFont("helvetica", "normal");
    let size = Math.max(6.2, Math.min(9.2, (lineH / 0.3528) * 0.55));
    doc.setFontSize(size);
    while (size > 5.8 && doc.getTextWidth(name) > maxW) {
      size -= 0.3;
      doc.setFontSize(size);
    }
    let label = name;
    while (label.length > 3 && doc.getTextWidth(label) > maxW) label = label.slice(0, -1);
    if (label !== name) label = `${label.replace(/[\s,·-]+$/, "")}…`;
    const labelW = doc.getTextWidth(label);
    doc.setTextColor(...PDF_INK.ink);
    doc.text(label, x, baseline);

    if (note) {
      doc.setFontSize(6.7);
      const noteW = doc.getTextWidth(note);
      if (labelW + noteW + 2.5 <= colW) {
        doc.setTextColor(...PDF_INK.muted);
        const right = cols === 1 ? R : x + colW;
        if (right - noteW > x + labelW + 1.5) doc.text(note, right, baseline, { align: "right" });
      }
    }
  });

  return y + perCol * lineH;
}

// A titled paragraph — the clinical narrative sections of a form.
export function drawTextBlock(doc, label, value, y, { gap = 5 } = {}) {
  const text = String(value || "").trim();
  if (!text) return y;
  drawSectionLabel(doc, label, y);
  const lines = doc.splitTextToSize(text, R - M);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.6);
  doc.setTextColor(...PDF_INK.ink);
  let yy = y + 6;
  lines.forEach((line) => {
    doc.text(line, M, yy);
    yy += 4.9;
  });
  return yy + gap;
}

export function textBlockHeight(doc, value) {
  const text = String(value || "").trim();
  if (!text) return 0;
  const lines = doc.splitTextToSize(text, R - M).length;
  return 12 + Math.max(0, lines - 1) * 4.9;
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
    doc.text(line, PDF_PAGE.margin, y);
    y += 5.2;
  });
  return y + gap;
}

// ===== Doctor's signature =====
export function drawSignatureBlock(doc, opts = {}) {
  const { image, imageFormat, doctorName, detail, note } = opts;

  drawSectionLabel(doc, "Doctor's Signature", SIGNATURE_HEADING);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.9);
  doc.setTextColor(...PDF_INK.muted);
  doc.text("Authorized doctor's signature", M, SIGNATURE_HEADING + 5);

  if (image) {
    try {
      doc.addImage(String(image), imageFormat || "PNG", M + 2, SIGNATURE_RULE - 17, 52, 15, undefined, "FAST");
    } catch (e) {
      // A request is never issued without its signature — stop rather than
      // print a form that only looks signed.
      throw new Error("The signature could not be placed on the request form.");
    }
  }

  doc.setDrawColor(...PDF_INK.muted);
  doc.setLineWidth(0.4);
  doc.line(M, SIGNATURE_RULE, R, SIGNATURE_RULE);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.4);
  doc.setTextColor(...PDF_INK.muted);
  doc.text(String(doctorName || "").trim() || "—", M, SIGNATURE_RULE + 6);

  doc.setDrawColor(...PDF_INK.hair);
  doc.setLineWidth(0.3);
  doc.line(M, SIGNATURE_RULE + 9.5, R, SIGNATURE_RULE + 9.5);

  const meta = [detail, note].filter((v) => String(v || "").trim()).join("  ·  ");
  if (meta) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.4);
    doc.setTextColor(...PDF_INK.muted);
    doc.text(String(meta), M, SIGNATURE_RULE + 14, { maxWidth: 150 });
  }
}

// The same signature element at the end of a flowing document.
export function drawSignatureInline(doc, opts, y, logo, title) {
  let top = y + 10;
  if (top + 24 > FLOW_BOTTOM) {
    y = startPage(doc, logo, title) + 2;
    top = y + 10;
  }
  const { margin: marginX } = PDF_PAGE;
  const lineRight = PDF_PAGE.right;

  drawSectionLabel(doc, "Doctor's Signature", top);
  if (opts?.image) {
    try {
      doc.addImage(String(opts.image), opts.imageFormat || "PNG", marginX + 2, top + 8, 52, 15, undefined, "FAST");
    } catch (e) {
      /* an inline signature is informational — never block the document */
    }
  }
  doc.setDrawColor(...PDF_INK.muted);
  doc.setLineWidth(0.4);
  doc.line(marginX, top + 25, lineRight, top + 25);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.4);
  doc.setTextColor(...PDF_INK.muted);
  doc.text(String(opts?.doctorName || "").trim() || "—", marginX, top + 31);

  const meta = [opts?.detail, opts?.note].filter((v) => String(v || "").trim()).join("  ·  ");
  if (meta) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.6);
    doc.text(String(meta), marginX, top + 35, { maxWidth: 150 });
  }
  return top + 38;
}

// ===== Footer =====
export function drawRequestFooter(doc, reference, note) {
  const total = doc.getNumberOfPages();
  const current = doc.getCurrentPageInfo().pageNumber;
  const framed = doc.__amedixFramed === true;

  for (let page = 1; page <= total; page += 1) {
    doc.setPage(page);

    if (framed) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.8);
      doc.setTextColor(...PDF_INK.muted);
      doc.text("AMEDIX · One connected healthcare journey", PDF_PAGE.width / 2, FOOTER_TAGLINE, { align: "center" });
      if (reference) {
        doc.setFontSize(5.8);
        doc.text(String(reference), PDF_PAGE.width / 2, FOOTER_REFERENCE, { align: "center" });
      }
      continue;
    }

    if (note) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(...PDF_INK.muted);
      const noteLines = doc.splitTextToSize(String(note), PDF_PAGE.right - PDF_PAGE.margin);
      let ny = 281 - (noteLines.length - 1) * 3.6;
      noteLines.forEach((line) => {
        doc.text(line, PDF_PAGE.margin, ny);
        ny += 3.6;
      });
    }

    doc.setDrawColor(...PDF_INK.hair);
    doc.setLineWidth(0.3);
    doc.line(PDF_PAGE.margin, 284, PDF_PAGE.right, 284);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...PDF_INK.muted);
    doc.text("AMedix — Connected Care. Better Health.", PDF_PAGE.margin, 289);
    doc.text(`Reference: ${reference || "—"}`, PDF_PAGE.right, 289, { align: "right" });
    if (total > 1) doc.text(`Page ${page} of ${total}`, (PDF_PAGE.margin + PDF_PAGE.right) / 2, 289, { align: "center" });
  }

  doc.setPage(current);
}