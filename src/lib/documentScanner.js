import { jsPDF } from "jspdf";

// AMedix document scanner engine — pure canvas/JS implementations of the
// pipeline stages used by the in-app document scanner: document edge/quad
// detection, perspective correction, readability enhancement and multi-page
// PDF assembly. Everything runs locally in the browser — a scan exists only
// in memory until the user confirms it; only the final confirmed PDF is ever
// uploaded (to private storage), so failed and retaken scans are never
// permanently stored.

const DETECT_W = 120;

function grayscaleDownscale(source, targetW) {
  const ratio = targetW / source.width;
  const w = targetW;
  const h = Math.max(2, Math.round(source.height * ratio));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(source, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h).data;
  const gray = new Float32Array(w * h);
  for (let i = 0; i < gray.length; i++) {
    const p = i * 4;
    gray[i] = 0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2];
  }
  return { gray, w, h };
}

function otsuThreshold(gray) {
  const hist = new Array(256).fill(0);
  for (let i = 0; i < gray.length; i++) {
    hist[Math.min(255, Math.max(0, Math.round(gray[i])))]++;
  }
  const total = gray.length;
  let sum = 0;
  for (let i = 0; i < 256; i++) sum += i * hist[i];
  let sumB = 0;
  let wB = 0;
  let best = 0;
  let threshold = 127;
  for (let t = 0; t < 256; t++) {
    wB += hist[t];
    if (!wB) continue;
    const wF = total - wB;
    if (!wF) break;
    sumB += t * hist[t];
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;
    const between = wB * wF * (mB - mF) * (mB - mF);
    if (between > best) {
      best = between;
      threshold = t;
    }
  }
  return threshold;
}

// Largest 4-connected component of a boolean mask — the candidate document
// region (documents are typically uniformly brighter OR darker than the
// surface behind them, so both the bright and the dark region are tried).
function largestComponent(mask, w, h) {
  const labels = new Int32Array(mask.length);
  let best = null;
  let label = 0;
  const stack = [];
  for (let i = 0; i < mask.length; i++) {
    if (!mask[i] || labels[i]) continue;
    label++;
    labels[i] = label;
    const comp = [];
    stack.push(i);
    while (stack.length) {
      const p = stack.pop();
      comp.push(p);
      const x = p % w;
      const y = (p - x) / w;
      if (x > 0 && mask[p - 1] && !labels[p - 1]) { labels[p - 1] = label; stack.push(p - 1); }
      if (x < w - 1 && mask[p + 1] && !labels[p + 1]) { labels[p + 1] = label; stack.push(p + 1); }
      if (y > 0 && mask[p - w] && !labels[p - w]) { labels[p - w] = label; stack.push(p - w); }
      if (y < h - 1 && mask[p + w] && !labels[p + w]) { labels[p + w] = label; stack.push(p + w); }
    }
    if (!best || comp.length > best.length) best = comp;
  }
  return best;
}

// The four extreme points of the component (min/max of x+y and x−y) form the
// detected document quad, ordered top-left, top-right, bottom-right, bottom-left.
function quadFromComponent(comp, w, h) {
  let tl = null, tr = null, br = null, bl = null;
  let minSum = Infinity, maxSum = -Infinity, minDiff = Infinity, maxDiff = -Infinity;
  for (const p of comp) {
    const x = p % w;
    const y = (p - x) / w;
    const sum = x + y;
    const diff = x - y;
    if (sum < minSum) { minSum = sum; tl = { x, y }; }
    if (sum > maxSum) { maxSum = sum; br = { x, y }; }
    if (diff > maxDiff) { maxDiff = diff; tr = { x, y }; }
    if (diff < minDiff) { minDiff = diff; bl = { x, y }; }
  }
  return [
    { x: tl.x / w, y: tl.y / h },
    { x: tr.x / w, y: tr.y / h },
    { x: br.x / w, y: br.y / h },
    { x: bl.x / w, y: bl.y / h },
  ];
}

function quadArea(q) {
  let a = 0;
  for (let i = 0; i < 4; i++) {
    const p = q[i];
    const n = q[(i + 1) % 4];
    a += p.x * n.y - n.x * p.y;
  }
  return Math.abs(a / 2);
}

function quadIsConvex(q) {
  let sign = 0;
  for (let i = 0; i < 4; i++) {
    const a = q[i];
    const b = q[(i + 1) % 4];
    const c = q[(i + 2) % 4];
    const cross = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x);
    if (Math.abs(cross) < 1e-9) continue;
    const s = Math.sign(cross);
    if (sign === 0) sign = s;
    else if (s !== sign) return false;
  }
  return true;
}

