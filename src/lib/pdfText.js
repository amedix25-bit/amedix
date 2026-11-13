import { PDF_INK } from "@/lib/requestPdfLayout";

// Arabic text cannot be printed with the PDF's built-in fonts: they carry no
// Arabic glyphs and no letter joining, so the text would come out as boxes.
// A line that contains Arabic is therefore laid out, shaped and reordered by
// the browser's own text engine on a canvas and placed in the document as a
// small, sharp image — so an Arabic paragraph prints exactly as it reads on
// screen. Latin-only lines keep being real, selectable PDF text.
const ARABIC = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
const RTL_START = /^[\s\d.)\-–]*[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/;

export function hasArabic(text) {
  return ARABIC.test(String(text ?? ""));
}

const PX_PER_MM = 9; // ≈230 dpi — sharp in print, still a light document
const FAMILY = `"Geist", "Noto Sans Arabic", "Segoe UI", Tahoma, Arial, sans-serif`;
const PT_TO_MM = 0.352778;

let measurerCtx = null;

function measurer() {
  if (!measurerCtx) measurerCtx = document.createElement("canvas").getContext("2d");
  return measurerCtx;
}

function fontSpec(size, weight) {
  const px = (Number(size) || 10) * PT_TO_MM * PX_PER_MM;
  return `${weight === "bold" ? 700 : 400} ${px.toFixed(2)}px ${FAMILY}`;
}

// Width of Arabic text in millimetres, measured with the same engine that draws it.
export function arabicWidth(text, size, weight = "normal") {
  const ctx = measurer();
  ctx.font = fontSpec(size, weight);
  return ctx.measureText(String(text || "")).width / PX_PER_MM;
}

// Wraps Arabic text on spaces to the given millimetre width, so no line runs
// past the page edge.
export function wrapArabicText(text, maxWidth, size, weight = "normal") {
  const words = String(text || "")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);
  const lines = [];
  let line = "";
  words.forEach((word) => {
    const candidate = line ? `${line} ${word}` : word;
    if (line && arabicWidth(candidate, size, weight) > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  });
  if (line) lines.push(line);
  return lines;
}

// Draws one Arabic (or mixed Arabic/Latin) line with its baseline at `y`.
// A line that reads right-to-left is aligned to the right of `x + width`.
export function drawArabicLine(
  doc,
  line,
  x,
  y,
  { size = 9.4, weight = "normal", color = PDF_INK.ink, width = 0, align = "left" } = {}
) {
  const value = String(line || "");
  if (!value.trim()) return;
  const font = fontSpec(size, weight);
  const px = (Number(size) || 10) * PT_TO_MM * PX_PER_MM;
  const probe = measurer();
  probe.font = font;
  const textWidth = Math.ceil(probe.measureText(value).width);
  const pad = 2;
  const baseline = Math.ceil(px * 1.06);

  const canvas = document.createElement("canvas");
  canvas.width = textWidth + pad * 2;
  canvas.height = Math.ceil(px * 1.42);
  const ctx = canvas.getContext("2d");
  ctx.font = font;
  ctx.fillStyle = `rgb(${color.join(", ")})`;
  ctx.textBaseline = "alphabetic";
  ctx.fillText(value, pad, baseline);

  const w = canvas.width / PX_PER_MM;
  const h = canvas.height / PX_PER_MM;
  const rightAligned = align === "right" || (width > 0 && RTL_START.test(value));
  const left = rightAligned && width > 0 ? x + width - w : x;
  doc.addImage(canvas.toDataURL("image/png"), "PNG", left, y - baseline / PX_PER_MM, w, h, undefined, "FAST");
}