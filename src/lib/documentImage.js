import { buildPdfFromImages } from "@/lib/documentScanner";

// Client-side preparation of identity documents: decode (JPG / PNG / HEIC
// where the browser supports it), resize and compress to a readable scan,
// rotate, judge quality, and assemble the pages into one PDF. Everything runs
// on the device — the file only leaves it when the user confirms.

export const IMAGE_ACCEPT = "image/*,.heic,.heif";
export const PDF_ACCEPT = "application/pdf,.pdf";
export const MAX_PDF_BYTES = 25 * 1024 * 1024;
export const MAX_IMAGE_BYTES = 30 * 1024 * 1024;
const MAX_EDGE = 2400;
const MIN_EDGE = 500;

export const isPdfFile = (file) => !!file && (file.type === "application/pdf" || /\.pdf$/i.test(file.name));

export function fileSizeLabel(bytes) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("unsupported_image"));
    img.src = src;
  });
}

// Sharpness + brightness on a small grayscale copy. Blur is the average
// difference between neighbouring pixels: a readable document photo has clear
// edges, a blurred one does not.
export function assessCanvas(canvas) {
  const w = Math.min(180, canvas.width);
  const h = Math.max(2, Math.round((canvas.height * w) / canvas.width));
  const work = document.createElement("canvas");
  work.width = w;
  work.height = h;
  const ctx = work.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(canvas, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h).data;
  const gray = new Float32Array(w * h);
  for (let i = 0; i < gray.length; i++) {
    const p = i * 4;
    gray[i] = 0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2];
  }
  let sum = 0;
  for (let i = 0; i < gray.length; i++) sum += gray[i];
  const brightness = sum / gray.length;
  let diff = 0;
  let count = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 1; x < w; x++) {
      diff += Math.abs(gray[y * w + x] - gray[y * w + x - 1]);
      count++;
    }
  }
  const sharpness = count ? diff / count : 0;
  return {
    blurry: sharpness < 4,
    dark: brightness < 45,
    tooSmall: Math.min(canvas.width, canvas.height) < MIN_EDGE,
  };
}

// Reads an image file (including HEIC where the browser can decode it) and
// produces a JPEG sized for the document to stay readable, without ever
// upscaling it.
export async function prepareImageFile(file) {
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("too_large");
  }
  const objectUrl = URL.createObjectURL(file);
  let img;
  try {
    img = await loadImage(objectUrl);
  } catch (err) {
    URL.revokeObjectURL(objectUrl);
    throw new Error("unsupported_image");
  }
  const scale = Math.min(1, MAX_EDGE / Math.max(img.naturalWidth || 1, img.naturalHeight || 1));
  const width = Math.max(2, Math.round((img.naturalWidth || 1) * scale));
  const height = Math.max(2, Math.round((img.naturalHeight || 1) * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);
  URL.revokeObjectURL(objectUrl);
  const quality = assessCanvas(canvas);
  return {
    dataUrl: canvas.toDataURL("image/jpeg", 0.9),
    width,
    height,
    quality,
  };
}

// Rotates a prepared page, returning a new data URL.
export async function rotateImageDataUrl(dataUrl, degrees) {
  const img = await loadImage(dataUrl);
  const swap = Math.abs(degrees) % 180 === 90;
  const canvas = document.createElement("canvas");
  canvas.width = swap ? img.naturalHeight : img.naturalWidth;
  canvas.height = swap ? img.naturalWidth : img.naturalHeight;
  const ctx = canvas.getContext("2d");
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((degrees * Math.PI) / 180);
  ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
  return canvas.toDataURL("image/jpeg", 0.9);
}

// Combines the reviewed pages into one PDF — the format the verification
// process stores. The original image is kept alongside it.
export async function pagesToPdf(pages) {
  return buildPdfFromImages(pages.map((p) => p.dataUrl));
}

export function downloadDataUrl(dataUrl, fileName) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
}