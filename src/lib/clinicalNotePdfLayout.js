// Text and layout primitives for the AMedix clinical-note sheet.
//
// One typographic system governs the whole record: every section heading is the
// same navy bold line, every field label the same small muted caption, and every
// recorded value the same regular-weight dark text — so no finding looks more
// important than another. Nothing is printed before it is measured: field heights
// follow their content, text wraps on whole words, and a section heading is never
// separated from the first block it introduces. There are no frames, fill bars,
// row rules or letter-spaced headings — structure comes from spacing and type
// alone. Every box drawn is reported to the audit that verifies the pages.
import { jsPDF } from "jspdf";
import { PDF_PAGE, PDF_INK } from "@/lib/requestPdfLayout";
import { hasArabic, drawArabicLine, arabicWidth } from "@/lib/pdfText";
import { recordPdfBox, documentDensity, textBox } from "@/lib/pdfLayoutAudit";

// A4 geometry: one margin, one column grid, one letterhead and one footer,
// repeated at exactly these positions on every page of the record.
export const PAGE = { M: 20, R: 190, W: 170, TOP: 37, BOTTOM: 264 };

const CHROME = {
  logoTop: 13.5,
  logoHeight: 9.5,
  headRule: 27,
  footRule: 273,
  footText: 278.4,
};

// One type scale for the whole document.
const TYPE = {
  title: 9.6, // the note's own title, in the document head
  heading: 8.6, // every section heading
  caption: 7.9, // a group heading inside a section
  label: 6.9, // every field label
  value: 8.8, // every recorded value
  name: 11.4, // the patient's name
  meta: 6.4, // signature detail and the footer
};

const LEAD = { title: 4.9, heading: 4.6, caption: 4.1, label: 3.2, value: 4.35, name: 5.4, meta: 3.5 };

// Vertical rhythm: the room above a section, under its heading, between fields
// and between the rows of a column grid.
const SPACE = { section: 7.2, afterHeading: 4.4, row: 2.6, cellRow: 3.4, column: 7, caption: 1.6 };

// A block up to this tall (mm) is moved whole to the next page rather than split,
// keeping related findings together. Anything longer simply flows across the
// break, so a page is never left half empty for content that could never fit.
const KEEP_WHOLE = 88;

export const LABEL_W = 46;
const VALUE_GAP = 6;

const density = (doc) => documentDensity(doc);
const col2Width = () => (PAGE.W - SPACE.column) / 2;
const valueWidth = (labelWidth = LABEL_W) => PAGE.R - (PAGE.M + labelWidth + VALUE_GAP);

// ===== Measurement =====
export function textWidth(doc, text, size, weight = "normal") {
  const value = String(text ?? "");
  if (hasArabic(value)) return arabicWidth(value, size, weight);
  doc.setFont("helvetica", weight);
  doc.setFontSize(size);
  return doc.getTextWidth(value);
}

// Text is wrapped on whole words: a line ends only between two words, so no word
// is ever cut in half and no line can run into the next column. A single token
// wider than the column (a long code or reference) is the only case where a break
// inside a word is unavoidable.
export function wrap(doc, text, width, size, weight = "normal") {
  const raw = String(text ?? "");
  if (!raw.trim() || width <= 2) return [];

  const lines = [];
  raw.split(/\r?\n/).forEach((paragraph) => {
    const words = paragraph.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
    if (words.length === 0) return;

    let line = "";
    const flush = () => {
      if (line) lines.push(line);
      line = "";
    };

    words.forEach((word) => {
      const candidate = line ? `${line} ${word}` : word;
      if (textWidth(doc, candidate, size, weight) <= width + 0.2) {
        line = candidate;
        return;
      }
      flush();
      if (textWidth(doc, word, size, weight) <= width + 0.2) {
        line = word;
        return;
      }
      // An unbreakable token: split at the characters that fit.
      let chunk = "";
      Array.from(word).forEach((character) => {
        if (chunk && textWidth(doc, chunk + character, size, weight) > width) {
          lines.push(chunk);
          chunk = character;
        } else {
          chunk += character;
        }
      });
      line = chunk;
    });
    flush();
  });
  return lines;
}

