// Text and table primitives for the AMedix clinical-note sheet.
//
// Everything here is measured before it is printed: no line may run past the
// right margin, no row is left hanging over a page edge, a heading is never
// separated from the content it introduces, and every box drawn is reported to
// the document audit that verifies the finished pages.
import {
  PDF_PAGE,
  PDF_INK,
  FLOW_BOTTOM,
  startPage,
  drawSectionLabel,
  drawDivider,
} from "@/lib/requestPdfLayout";
import { hasArabic, wrapArabicText, drawArabicLine, arabicWidth } from "@/lib/pdfText";
import { recordPdfBox, documentDensity, textBox } from "@/lib/pdfLayoutAudit";

export const PAGE = {
  M: PDF_PAGE.margin,
  R: PDF_PAGE.right,
  W: PDF_PAGE.right - PDF_PAGE.margin,
  BOTTOM: FLOW_BOTTOM - 2,
};

const { M, R, W } = PAGE;
export const LABEL_W = 46;
const VALUE_GAP = 6;

// One type scale and one spacing rhythm for the whole record. The corrective
// pass tightens spacing (density) — type sizes never shrink below these.
const TYPE = {
  section: 7.6,
  label: 7,
  value: 8.8,
  caption: 7.5,
  cellLabel: 6.3,
  cellValue: 8.3,
  vitalLabel: 6.2,
  vitalValue: 8.8,
};
const LEAD = {
  label: 3.5,
  value: 4.35,
  caption: 3.7,
  cellLabel: 3,
  cellValue: 4.15,
  vitalLabel: 3,
  vitalValue: 4.1,
};
const SPACE = { heading: 6.2, rowPad: 1.9, cellGap: 8, cellPad: 2.6 };

const density = (doc) => documentDensity(doc);

export function textWidth(doc, text, size, weight = "normal") {
  if (hasArabic(text)) return arabicWidth(text, size, weight);
  doc.setFont("helvetica", weight);
  doc.setFontSize(size);
  return doc.getTextWidth(String(text ?? ""));
}

// A line still too wide (a long reference, a word with no spaces) is broken at
// the character that fits, so nothing can ever leave the column.
function fitLines(doc, lines, width, size, weight = "normal") {
  const out = [];
  lines.forEach((line) => {
    if (textWidth(doc, line, size, weight) <= width + 0.5) {
      out.push(line);
      return;
    }
    let current = "";
    Array.from(String(line)).forEach((character) => {
      if (current && textWidth(doc, current + character, size, weight) > width) {
        out.push(current);
        current = character;
      } else {
        current += character;
      }
    });
    if (current) out.push(current);
  });
  return out;
}

export function wrap(doc, text, width, size, weight = "normal") {
  const raw = String(text ?? "");
  if (!raw.trim()) return [];
  const lines = hasArabic(raw)
    ? wrapArabicText(raw, width, size, weight)
    : doc.splitTextToSize(raw, width);
  return fitLines(doc, lines, width, size, weight);
}

// One line of text, clamped inside the content column and reported to the
// audit. Right-aligned text is right-aligned to the column edge, never beyond it.
export function writeLine(doc, line, y, {
  size = TYPE.value,
  weight = "normal",
  color = PDF_INK.ink,
  x = M,
  width = W,
  align = "left",
  kind = "text",
} = {}) {
  const text = String(line ?? "");
  if (!text.trim()) return;

  const left = Math.max(M, Math.min(x, R - 1));
  const boxWidth = Math.max(1, Math.min(width, R - left));

  if (hasArabic(text)) {
    drawArabicLine(doc, text, left, y, { size, weight, color, width: boxWidth, align });
  } else {
    doc.setFont("helvetica", weight);
    doc.setFontSize(size);
    doc.setTextColor(...color);
    if (align === "right") doc.text(text, left + boxWidth, y, { align: "right" });
    else doc.text(text, left, y);
  }

  recordPdfBox(doc, { kind, x: left, width: boxWidth, ...textBox(y, size), label: text });
}

// A heading is tracked and upper-cased; its box is measured the same way it is
// drawn (glyph by glyph), so the audit sees the true right edge.
function headingWidth(doc, text) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(TYPE.section);
  return doc.getTextWidth(String(text).toUpperCase()) + String(text).length * 1.1;
}

function writeHeading(doc, text, y, { x = M, align = "left" } = {}) {
  drawSectionLabel(doc, text, y, x, align);
  const width = Math.min(W, headingWidth(doc, text));
  recordPdfBox(doc, {
    kind: "heading",
    x: align === "right" ? Math.max(M, x - width) : x,
    width,
    ...textBox(y, TYPE.section),
    label: text,
  });
}

export function nextPage(doc, artwork, title) {
  return startPage(doc, artwork, title) + 2;
}

