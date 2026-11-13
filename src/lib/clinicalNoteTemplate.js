// The AMedix clinical-note sheet: navy top band, logo left and title right,
// a tinted patient card, an outlined encounter card, then each part of the
// record in its own outlined box under a bold heading, a tinted vital-signs
// strip, a tinted follow-up card and a signature row. Content is measured
// before it is drawn, so a box that does not fit continues on the next page.
import { PDF_INK } from "@/lib/requestPdfLayout";
import { wrap, writeLine, parseVitals, examinationBlocks } from "@/lib/clinicalNotePdfLayout";
import { hasArabic } from "@/lib/pdfText";

export const T = { M: 15, R: 195, W: 180, BOTTOM: 280, TOP: 35 };
const ACCENT = [0, 126, 181];
const NAVY = PDF_INK.navy;
const MUTED = PDF_INK.muted;
const TINT = PDF_INK.badge;
const LINE = [205, 218, 230];
const PAD = 3.6;

const text = (doc, value, x, y, { size = 8.8, weight = "normal", color = PDF_INK.ink, align = "left" } = {}) => {
  doc.setFont("helvetica", weight);
  doc.setFontSize(size);
  doc.setTextColor(...color);
  doc.text(String(value ?? ""), x, y, align === "right" ? { align: "right" } : undefined);
};

function topBand(doc) {
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, 210, 4.2, "F");
}

export function drawHeader(doc, logo, ref) {
  topBand(doc);
  let x = T.M;
  if (logo?.dataUrl) {
    try {
      const h = 13;
      const w = h * (logo.ratio || 1.13);
      doc.addImage(logo.dataUrl, "PNG", T.M, 10, w, h, undefined, "FAST");
      x = T.M + w + 3;
    } catch (e) {
      /* the mark is decorative */
    }
  }
  text(doc, "AMedix", x, 19, { size: 18, weight: "bold", color: NAVY });
  text(doc, "CONNECTED HEALTHCARE", x, 23.6, { size: 6.4, weight: "bold", color: ACCENT });
  text(doc, "CLINICAL NOTE", T.R, 17.5, { size: 14, weight: "bold", color: NAVY, align: "right" });
  text(doc, "Physician encounter record", T.R, 22.6, { size: 7.5, color: MUTED, align: "right" });
  if (ref) text(doc, ref, T.R, 26.4, { size: 6.4, color: MUTED, align: "right" });
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.25);
  doc.line(T.M, 29.5, T.R, 29.5);
  return T.TOP;
}

export function newPage(doc, ref) {
  doc.addPage();
  topBand(doc);
  text(doc, "AMedix  |  Clinical Note", T.M, 12, { size: 8, weight: "bold", color: NAVY });
  if (ref) text(doc, ref, T.R, 12, { size: 7, color: MUTED, align: "right" });
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.25);
  doc.line(T.M, 15, T.R, 15);
  return 21;
}

export function drawFooters(doc) {
  const total = doc.getNumberOfPages();
  for (let page = 1; page <= total; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.2);
    doc.line(T.M, 285, T.R, 285);
    text(doc, "AMedix  |  Confidential medical document  |  Handle in accordance with applicable privacy requirements", T.M, 290, {
      size: 6.2,
      color: MUTED,
    });
    text(doc, `Page ${page} of ${total}`, T.R, 290, { size: 6.2, color: MUTED, align: "right" });
  }
}