// One line, clamped inside the content column and reported to the audit.
export function writeLine(doc, line, y, {
  size = TYPE.value,
  weight = "normal",
  color = PDF_INK.ink,
  x = PAGE.M,
  width = PAGE.W,
  align = "left",
  kind = "text",
} = {}) {
  const text = String(line ?? "");
  if (!text.trim()) return;

  const left = Math.max(PAGE.M, Math.min(x, PAGE.R - 1));
  const boxWidth = Math.max(1, Math.min(width, PAGE.R - left));

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

function hairline(doc, y, color = PDF_INK.hair, lineWidth = 0.25) {
  doc.setDrawColor(...color);
  doc.setLineWidth(lineWidth);
  doc.line(PAGE.M, y, PAGE.R, y);
}

// ===== Page chrome: the same letterhead and footer on every page =====
function drawWatermark(doc, artwork) {
  if (!artwork?.dataUrl) return;
  try {
    const GState = doc.GState || jsPDF.GState;
    if (!GState) return;
    const width = 116;
    const height = width / (artwork.ratio || 1.13);
    // Barely perceptible: light enough that it never lowers the contrast of the
    // text printed over it.
    doc.setGState(new GState({ opacity: 0.032 }));
    doc.addImage(
      artwork.dataUrl,
      "PNG",
      (PDF_PAGE.width - width) / 2,
      (PDF_PAGE.height - height) / 2,
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

function drawLetterhead(doc, artwork, { title, subtitle } = {}) {
  let placed = false;
  if (artwork?.dataUrl) {
    try {
      const height = CHROME.logoHeight;
      doc.addImage(
        artwork.dataUrl,
        "PNG",
        PAGE.M,
        CHROME.logoTop,
        height * (artwork.ratio || 1.13),
        height,
        undefined,
        "FAST"
      );
      placed = true;
    } catch (e) {
      placed = false;
    }
  }
  if (!placed) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12.5);
    doc.setTextColor(...PDF_INK.navy);
    doc.text("AMEDIX", PAGE.M, CHROME.logoTop + 7);
  }

  const heading = String(title || "CLINICAL NOTE").toUpperCase();
  doc.setFont("helvetica", "bold");
  let size = TYPE.title;
  doc.setFontSize(size);
  while (size > 7.4 && doc.getTextWidth(heading) > 92) {
    size -= 0.3;
    doc.setFontSize(size);
  }
  doc.setTextColor(...PDF_INK.navy);
  doc.text(heading, PAGE.R, CHROME.logoTop + 4.6, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(TYPE.meta);
  doc.setTextColor(...PDF_INK.muted);
  doc.text(String(subtitle || "Official Medical Document"), PAGE.R, CHROME.logoTop + 9.4, { align: "right" });

  hairline(doc, CHROME.headRule, PDF_INK.rule, 0.3);
}

function chrome(doc, ctx = {}) {
  drawWatermark(doc, ctx.artwork);
  drawLetterhead(doc, ctx.artwork, ctx);
}

// The first page of the record, already created by the caller. The first section
// heading lands a comfortable distance below the letterhead rule.
export function openNotePage(doc, ctx = {}) {
  chrome(doc, ctx);
  return PAGE.TOP - SPACE.section;
}

// Every continuation page repeats the letterhead and returns the first baseline.
export function continueNotePage(doc, ctx = {}) {
  doc.addPage();
  chrome(doc, ctx);
  return PAGE.TOP;
}

function fitFooterText(doc, text, width) {
  let value = String(text || "");
  if (!value) return "";
  if (doc.getTextWidth(value) <= width) return value;
  while (value.length > 4 && doc.getTextWidth(`${value}…`) > width) value = value.slice(0, -1);
  return `${value.trimEnd()}…`;
}

// The footer: reference at the left, the brand centred, a discreet page count at
// the right — the same on every page, carrying no clinical content.
export function drawNoteFooter(doc, reference) {
  const total = doc.getNumberOfPages();
  const current = doc.getCurrentPageInfo().pageNumber;

  for (let page = 1; page <= total; page += 1) {
    doc.setPage(page);
    hairline(doc, CHROME.footRule, PDF_INK.hair, 0.25);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(TYPE.meta);
    doc.setTextColor(...PDF_INK.muted);
    if (reference) {
      doc.text(fitFooterText(doc, `Reference: ${reference}`, 62), PAGE.M, CHROME.footText);
    }
    doc.text("AMEDIX · Connected Care. Better Health.", PDF_PAGE.width / 2, CHROME.footText, { align: "center" });
    doc.text(`Page ${page} of ${total}`, PAGE.R, CHROME.footText, { align: "right" });
  }

  doc.setPage(current);
}

// ===== Section headings =====
// One size, one weight, one colour, no letter spacing and no rule: the heading
// is set apart by the room above it and the air below it.
const headingLead = (doc) => LEAD.heading * density(doc);

export function writeSection(doc, title) {
  doc.__pendingSection = String(title || "");
  return doc.__pendingSection;
}

// Prints a pending heading together with the first block beneath it, so the two
// always land on the same page. A short block is fully reserved; a long one only
// reserves its opening lines, so a page is never left half empty.
function flushSection(doc, y, ctx, blockHeight) {
  const title = doc.__pendingSection;
  const head = doc.__pendingHead;
  doc.__sectionFlushed = false;
  if (!title && !head) return y;

  const d = density(doc);
  const lines = title ? wrap(doc, title.toUpperCase(), PAGE.W, TYPE.heading, "bold") : [];
  const headingRoom = lines.length * headingLead(doc) + SPACE.afterHeading * d;

  // A block that fits on a fresh page under its heading is reserved whole, so
  // the two always travel together; a block taller than a page only reserves its
  // opening lines, because moving it could not help.
  const room = Math.max(blockHeight || 0, 0);
  const fitsWhole = room > 0 && room <= KEEP_WHOLE;
  const reserve =
    (head ? head.height : 0) + headingRoom + SPACE.section * d + (fitsWhole ? room : Math.min(room, 30));

  let yy = y + SPACE.section * d;
  if (yy + reserve > PAGE.BOTTOM) yy = continueNotePage(doc, ctx);

  if (head) yy = drawPendingHead(doc, yy);
  if (!title) return yy;
  doc.__pendingSection = null;

  let cursor = yy;
  lines.forEach((line) => {
    writeLine(doc, line, cursor, {
      size: TYPE.heading,
      weight: "bold",
      color: PDF_INK.navy,
      kind: "heading",
    });
    cursor += headingLead(doc);
  });
  doc.__sectionFlushed = true;
  return cursor + SPACE.afterHeading * d;
}

// A group heading inside a section — the label a structured block was
// documented under, in the same navy but a step lighter than a section heading.
const captionRoom = (doc, text) =>
  String(text || "").trim()
    ? SPACE.caption * density(doc) + wrap(doc, text, PAGE.W, TYPE.caption, "bold").length * LEAD.caption * density(doc) + 0.8
    : 0;

export function writeCaption(doc, text, y, ctx) {
  const label = String(text || "").trim();
  if (!label) return y;
  const d = density(doc);
  const lead = LEAD.caption * d;
  const lines = wrap(doc, label, PAGE.W, TYPE.caption, "bold");
  let yy = y + SPACE.caption * d;
  if (yy + (lines.length - 1) * lead > PAGE.BOTTOM) yy = continueNotePage(doc, ctx);
  lines.forEach((line, index) =>
    writeLine(doc, line, yy + index * lead, {
      size: TYPE.caption,
      weight: "bold",
      color: PDF_INK.navy,
      kind: "heading",
    })
  );
  return yy + lines.length * lead + 0.8;
}

// ===== The note's title and reference =====
// The title is held back like a section heading: it is printed together with the
// first clinical section, so the head of the record is never left alone at the
// foot of a page.
function measureHead(doc, title, reference) {
  const label = String(title || "Clinical Note").trim() || "Clinical Note";
  const ref = String(reference || "").trim();
  const refWidth = ref ? Math.min(textWidth(doc, ref, TYPE.meta), PAGE.W * 0.5) : 0;
  const titleWidth = textWidth(doc, label, TYPE.title, "bold");
  const single = Boolean(ref) && titleWidth + refWidth + 10 <= PAGE.W;
  const lines = single ? [label] : wrap(doc, label, PAGE.W, TYPE.title, "bold");
  const height = single
    ? LEAD.value + 1.4 + 3.2
    : lines.length * LEAD.title + (ref ? LEAD.value + 1.2 : 0) + 3.2;
  return { label, ref, refWidth, titleWidth, single, lines, height };
}

function drawPendingHead(doc, y) {
  const head = doc.__pendingHead;
  if (!head) return y;
  doc.__pendingHead = null;

  let yy = y;
  if (head.single) {
    writeLine(doc, head.label, yy, {
      size: TYPE.title,
      weight: "bold",
      color: PDF_INK.navy,
      width: head.titleWidth,
      kind: "heading",
    });
    writeLine(doc, head.ref, yy, {
      size: TYPE.meta,
      color: PDF_INK.muted,
      x: PAGE.R - head.refWidth,
      width: head.refWidth,
      align: "right",
    });
    yy += LEAD.value + 1.4;
  } else {
    head.lines.forEach((line) => {
      writeLine(doc, line, yy, { size: TYPE.title, weight: "bold", color: PDF_INK.navy, kind: "heading" });
      yy += LEAD.title;
    });
    if (head.ref) {
      writeLine(doc, head.ref, yy, {
        size: TYPE.meta,
        color: PDF_INK.muted,
        x: PAGE.R - head.refWidth,
        width: head.refWidth,
        align: "right",
      });
      yy += LEAD.value + 1.2;
    }
  }

  hairline(doc, yy - 2.2, PDF_INK.rule, 0.25);
  return yy + 3.2;
}

export function writeDocumentHead(doc, title, reference) {
  // A section heading whose block turned out to hold nothing is dropped here
  // rather than printed above the document title.
  doc.__pendingSection = null;
  doc.__pendingHead = measureHead(doc, title, reference);
}

// Used when the record holds no clinical section at all: the head still prints.
export function flushDocumentHead(doc, y, ctx = {}) {
  if (!doc.__pendingHead) return y;
  const head = doc.__pendingHead;
  let yy = y + SPACE.section * density(doc);
  if (yy + head.height > PAGE.BOTTOM) yy = continueNotePage(doc, ctx);
  return drawPendingHead(doc, yy);
}

// A block that fits on a fresh page is moved whole; one that is taller than a
// page stays where it is and flows across the break, so a heading is never left
// stranded and no page is left half empty for content that could not fit anyway.
function startNewPageIfNeeded(doc, y, ctx, room) {
  if (room > 0 && room <= KEEP_WHOLE && y + room > PAGE.BOTTOM - 1) {
    return continueNotePage(doc, ctx);
  }
  return y;
}

// ===== One labelled record row =====
// The label in its fixed left column, its findings beside it across the full
// remaining width — the layout a long clinical description needs.
function rowMetrics(doc, label, value, { labelWidth = LABEL_W } = {}) {
  const d = density(doc);
  const lineHeight = LEAD.value * d;
  const labelLead = LEAD.label * d;

  const paragraphs = String(value ?? "")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  const valueLines = paragraphs.flatMap((line) => wrap(doc, line, valueWidth(labelWidth), TYPE.value));
  const labelLines = wrap(doc, String(label || ""), labelWidth, TYPE.label, "bold");

  return {
    valueLines,
    labelLines,
    labelWidth,
    lineHeight,
    labelLead,
    height: Math.max(valueLines.length * lineHeight, labelLines.length * labelLead),
  };
}

export function writeRow(doc, label, value, y, ctx = {}) {
  const metrics = rowMetrics(doc, label, value);
  if (metrics.valueLines.length === 0) return y;

  const d = density(doc);
  let yy = flushSection(doc, y, ctx, metrics.height);
  // When the row was already placed together with its section heading, its room
  // was reserved then — moving it now would strand the heading on the old page.
  const placedWithHeading = doc.__sectionFlushed === true;
  doc.__sectionFlushed = false;
  // A row that cannot fit whole — but is short enough to fit on a fresh page —
  // moves intact rather than leaving a stray label behind.
  if (!placedWithHeading && yy + metrics.height > PAGE.BOTTOM && metrics.height <= KEEP_WHOLE) {
    yy = continueNotePage(doc, ctx);
  }

  const valueX = PAGE.M + metrics.labelWidth + VALUE_GAP;

  metrics.labelLines.forEach((line, index) =>
    writeLine(doc, line, yy + index * metrics.labelLead, {
      size: TYPE.label,
      weight: "bold",
      color: PDF_INK.muted,
      width: metrics.labelWidth,
      kind: "label",
    })
  );

  let valueY = yy;
  let onFirstPage = true;
  metrics.valueLines.forEach((line) => {
    if (valueY > PAGE.BOTTOM - 1) {
      valueY = continueNotePage(doc, ctx);
      // A description long enough to cross a page keeps its label with it, so
      // the continued text is never left unlabelled.
      if (onFirstPage && String(label || "").trim()) {
        writeLine(doc, `${label} (continued)`, valueY, {
          size: TYPE.label,
          weight: "bold",
          color: PDF_INK.muted,
          width: metrics.labelWidth,
          kind: "label",
        });
      }
      onFirstPage = false;
    }
    writeLine(doc, line, valueY, {
      size: TYPE.value,
      x: valueX,
      width: valueWidth(metrics.labelWidth),
      align: hasArabic(line) ? "right" : "left",
    });
    valueY += metrics.lineHeight;
  });

  const bottom = Math.max(yy + metrics.labelLines.length * metrics.labelLead, valueY - metrics.lineHeight * 0.3);
  return bottom + SPACE.row * d;
}

// ===== The patient's name =====
export function writePatientName(doc, name, y, ctx = {}) {
  const label = String(name || "").trim() || "—";
  const lead = LEAD.name * density(doc);
  const lines = wrap(doc, label, PAGE.W, TYPE.name, "bold");
  let yy = flushSection(doc, y, ctx, lines.length * lead);
  lines.forEach((line) => {
    writeLine(doc, line, yy, {
      size: TYPE.name,
      weight: "bold",
      color: PDF_INK.ink,
      align: hasArabic(line) ? "right" : "left",
    });
    yy += lead;
  });
  return yy + 1.6;
}

// ===== Field grid =====
// Short answers sit two to a row on a fixed half-width column; a narrative answer
// leaves the grid and takes the full width, so it is never squeezed into a
// column. Each cell keeps its own label directly above its own answer.
function gridCell(doc, entry) {
  const width = col2Width();
  const paragraphs = String(entry.value ?? "")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (paragraphs.length > 1) return null;

  const labels = wrap(doc, entry.label, width, TYPE.label, "bold");
  const values = wrap(doc, paragraphs[0], width, TYPE.value);
  if (labels.length > 2 || values.length > 2) return null;

  return { labels, values, width };
}

// The exact height of the row writeFieldGrid will print first, so a caller that
// prints a caption above it can reserve the two together.
function gridRowRoom(doc, entries) {
  const list = (entries || []).filter((entry) => String(entry.value ?? "").trim());
  if (list.length === 0) return 0;
  if (list.length === 1) return rowMetrics(doc, list[0].label, list[0].value).height;

  const first = gridCell(doc, list[0]);
  if (!first) return rowMetrics(doc, list[0].label, list[0].value).height;
  const second = gridCell(doc, list[1]);

  const d = density(doc);
  const labelLead = LEAD.label * d;
  const valueLead = LEAD.value * d;
  const height = (cell) => cell.labels.length * labelLead + 1.3 + cell.values.length * valueLead;
  return Math.max(height(first), second ? height(second) : 0);
}

export function writeFieldGrid(doc, entries, y, ctx = {}) {
  const list = (entries || []).filter((entry) => String(entry.value ?? "").trim());
  if (list.length === 0) return y;

  // A single answer is a plain row: no lone half-width cell.
  if (list.length === 1) return writeRow(doc, list[0].label, list[0].value, y, ctx);

  const d = density(doc);
  const labelLead = LEAD.label * d;
  const valueLead = LEAD.value * d;
  const gap = SPACE.column;
  const width = col2Width();
  const cellHeight = (cell) => cell.labels.length * labelLead + 1.3 + cell.values.length * valueLead;

  // Reserve the heading's first row before either is printed.
  let yy = flushSection(doc, y, ctx, gridRowRoom(doc, list));

  let row = [];

  const flush = () => {
    if (row.length === 0) return;
    const height = Math.max(...row.map(cellHeight));
    if (yy + height > PAGE.BOTTOM - 1) yy = continueNotePage(doc, ctx);
    row.forEach((cell, column) => {
      const x = PAGE.M + column * (width + gap);
      cell.labels.forEach((line, index) =>
        writeLine(doc, line, yy + index * labelLead, {
          size: TYPE.label,
          weight: "bold",
          color: PDF_INK.muted,
          x,
          width,
          kind: "label",
        })
      );
      const base = yy + cell.labels.length * labelLead + 1.3;
      cell.values.forEach((line, index) =>
        writeLine(doc, line, base + index * valueLead, {
          size: TYPE.value,
          x,
          width,
          align: hasArabic(line) ? "right" : "left",
        })
      );
    });
    yy += height + SPACE.cellRow * d;
    row = [];
  };

  list.forEach((entry) => {
    const cell = gridCell(doc, entry);
    if (cell) {
      row.push(cell);
      if (row.length === 2) flush();
      return;
    }
    flush();
    yy = writeRow(doc, entry.label, entry.value, yy, ctx);
  });
  flush();

  return yy - SPACE.cellRow * d + SPACE.row * d;
}

// ===== Vital signs =====
// The stored summary ("Temperature: 37.2 °C · Pulse: 78 bpm · …") printed as one
// quiet grid in the order a clinician reads them.
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

export function writeVitalGrid(doc, vitals, y, ctx = {}, { caption = "" } = {}) {
  const d = density(doc);
  const perRow = 4;
  const colW = PAGE.W / perRow;
  const labelLead = LEAD.label * d;
  const valueLead = LEAD.value * d;

  const rows = [];
  for (let start = 0; start < vitals.length; start += perRow) {
    const cells = vitals.slice(start, start + perRow).map((item) => ({
      labels: wrap(doc, item.label, colW - 5, TYPE.label, "bold"),
      values: wrap(doc, item.value, colW - 5, TYPE.value),
    }));
    const labelLines = Math.max(...cells.map((cell) => cell.labels.length));
    const valueLines = Math.max(...cells.map((cell) => cell.values.length));
    rows.push({
      cells,
      labelLines,
      height: labelLines * labelLead + 1.5 + valueLines * valueLead + 2.6 * d,
    });
  }

  const unit = captionRoom(doc, caption) + (rows[0]?.height ?? 0);
  let yy = flushSection(doc, y, ctx, unit);
  yy = startNewPageIfNeeded(doc, yy, ctx, unit);
  yy = writeCaption(doc, caption, yy, ctx);

  rows.forEach(({ cells, labelLines, height }) => {
    if (yy + height > PAGE.BOTTOM - 1) yy = continueNotePage(doc, ctx);
    cells.forEach((cell, column) => {
      const x = PAGE.M + column * colW;
      cell.labels.forEach((line, index) =>
        writeLine(doc, line, yy + index * labelLead, {
          size: TYPE.label,
          weight: "bold",
          color: PDF_INK.muted,
          x,
          width: colW - 5,
          kind: "label",
        })
      );
      const base = yy + labelLines * labelLead + 1.5;
      cell.values.forEach((line, index) =>
        writeLine(doc, line, base + index * valueLead, {
          size: TYPE.value,
          x,
          width: colW - 5,
          align: hasArabic(line) ? "right" : "left",
        })
      );
    });
    yy += height;
  });

  return yy;
}

// ===== Physical examination =====
// A documented examination prints as its anatomical / system groups: a group
// heading, then that system's findings in the same two-column field grid.
export function examinationBlocks(text) {
  return String(text || "")
    .split(/\n\s*\n/)
    .map((block) => {
      const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
      const heading = lines.shift() || "";
      const items = lines
        .map((line) => {
          const clean = line.replace(/^•\s*/, "");
          const index = clean.indexOf(":");
          return index > 0 ? [clean.slice(0, index).trim(), clean.slice(index + 1).trim()] : [clean, ""];
        })
        .filter(([itemLabel, value]) => itemLabel || value)
        .map(([itemLabel, value]) => ({ label: itemLabel, value }));
      return { heading, items };
    })
    .filter((block) => block.heading || block.items.length > 0);
}

export function writeExamination(doc, text, y, ctx = {}, { label = "Examination" } = {}) {
  const raw = String(text || "").trim();
  if (!raw) return y;
  if (!/^\s*•/m.test(raw)) return writeRow(doc, label, raw, y, ctx);

  const d = density(doc);
  const blocks = examinationBlocks(raw);
  const blocksRoom = (block) =>
    captionRoom(doc, block.heading) + (block.items.length > 0 ? gridRowRoom(doc, block.items) : 0);

  const unit = captionRoom(doc, label) + blocksRoom(blocks[0]);
  let yy = flushSection(doc, y, ctx, unit);
  yy = startNewPageIfNeeded(doc, yy, ctx, unit);
  yy = writeCaption(doc, label, yy, ctx);

  blocks.forEach((block) => {
    if (!block.heading && block.items.length === 0) return;
    // A system heading keeps its first finding on the same page.
    yy = startNewPageIfNeeded(doc, yy, ctx, blocksRoom(block));
    yy = writeCaption(doc, block.heading, yy, ctx);
    if (block.items.length > 0) yy = writeFieldGrid(doc, block.items, yy, ctx);
    yy += 1.2 * d;
  });

  return yy;
}

// A labelled group of findings that must stay with its label.
export function writeSubBlock(doc, label, entries, y, ctx = {}) {
  const list = (entries || []).filter((entry) => String(entry.value ?? "").trim());
  if (list.length === 0) return y;

  const unit = captionRoom(doc, label) + gridRowRoom(doc, list);
  let yy = flushSection(doc, y, ctx, unit);
  yy = startNewPageIfNeeded(doc, yy, ctx, unit);
  yy = writeCaption(doc, label, yy, ctx);
  return writeFieldGrid(doc, list, yy, ctx);
}

// ===== Electronic signature =====
// The record closes on one clearly identifiable panel: the signing status, the
// physician who signed it, their specialty and facility, and the exact date and
// time the signature was applied — read from the record's own signing event,
// never from the moment this document was produced. A record carrying no signing
// event says so plainly instead of presenting itself as signed.
const PANEL = { h: 38, pad: 6, fill: [247, 250, 253], radius: 2, ink: [255, 255, 255] };

const fitOne = (doc, text, size, weight, width) => {
  const lines = wrap(doc, String(text ?? ""), width, size, weight);
  if (lines.length === 0) return "";
  return lines.length > 1 ? `${lines[0].replace(/[\s,·;:]+$/, "")}…` : lines[0];
};

function drawSignaturePanel(doc, opts, top) {
  const x = PAGE.M;
  const w = PAGE.W;
  const inner = PANEL.pad;
  const room = w - inner * 2;

  doc.setFillColor(...PANEL.fill);
  doc.setDrawColor(...PDF_INK.rule);
  doc.setLineWidth(0.3);
  doc.roundedRect(x, top, w, PANEL.h, PANEL.radius, PANEL.radius, "FD");

  // Status indicator — the first thing a reader looks for on the sheet.
  const signed = Boolean(opts.signed);
  const statusLabel = signed ? "ELECTRONICALLY SIGNED" : "SIGNING EVENT NOT RECORDED";
  doc.setFont("helvetica", "bold");
  doc.setFontSize(TYPE.meta);
  const pillW = doc.getTextWidth(statusLabel) + 8;
  doc.setFillColor(...(signed ? PDF_INK.navy : [140, 106, 40]));
  doc.roundedRect(x + inner, top + 4.4, pillW, 5.4, 2.7, 2.7, "F");
  writeLine(doc, statusLabel, top + 8.3, {
    size: TYPE.meta,
    weight: "bold",
    color: PANEL.ink,
    x: x + inner + 4,
    width: pillW - 8,
    kind: "label",
  });

  // The physician's own applied signature, when the record carries one.
  if (opts.image) {
    try {
      doc.addImage(String(opts.image), opts.imageFormat || "PNG", x + w - inner - 46, top + 4.6, 46, 14, undefined, "FAST");
    } catch (e) {
      // A drawn signature is decorative here — it never blocks the record.
    }
  }

  writeLine(doc, fitOne(doc, opts.doctorName || "—", 10.8, "bold", room), top + 19.4, {
    size: 10.8,
    weight: "bold",
    color: PDF_INK.ink,
    x: x + inner,
    width: room,
  });

  const affiliation = [opts.specialty, opts.hospital].filter((value) => String(value || "").trim()).join("  ·  ");
  if (affiliation) {
    writeLine(doc, fitOne(doc, affiliation, 8.3, "normal", room), top + 24.6, {
      size: 8.3,
      color: PDF_INK.navy,
      x: x + inner,
      width: room,
    });
  }

  const stamp = signed
    ? `Electronically signed ${opts.signedAt || ""}`.trim()
    : "No electronic signature is recorded for this document";
  writeLine(doc, fitOne(doc, stamp, 7.8, "normal", room), top + 29.6, {
    size: 7.8,
    color: PDF_INK.muted,
    x: x + inner,
    width: room,
  });

  const footnote = [
    signed ? "Signed in the AMedix clinical record" : "No signing event to reference",
    opts.reference ? `Reference ${opts.reference}` : "",
    "Finalized record · amendments recorded separately",
  ]
    .filter(Boolean)
    .join("  ·  ");
  writeLine(doc, fitOne(doc, footnote, TYPE.meta, "normal", room), top + 34.2, {
    size: TYPE.meta,
    color: PDF_INK.muted,
    x: x + inner,
    width: room,
    kind: "label",
  });

  return top + PANEL.h + 4;
}

export function writeSignature(doc, opts = {}, y, ctx = {}) {
  const d = density(doc);
  const caption = "Electronic Signature";
  const block = captionRoom(doc, caption) + PANEL.h + 4;

  let yy = y + 2 * d;
  if (yy + block > PAGE.BOTTOM) yy = continueNotePage(doc, ctx);
  yy = writeCaption(doc, caption, yy, ctx) + 1.2;
  return drawSignaturePanel(doc, opts, yy);
}