function hairline(doc, y) {
  doc.setDrawColor(...PDF_INK.hair);
  doc.setLineWidth(0.15);
  doc.line(M, y, R, y);
}

// The document's own title across the head with its reference: a long title
// wraps and the reference drops to its own line rather than running off the
// sheet, and it is never left alone at the foot of a page.
export function writeDocumentHead(doc, title, reference, y) {
  const label = String(title || "Clinical Note").toUpperCase();
  const ref = String(reference || "").trim();
  let yy = y;
  if (yy + 20 > PAGE.BOTTOM) yy = nextPage(doc, null, title);

  if (!ref || headingWidth(doc, label) + headingWidth(doc, ref) + 8 <= W) {
    writeHeading(doc, label, yy);
    if (ref) writeHeading(doc, ref, yy, { x: R, align: "right" });
    return yy + 6;
  }

  wrap(doc, label, W, TYPE.section, "bold").forEach((line) => {
    writeHeading(doc, line, yy);
    yy += 5.2;
  });
  writeHeading(doc, ref, yy, { x: R, align: "right" });
  return yy + 6;
}

// A section heading with its rule. Room is reserved for the heading AND its
// first block of content, so a heading can never sit at the foot of a page.
export function writeSection(doc, title, y, artwork, noteTitle) {
  const d = density(doc);
  let yy = y;
  if (yy + 24 > PAGE.BOTTOM) yy = nextPage(doc, artwork, noteTitle);
  writeHeading(doc, title, yy);
  yy += 2.6 * d;
  drawDivider(doc, yy);
  return yy + SPACE.heading * d;
}

// One aligned record row: the label in its own column, the value beside it.
// This is what keeps a complete note inside a few pages instead of a long
// stack of label-over-value blocks.
export function writeRow(doc, label, value, y, artwork, opts = {}) {
  const {
    noteTitle = "Clinical Note",
    labelWidth = LABEL_W,
    size = TYPE.value,
    labelSize = TYPE.label,
    rule = true,
    numbered = false,
  } = opts;
  const d = density(doc);
  const lineHeight = (opts.lineHeight ?? LEAD.value) * d;

  const paragraphs = String(value ?? "")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  const rows = numbered ? paragraphs.map((line, i) => `${i + 1}. ${line}`) : paragraphs;
  if (rows.length === 0) return y;

  const valueX = M + labelWidth + VALUE_GAP;
  const valueW = R - valueX;
  const valueLines = rows.flatMap((line) => wrap(doc, line, valueW, size));
  const labelLines = wrap(doc, String(label || ""), labelWidth, labelSize, "bold");
  const labelLead = LEAD.label * d;
  const height = Math.max(valueLines.length * lineHeight, labelLines.length * labelLead);

  let yy = y;
  let continued = false;
  if (yy + height > PAGE.BOTTOM && height <= PAGE.BOTTOM - 58) {
    yy = nextPage(doc, artwork, noteTitle);
  }

  labelLines.forEach((line, index) => {
    writeLine(doc, line, yy + index * labelLead, {
      size: labelSize,
      weight: "bold",
      color: PDF_INK.muted,
      x: M,
      width: labelWidth,
      kind: "label",
    });
  });

  let valueY = yy;
  valueLines.forEach((line) => {
    if (valueY > PAGE.BOTTOM) {
      valueY = nextPage(doc, artwork, noteTitle);
      continued = true;
    }
    writeLine(doc, line, valueY, {
      size,
      x: valueX,
      width: valueW,
      align: hasArabic(line) ? "right" : "left",
    });
    valueY += lineHeight;
  });

  const end = Math.max(labelLines.length * labelLead + yy, valueY - lineHeight) + SPACE.rowPad * d;
  if (rule && !continued) hairline(doc, end - 0.7);
  return end;
}

// ===== Vital signs =====
// The stored summary ("Temperature: 37.2 °C · Pulse: 78 bpm · …") printed as
// one compact grid, in the order a clinician reads them.
const VITALS = [
  { label: "Blood Pressure", keys: ["blood pressure", "bp"] },
  { label: "Heart Rate", keys: ["heart rate", "pulse", "hr"] },
  { label: "Respiratory Rate", keys: ["respiratory rate", "respiratory", "rr"] },
  { label: "Temperature", keys: ["temperature", "temp"] },
  {
    label: "SpO₂",
    keys: ["oxygen saturation (spo₂)", "oxygen saturation (spo2)", "oxygen saturation", "spo2", "spo₂", "sao2"],
  },
  { label: "Weight", keys: ["weight"] },
  { label: "Height", keys: ["height"] },
  { label: "BMI", keys: ["bmi"] },
  { label: "Mean Arterial Pressure", keys: ["mean arterial pressure", "map"] },
  { label: "Pain Score", keys: ["pain score", "pain"] },
  { label: "Glasgow Coma Scale", keys: ["glasgow coma scale", "gcs"] },
  { label: "Blood Glucose", keys: ["blood glucose", "glucose"] },
  { label: "Urine Output", keys: ["urine output"] },
];