// A card with a small coloured title and label/value cells in two columns.
export function drawCard(doc, title, cells, y, { tinted }) {
  const colW = T.W / 2 - PAD;
  const prepared = cells.map((cell) => ({
    ...cell,
    lines: wrap(doc, cell.value || "—", colW - PAD, cell.big ? 10 : 8.4, cell.big ? "bold" : "normal"),
  }));
  const rows = [];
  for (let i = 0; i < prepared.length; i += 2) rows.push(prepared.slice(i, i + 2));
  const rowH = (row) => Math.max(...row.map((c) => (c.label ? 3.8 : 0) + c.lines.length * (c.big ? 4.8 : 4.2))) + 2;
  const height = 10 + rows.reduce((sum, row) => sum + rowH(row), 0) + 1;

  if (tinted) {
    doc.setFillColor(...TINT);
    doc.roundedRect(T.M, y, T.W, height, 3, 3, "F");
  } else {
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.3);
    doc.roundedRect(T.M, y, T.W, height, 3, 3, "S");
  }
  text(doc, title, T.M + PAD + 1, y + 6.4, { size: 8, weight: "bold", color: ACCENT });
  let yy = y + 11.5;
  rows.forEach((row) => {
    row.forEach((cell, col) => {
      const x = T.M + PAD + 1 + col * (T.W / 2);
      let cy = yy;
      if (cell.label) {
        text(doc, cell.label, x, cy, { size: 7, color: MUTED });
        cy += 3.8;
      }
      cell.lines.forEach((line) => {
        writeLine(doc, line, cy, {
          size: cell.big ? 10 : 8.4,
          weight: cell.big ? "bold" : "normal",
          x,
          width: colW - PAD,
          align: hasArabic(line) ? "right" : "left",
        });
        cy += cell.big ? 4.8 : 4.2;
      });
    });
    yy += rowH(row);
  });
  return y + height + 5;
}

// Turns [label, value] rows into measured lines for a boxed section.
export function rowsToLines(doc, rows) {
  const width = T.W - PAD * 2;
  const lines = [];
  rows.forEach(({ label, value, bold }) => {
    if (label) lines.push({ t: label, size: 7, weight: "bold", color: MUTED, h: 3.7 });
    String(value || "")
      .split(/\n+/)
      .map((l) => l.trim())
      .filter(Boolean)
      .forEach((para) => {
        wrap(doc, para, width, 8.8, bold ? "bold" : "normal").forEach((t) =>
          lines.push({ t, size: 8.8, weight: bold ? "bold" : "normal", color: PDF_INK.ink, h: 4.3 })
        );
      });
    lines.push({ gap: true, h: 1.6 });
  });
  while (lines.length && lines[lines.length - 1].gap) lines.pop();
  return lines;
}

// Examination text grouped by system becomes heading + finding lines.
export function examToLines(doc, label, value) {
  const raw = String(value || "").trim();
  if (!/^\s*•/m.test(raw)) return rowsToLines(doc, [{ label, value: raw }]);
  const width = T.W - PAD * 2;
  const lines = [];
  examinationBlocks(raw).forEach((block) => {
    if (block.heading) {
      wrap(doc, block.heading, width, 8.6, "bold").forEach((t) =>
        lines.push({ t, size: 8.6, weight: "bold", color: NAVY, h: 4.4 })
      );
    }
    block.items.forEach(([k, v]) => {
      wrap(doc, v ? `${k}: ${v}` : k, width - 4, 8.4).forEach((t) =>
        lines.push({ t, size: 8.4, weight: "normal", color: PDF_INK.ink, h: 4.1, indent: 4 })
      );
    });
    lines.push({ gap: true, h: 1.8 });
  });
  while (lines.length && lines[lines.length - 1].gap) lines.pop();
  return lines;
}

// A bold heading (with an optional muted hint at the right) and an outlined
// box holding the lines. Returns the new y; continues across pages.
export function drawBox(doc, title, hint, lines, y, ref) {
  let yy = y;
  if (yy + 24 > T.BOTTOM) yy = newPage(doc, ref);
  text(doc, title.toUpperCase(), T.M, yy + 3, { size: 9.4, weight: "bold", color: NAVY });
  if (hint) text(doc, hint, T.R, yy + 3, { size: 7, color: MUTED, align: "right" });
  yy += 6;

  const body = lines.length ? lines : [{ t: "", size: 8.8, h: 6 }];
  let i = 0;
  while (i < body.length) {
    let used = PAD * 2;
    const start = i;
    while (i < body.length && (i === start || yy + used + body[i].h <= T.BOTTOM)) {
      used += body[i].h;
      i += 1;
    }
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.3);
    doc.roundedRect(T.M, yy, T.W, used, 3, 3, "S");
    let ly = yy + PAD + 3;
    body.slice(start, i).forEach((line) => {
      if (!line.gap && line.t) {
        const x = T.M + PAD + (line.indent || 0);
        writeLine(doc, line.t, ly, {
          size: line.size,
          weight: line.weight,
          color: line.color,
          x,
          width: T.W - PAD * 2 - (line.indent || 0),
          align: hasArabic(line.t) ? "right" : "left",
        });
      }
      ly += line.h;
    });
    yy += used;
    if (i < body.length) yy = newPage(doc, ref);
  }
  return yy + 5;
}