function validQuad(q, w, h) {
  const area = quadArea(q);
  if (area < 0.18 * w * h || area > 0.97 * w * h) return false;
  const minEdge = Math.min(
    Math.hypot(q[1].x - q[0].x, q[1].y - q[0].y),
    Math.hypot(q[2].x - q[1].x, q[2].y - q[1].y),
    Math.hypot(q[3].x - q[2].x, q[3].y - q[2].y),
    Math.hypot(q[0].x - q[3].x, q[0].y - q[3].y)
  );
  if (minEdge < 0.2) return false;
  return quadIsConvex(q);
}

function centroid(q) {
  return {
    x: q.reduce((s, p) => s + p.x, 0) / 4,
    y: q.reduce((s, p) => s + p.y, 0) / 4,
  };
}

// Detects the document in a canvas/video frame and returns its four corners
// in normalized 0..1 coordinates (TL, TR, BR, BL), or null when no
// document-like region is found.
export function detectDocumentQuad(source) {
  if (!source.width || !source.height) return null;
  const { gray, w, h } = grayscaleDownscale(source, DETECT_W);
  const thr = otsuThreshold(gray);
  const bright = new Uint8Array(gray.length);
  const dark = new Uint8Array(gray.length);
  for (let i = 0; i < gray.length; i++) {
    if (gray[i] > thr) bright[i] = 1;
    else dark[i] = 1;
  }
  const candidates = [];
  for (const comp of [largestComponent(bright, w, h), largestComponent(dark, w, h)]) {
    if (!comp) continue;
    const q = quadFromComponent(comp, w, h);
    if (validQuad(q, w, h)) candidates.push(q);
  }
  if (!candidates.length) return null;
  // When both a bright and a dark candidate are valid, the document is the
  // one more centered in the frame.
  candidates.sort(
    (a, b) =>
      Math.hypot(centroid(a).x - 0.5, centroid(a).y - 0.5) -
      Math.hypot(centroid(b).x - 0.5, centroid(b).y - 0.5)
  );
  return candidates[0];
}

// Solves the 3x3 homography (h[9], h[8]=1) mapping dst points to src points.
function solveHomography(dst, src) {
  const A = [];
  const b = [];
  for (let i = 0; i < 4; i++) {
    const { x: u, y: v } = dst[i];
    const { x, y } = src[i];
    A.push([u, v, 1, 0, 0, 0, -x * u, -x * v]);
    b.push(x);
    A.push([0, 0, 0, u, v, 1, -y * u, -y * v]);
    b.push(y);
  }
  // Gaussian elimination with partial pivoting.
  for (let col = 0; col < 8; col++) {
    let piv = col;
    for (let r = col + 1; r < 8; r++) {
      if (Math.abs(A[r][col]) > Math.abs(A[piv][col])) piv = r;
    }
    [A[col], A[piv]] = [A[piv], A[col]];
    [b[col], b[piv]] = [b[piv], b[col]];
    if (Math.abs(A[col][col]) < 1e-10) return null;
    for (let r = col + 1; r < 8; r++) {
      const f = A[r][col] / A[col][col];
      for (let c = col; c < 8; c++) A[r][c] -= f * A[col][c];
      b[r] -= f * b[col];
    }
  }
  const hvec = new Array(8);
  for (let r = 7; r >= 0; r--) {
    let s = b[r];
    for (let c = r + 1; c < 8; c++) s -= A[r][c] * hvec[c];
    hvec[r] = s / A[r][r];
  }
  return [...hvec, 1];
}

function sampleBilinear(data, w, h, x, y, out) {
  if (x < 0) x = 0;
  if (y < 0) y = 0;
  const x0 = Math.min(w - 1, x | 0);
  const y0 = Math.min(h - 1, y | 0);
  const x1 = Math.min(w - 1, x0 + 1);
  const y1 = Math.min(h - 1, y0 + 1);
  const fx = x - x0;
  const fy = y - y0;
  const i00 = (y0 * w + x0) * 4;
  const i10 = (y0 * w + x1) * 4;
  const i01 = (y1 * w + x0) * 4;
  const i11 = (y1 * w + x1) * 4;
  for (let c = 0; c < 3; c++) {
    const top = data[i00 + c] * (1 - fx) + data[i10 + c] * fx;
    const bottom = data[i01 + c] * (1 - fx) + data[i11 + c] * fx;
    out[c] = top * (1 - fy) + bottom * fy;
  }
}