export function parseVitals(value) {
  const raw = String(value || "").trim();
  if (!raw) return [];
  const found = new Map();
  const extra = [];
  raw.split(/\s*·\s*|\s*;\s*/).forEach((part) => {
    const item = part.trim();
    if (!item) return;
    const idx = item.lastIndexOf(":");
    const key = idx > 0 ? item.slice(0, idx).trim().toLowerCase() : "";
    const def = key ? VITALS.find((vital) => vital.keys.includes(key)) : null;
    if (def) found.set(def.label, item.slice(idx + 1).trim());
    else extra.push(item);
  });
  const grid = VITALS.filter((vital) => found.has(vital.label)).map((vital) => ({
    label: vital.label,
    value: found.get(vital.label),
  }));
  if (extra.length > 0) grid.push({ label: "Other Measurements", value: extra.join(" · ") });
  return grid;
}

// A section's sub-heading: the label of the field whose findings follow, so a
// structured block keeps the name it was documented under.
export function writeCaption(doc, text, y, artwork, noteTitle) {
  const label = String(text || "").trim();
  if (!label) return y;
  const d = density(doc);
  const lead = LEAD.caption * d;
  const lines = wrap(doc, label, W, TYPE.caption, "bold");
  let yy = y;
  if (yy + lines.length * lead > PAGE.BOTTOM) yy = nextPage(doc, artwork, noteTitle);
  lines.forEach((line, index) =>
    writeLine(doc, line, yy + index * lead, {
      size: TYPE.caption,
      weight: "bold",
      color: PDF_INK.navy,
      width: W,
      kind: "heading",
    })
  );
  return yy + lines.length * lead + 1.2;
}

export function writeVitalGrid(doc, vitals, y, artwork, noteTitle, { caption = "" } = {}) {
  const d = density(doc);
  const perRow = 4;
  const colW = W / perRow;
  const labelLead = LEAD.vitalLabel * d;
  const valueLead = LEAD.vitalValue * d;
  let yy = writeCaption(doc, caption, y, artwork, noteTitle);

  for (let start = 0; start < vitals.length; start += perRow) {
    const cells = vitals.slice(start, start + perRow).map((item) => ({
      labels: wrap(doc, item.label, colW - 5, TYPE.vitalLabel),
      values: wrap(doc, item.value, colW - 5, TYPE.vitalValue, "bold"),
    }));
    const labelLines = Math.max(...cells.map((cell) => cell.labels.length));
    const valueLines = Math.max(...cells.map((cell) => cell.values.length));
    const rowHeight = labelLines * labelLead + 1.5 + valueLines * valueLead + 2.6 * d;
    if (yy + rowHeight > PAGE.BOTTOM) yy = nextPage(doc, artwork, noteTitle);

    cells.forEach((cell, column) => {
      const x = M + column * colW;
      cell.labels.forEach((line, index) =>
        writeLine(doc, line, yy + index * labelLead, {
          size: TYPE.vitalLabel,
          color: PDF_INK.muted,
          x,
          width: colW - 4,
          kind: "label",
        })
      );
      const base = yy + labelLines * labelLead + 1.5;
      cell.values.forEach((line, index) =>
        writeLine(doc, line, base + index * valueLead, {
          size: TYPE.vitalValue,
          weight: "bold",
          x,
          width: colW - 4,
          align: hasArabic(line) ? "right" : "left",
        })
      );
    });
    yy += rowHeight;
    hairline(doc, yy - 1.8);
  }
  return yy + 0.8;
}

// ===== Physical examination =====
// A documented examination prints as its anatomical / system groups, each
// system heading followed by that system's findings — never as one long list.
export function examinationBlocks(text) {
  return String(text || "")
    .split(/\n\s*\n/)
    .map((block) => {
      const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
      const heading = lines.shift() || "";
      const items = lines.map((line) => {
        const clean = line.replace(/^•\s*/, "");
        const index = clean.indexOf(":");
        return index > 0 ? [clean.slice(0, index).trim(), clean.slice(index + 1).trim()] : [clean, ""];
      });
      return { heading, items };
    })
    .filter((block) => block.heading || block.items.length > 0);
}

