// Text and table primitives for the AMedix clinical-note sheet.
//
// Everything here is measured before it is printed: no line may run past the
// right margin, no row is left hanging over a page edge, and a row that would
// not fit moves to the next page whole unless it is taller than a page.
import {
  PDF_PAGE,
  PDF_INK,
  FLOW_BOTTOM,
  startPage,
  drawSectionLabel,
  drawDivider,
} from "@/lib/requestPdfLayout";
import { hasArabic, wrapArabicText, drawArabicLine, arabicWidth } from "@/lib/pdfText";

export const PAGE = {
  M: PDF_PAGE.margin,
  R: PDF_PAGE.right,
  W: PDF_PAGE.right - PDF_PAGE.margin,
  BOTTOM: FLOW_BOTTOM - 2,
};

const { M, R, W } = PAGE;
export const LABEL_W = 46;
const VALUE_GAP = 6;

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

export function writeLine(doc, line, y, { size = 8.8, weight = "normal", color = PDF_INK.ink, x = M, width = W, align = "left" } = {}) {
  if (hasArabic(line)) {
    drawArabicLine(doc, line, x, y, { size, weight, color, width, align });
    return;
  }
  doc.setFont("helvetica", weight);
  doc.setFontSize(size);
  doc.setTextColor(...color);
  doc.text(String(line), x, y, align === "right" ? { align: "right" } : undefined);
}

export function nextPage(doc, artwork, title) {
  return startPage(doc, artwork, title) + 2;
}

function hairline(doc, y) {
  doc.setDrawColor(...PDF_INK.hair);
  doc.setLineWidth(0.15);
  doc.line(M, y, R, y);
}

// A section heading with its rule — the one hierarchy level every note uses.
export function writeSection(doc, title, y, artwork, noteTitle) {
  if (y > PAGE.BOTTOM - 26) y = nextPage(doc, artwork, noteTitle);
  drawSectionLabel(doc, title, y);
  y += 2.6;
  drawDivider(doc, y);
  return y + 6.2;
}

// One aligned record row: the label in its own column, the value beside it.
// This is what keeps a complete note inside a few pages instead of a long
// stack of label-over-value blocks.
export function writeRow(doc, label, value, y, artwork, opts = {}) {
  const {
    noteTitle = "Clinical Note",
    labelWidth = LABEL_W,
    size = 8.8,
    lineHeight = 4.35,
    labelSize = 7,
    indent = 0,
    rule = true,
    numbered = false,
  } = opts;

  const paragraphLines = String(value ?? "")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  const rows = numbered ? paragraphLines.map((line, i) => `${i + 1}. ${line}`) : paragraphLines;
  if (rows.length === 0) return y;

  const valueX = M + labelWidth + VALUE_GAP + indent;
  const valueW = R - valueX;
  const valueLines = rows.flatMap((line) => wrap(doc, line, valueW, size));
  const labelLines = wrap(doc, String(label || ""), labelWidth, labelSize, "bold");
  const height = Math.max(valueLines.length * lineHeight, labelLines.length * 3.5);

  let yy = y;
  let continued = false;
  if (yy + height > PAGE.BOTTOM && height <= PAGE.BOTTOM - 58) {
    yy = nextPage(doc, artwork, noteTitle);
  }

  labelLines.forEach((line, index) => {
    writeLine(doc, line, yy + index * 3.5, {
      size: labelSize,
      weight: "bold",
      color: PDF_INK.muted,
      x: M + indent,
      width: labelWidth,
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

  const end = Math.max(labelLines.length * 3.5 + yy, valueY - lineHeight) + 1.9;
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

export function writeVitalGrid(doc, vitals, y, artwork, noteTitle) {
  const perRow = 4;
  const colW = W / perRow;
  let yy = y;
  for (let start = 0; start < vitals.length; start += perRow) {
    const cells = vitals.slice(start, start + perRow).map((item) => ({
      labels: wrap(doc, item.label, colW - 5, 6.2),
      values: wrap(doc, item.value, colW - 5, 8.8, "bold"),
    }));
    const labelLines = Math.max(...cells.map((cell) => cell.labels.length));
    const valueLines = Math.max(...cells.map((cell) => cell.values.length));
    const rowHeight = labelLines * 2.9 + 1.5 + valueLines * 4.1 + 3.2;
    if (yy + rowHeight > PAGE.BOTTOM) yy = nextPage(doc, artwork, noteTitle);

    cells.forEach((cell, column) => {
      const x = M + column * colW;
      cell.labels.forEach((line, index) =>
        writeLine(doc, line, yy + index * 2.9, { size: 6.2, color: PDF_INK.muted, x, width: colW - 4 })
      );
      cell.values.forEach((line, index) =>
        writeLine(doc, line, yy + labelLines * 2.9 + 1.5 + index * 4.1, {
          size: 8.8,
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

export function writeExamination(doc, text, y, artwork, noteTitle, { label = "Examination" } = {}) {
  const raw = String(text || "").trim();
  if (!raw) return y;
  if (!/^\s*•/m.test(raw)) return writeRow(doc, label, raw, y, artwork, { noteTitle });

  let yy = y;
  examinationBlocks(raw).forEach((block) => {
    if (yy > PAGE.BOTTOM - 18) yy = nextPage(doc, artwork, noteTitle);
    if (block.heading) {
      wrap(doc, block.heading, W, 8.4, "bold").forEach((line) => {
        writeLine(doc, line, yy, { size: 8.4, weight: "bold", color: PDF_INK.navy });
        yy += 4.1;
      });
    }
    block.items.forEach(([itemLabel, value]) => {
      yy = writeRow(doc, itemLabel, value, yy, artwork, {
        noteTitle,
        labelWidth: 54,
        indent: 5,
        size: 8.3,
        lineHeight: 4.05,
        rule: false,
      });
    });
    yy += 1.4;
  });
  return yy;
}