// Perspective correction: warps the detected quad to a clean, upright
// rectangle — cropping the document to its detected boundaries and
// correcting rotation/skew from the camera angle.
export function warpQuad(source, quad, maxOutW = 1400) {
  const sx = source.width;
  const sy = source.height;
  const pts = quad.map((p) => ({ x: p.x * sx, y: p.y * sy }));
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const minX = Math.max(0, Math.floor(Math.min(...xs)) - 2);
  const minY = Math.max(0, Math.floor(Math.min(...ys)) - 2);
  const maxX = Math.min(sx, Math.ceil(Math.max(...xs)) + 2);
  const maxY = Math.min(sy, Math.ceil(Math.max(...ys)) + 2);
  if (maxX - minX < 8 || maxY - minY < 8) return null;
  const sctx = source.getContext("2d", { willReadFrequently: true });
  const crop = sctx.getImageData(minX, minY, maxX - minX, maxY - minY);
  const cw = crop.width;
  const ch = crop.height;
  const shifted = pts.map((p) => ({ x: p.x - minX, y: p.y - minY }));
  const topW = Math.hypot(shifted[1].x - shifted[0].x, shifted[1].y - shifted[0].y);
  const bottomW = Math.hypot(shifted[2].x - shifted[3].x, shifted[2].y - shifted[3].y);
  const leftH = Math.hypot(shifted[3].x - shifted[0].x, shifted[3].y - shifted[0].y);
  const rightH = Math.hypot(shifted[2].x - shifted[1].x, shifted[2].y - shifted[1].y);
  const width = Math.max(topW, bottomW, 1);
  const height = Math.max(leftH, rightH, 1);
  const outW = Math.round(Math.min(maxOutW, width));
  const outH = Math.max(2, Math.round(outW * (height / width)));
  const H = solveHomography(
    [{ x: 0, y: 0 }, { x: outW, y: 0 }, { x: outW, y: outH }, { x: 0, y: outH }],
    shifted
  );
  if (!H) return null;
  const out = document.createElement("canvas");
  out.width = outW;
  out.height = outH;
  const octx = out.getContext("2d", { willReadFrequently: true });
  const img = octx.createImageData(outW, outH);
  const d = img.data;
  const rgb = [0, 0, 0];
  let i = 0;
  for (let y = 0; y < outH; y++) {
    for (let x = 0; x < outW; x++) {
      const denom = H[6] * x + H[7] * y + 1;
      sampleBilinear(
        crop.data,
        cw,
        ch,
        (H[0] * x + H[1] * y + H[2]) / denom,
        (H[3] * x + H[4] * y + H[5]) / denom,
        rgb
      );
      d[i] = rgb[0];
      d[i + 1] = rgb[1];
      d[i + 2] = rgb[2];
      d[i + 3] = 255;
      i += 4;
    }
  }
  octx.putImageData(img, 0, 0);
  return out;
}

// Readability enhancement: a levels stretch built from the scan's own
// luminance histogram — the paper background comes out near-white and text
// contrast improves, while the document keeps its colors.
export function enhanceDocument(canvas) {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = img.data;
  const hist = new Array(256).fill(0);
  for (let i = 0; i < d.length; i += 4) {
    hist[Math.round(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2])]++;
  }
  const total = d.length / 4;
  const pct = (p) => {
    let acc = 0;
    for (let v = 0; v < 256; v++) {
      acc += hist[v];
      if (acc >= p * total) return v;
    }
    return 255;
  };
  const low = pct(0.02);
  const high = Math.max(low + 1, pct(0.98));
  const lut = new Uint8Array(256);
  for (let v = 0; v < 256; v++) {
    lut[v] = Math.max(0, Math.min(255, Math.round(((v - low) * 255) / (high - low))));
  }
  for (let i = 0; i < d.length; i += 4) {
    d[i] = lut[d[i]];
    d[i + 1] = lut[d[i + 1]];
    d[i + 2] = lut[d[i + 2]];
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

// Combines scanned pages (JPEG data URLs) into a single clean PDF —
// each page keeps the scan's own aspect ratio.
export async function buildPdfFromImages(pages) {
  const imgs = await Promise.all(pages.map(loadImage));
  let doc;
  imgs.forEach((img, i) => {
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    if (i === 0) {
      doc = new jsPDF({ unit: "px", format: [w, h], hotfixes: ["px_scaling"] });
    } else {
      doc.addPage([w, h]);
    }
    doc.addImage(img, "JPEG", 0, 0, w, h);
  });
  return doc.output("blob");
}

// Clear, consistent document filename: [Document]_[Patient Name]_[CIN].pdf —
// the document prefix follows the verification category; the CIN segment is
// included only when a CIN is available.
export function documentFileName(documentType, patientName, cin) {
  const PREFIXES = {
    passport: "Passport",
    personal_card: "PersonalCard",
    birth_certificate: "BirthCertificate",
  };
  const clean = (s) =>
    String(s || "")
      .trim()
      .replace(/\s+/g, "_")
      .replace(/[^\p{L}\p{N}_-]/gu, "");
  const name = clean(patientName);
  const id = clean(cin);
  return `${PREFIXES[documentType] || "Document"}_${name || "Scan"}${id ? `_${id}` : ""}.pdf`;
}