// ===== Section field grid =====
// A section's answered fields laid out in columns: short answers sit side by
// side (three columns, two when the answers need more room), while a narrative
// answer takes the full width. Each cell keeps its own label directly above its
// own answer, so a label can never be read against the wrong finding.
function gridCell(doc, entry, columnCount) {
  const colW = (W - SPACE.cellGap * (columnCount - 1)) / columnCount;
  const paragraphs = String(entry.value ?? "")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (paragraphs.length > 1) return null;
  const labels = wrap(doc, entry.label, colW, TYPE.cellLabel, "bold");
  const values = wrap(doc, paragraphs[0], colW, TYPE.cellValue);
  if (labels.length > 2 || values.length > 2) return null;
  return { labels, values, colW };
}

export function writeFieldGrid(doc, entries, y, artwork, noteTitle) {
  const list = (entries || []).filter((entry) => String(entry.value ?? "").trim());
  if (list.length === 0) return y;
  if (list.length === 1) {
    return writeRow(doc, list[0].label, list[0].value, y, artwork, { noteTitle, rule: false });
  }

  const d = density(doc);
  const labelLead = LEAD.cellLabel * d;
  const valueLead = LEAD.cellValue * d;
  const fitThree = list.filter((entry) => gridCell(doc, entry, 3)).length;
  const fitTwo = list.filter((entry) => gridCell(doc, entry, 2)).length;
  const columns = fitThree * 2 >= list.length ? 3 : fitTwo * 2 >= list.length ? 2 : 1;

  let yy = y;
  let row = [];

  const flush = () => {
    if (row.length === 0) return;
    const height = Math.max(
      ...row.map(
        (cell) => cell.labels.length * labelLead + 1.3 + cell.values.length * valueLead + SPACE.cellPad * d
      )
    );
    if (yy + height > PAGE.BOTTOM) yy = nextPage(doc, artwork, noteTitle);
    row.forEach((cell, column) => {
      const x = M + column * (cell.colW + SPACE.cellGap);
      cell.labels.forEach((line, index) =>
        writeLine(doc, line, yy + index * labelLead, {
          size: TYPE.cellLabel,
          weight: "bold",
          color: PDF_INK.muted,
          x,
          width: cell.colW,
          kind: "label",
        })
      );
      const base = yy + cell.labels.length * labelLead + 1.3;
      cell.values.forEach((line, index) =>
        writeLine(doc, line, base + index * valueLead, {
          size: TYPE.cellValue,
          x,
          width: cell.colW,
          align: hasArabic(line) ? "right" : "left",
        })
      );
    });
    yy += height;
    hairline(doc, yy - 1.7);
    row = [];
  };

  list.forEach((entry) => {
    const cell = columns > 1 ? gridCell(doc, entry, columns) : null;
    if (cell) {
      row.push(cell);
      if (row.length === columns) flush();
      return;
    }
    flush();
    yy = writeRow(doc, entry.label, entry.value, yy, artwork, { noteTitle, rule: false });
  });
  flush();

  return yy;
}

export function writeExamination(doc, text, y, artwork, noteTitle, { label = "Examination" } = {}) {
  const raw = String(text || "").trim();
  if (!raw) return y;
  if (!/^\s*•/m.test(raw)) return writeRow(doc, label, raw, y, artwork, { noteTitle });

  const d = density(doc);
  let yy = y;
  examinationBlocks(raw).forEach((block) => {
    // A system heading travels with at least its first finding.
    if (yy > PAGE.BOTTOM - 20) yy = nextPage(doc, artwork, noteTitle);
    if (block.heading) {
      wrap(doc, block.heading, W, TYPE.value, "bold").forEach((line) => {
        writeLine(doc, line, yy, { size: TYPE.value, weight: "bold", color: PDF_INK.navy, kind: "heading" });
        yy += LEAD.value * d;
      });
    }
    block.items.forEach(([itemLabel, value]) => {
      yy = writeRow(doc, itemLabel, value, yy, artwork, {
        noteTitle,
        labelWidth: LABEL_W,
        size: TYPE.cellValue,
        lineHeight: LEAD.cellValue,
        rule: false,
      });
    });
    yy += 1.4 * d;
  });
  return yy;
}

// A labelled group of findings that must stay with its label: the caption and
// the first row of the grid are reserved together before either is printed.
export function writeSubBlock(doc, label, entries, y, artwork, noteTitle) {
  const list = (entries || []).filter((entry) => String(entry.value ?? "").trim());
  if (list.length === 0) return y;
  const d = density(doc);
  const captionLines = wrap(doc, String(label || ""), W, TYPE.caption, "bold").length;
  const needed = captionLines * LEAD.caption * d + 1.2 + 12;
  let yy = y;
  if (yy + needed > PAGE.BOTTOM) yy = nextPage(doc, artwork, noteTitle);
  yy = writeCaption(doc, label, yy, artwork, noteTitle);
  return writeFieldGrid(doc, list, yy, artwork, noteTitle);
}