export function drawVitals(doc, groups, y, ref) {
  const perRow = 5;
  const colW = (T.W - PAD * 2) / perRow;
  const items = groups.flatMap((g) => g);
  let yy = y;
  if (yy + 30 > T.BOTTOM) yy = newPage(doc, ref);
  text(doc, "VITAL SIGNS", T.M, yy + 3, { size: 9.4, weight: "bold", color: NAVY });
  yy += 6;
  for (let s = 0; s < items.length; s += perRow) {
    const cells = items.slice(s, s + perRow).map((it) => ({
      label: wrap(doc, it.label, colW - 2, 6.6, "bold"),
      value: wrap(doc, it.value, colW - 2, 9, "bold"),
    }));
    const lh = Math.max(...cells.map((c) => c.label.length)) * 3;
    const vh = Math.max(...cells.map((c) => c.value.length)) * 4.3;
    const h = PAD * 2 + lh + vh + 1;
    if (yy + h > T.BOTTOM) yy = newPage(doc, ref);
    doc.setFillColor(...TINT);
    doc.roundedRect(T.M, yy, T.W, h, 3, 3, "F");
    cells.forEach((cell, col) => {
      const x = T.M + PAD + col * colW;
      cell.label.forEach((l, k) => text(doc, l, x, yy + PAD + 2.4 + k * 3, { size: 6.6, weight: "bold", color: MUTED }));
      cell.value.forEach((l, k) => text(doc, l, x, yy + PAD + 2.4 + lh + 2 + k * 4.3, { size: 9, weight: "bold" }));
    });
    yy += h + 2;
  }
  return yy + 3;
}

export function drawFollowUp(doc, value, y, ref) {
  const lines = wrap(doc, value, T.W - PAD * 2 - 2, 8.6);
  const h = PAD * 2 + 5 + lines.length * 4.2;
  let yy = y;
  if (yy + h > T.BOTTOM) yy = newPage(doc, ref);
  doc.setFillColor(...TINT);
  doc.roundedRect(T.M, yy, T.W, h, 3, 3, "F");
  text(doc, "Follow-up / return precautions", T.M + PAD + 1, yy + PAD + 2.6, { size: 8.4, weight: "bold", color: NAVY });
  lines.forEach((l, k) =>
    writeLine(doc, l, yy + PAD + 8 + k * 4.2, {
      size: 8.6,
      x: T.M + PAD + 1,
      width: T.W - PAD * 2 - 2,
      align: hasArabic(l) ? "right" : "left",
    })
  );
  return yy + h + 5;
}

export function drawSignatureRow(doc, { physician, license, signedAt }, y, ref) {
  let yy = y;
  if (yy + 22 > T.BOTTOM) yy = newPage(doc, ref);
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.25);
  doc.line(T.M, yy, T.R, yy);
  yy += 6;
  const x2 = T.M + 100;
  text(doc, `Physician: ${physician || "—"}`, T.M, yy, { size: 9, weight: "bold", color: NAVY });
  text(doc, "Signature:", x2, yy, { size: 8.6 });
  doc.setDrawColor(...MUTED);
  doc.setLineWidth(0.3);
  doc.line(x2 + 18, yy + 0.6, T.R, yy + 0.6);
  text(doc, `License / registration: ${license || "—"}`, T.M, yy + 6, { size: 8, color: MUTED });
  text(doc, `Signed at: ${signedAt || "—"}`, x2, yy + 6, { size: 8, color: MUTED });
  return yy + 10;
}

export { parseVitals };