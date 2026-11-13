// AMedix document imaging — server-side pixel processing for the identity reader.
//
// Everything here runs inside the backend functions on raw pixels decoded in
// memory: JPEG/PNG decode (pure JavaScript), orientation and skew estimation,
// shadow and glare flattening, local contrast (CLAHE), unsharp masking,
// Lanczos-3 upscaling and Sauvola binarisation.
//
// No derivative of a document is ever written to storage: an enhanced render is
// produced, served straight to the recognition model and dropped.

export type Raster = { width: number; height: number; data: Uint8ClampedArray };
export type Gray = { gray: Float32Array; width: number; height: number };
export type Band = { y0: number; y1: number; x0: number; x1: number; heightPct: number; score: number };

const PNG_SIG = [137, 80, 78, 71];

export function isPng(bytes: Uint8Array): boolean {
  return PNG_SIG.every((b, i) => bytes[i] === b);
}

export async function decodeImage(bytes: Uint8Array): Promise<Raster> {
  if (isPng(bytes)) {
    const mod: any = await import('npm:fast-png@6.2.0');
    const decode = mod.decode || (mod.default && mod.default.decode);
    const img: any = decode(bytes);
    const { width, height, channels, data } = img;
    const out = new Uint8ClampedArray(width * height * 4);
    for (let i = 0, p = 0; i < width * height; i++, p += channels) {
      const r = data[p];
      const g = channels > 1 ? data[p + 1] : r;
      const b = channels > 2 ? data[p + 2] : r;
      const a = channels === 4 ? data[p + 3] : 255;
      const o = i * 4;
      out[o] = r; out[o + 1] = g; out[o + 2] = b; out[o + 3] = a;
    }
    return { width, height, data: out };
  }
  const mod: any = await import('npm:jpeg-js@0.4.4');
  const decode = mod.decode || (mod.default && mod.default.decode);
  const img: any = decode(bytes, { useTArray: true });
  return { width: img.width, height: img.height, data: new Uint8ClampedArray(img.data) };
}

export async function encodeJpeg(graySource: Float32Array, width: number, height: number, quality = 92): Promise<Uint8Array> {
  const mod: any = await import('npm:jpeg-js@0.4.4');
  const encode = mod.encode || (mod.default && mod.default.encode);
  const rgba = new Uint8Array(width * height * 4);
  for (let i = 0, o = 0; i < graySource.length; i++, o += 4) {
    const v = graySource[i] < 0 ? 0 : graySource[i] > 255 ? 255 : graySource[i];
    rgba[o] = v; rgba[o + 1] = v; rgba[o + 2] = v; rgba[o + 3] = 255;
  }
  const res: any = encode({ data: rgba, width, height }, quality);
  return new Uint8Array(res.data);
}

// ---- basic luminance + filters --------------------------------------------

export function toGray(raster: Raster, maxWidth = 0): Gray {
  const scale = maxWidth && raster.width > maxWidth ? maxWidth / raster.width : 1;
  const w = Math.max(1, Math.round(raster.width * scale));
  const h = Math.max(1, Math.round(raster.height * scale));
  const gray = new Float32Array(w * h);
  if (scale === 1) {
    for (let i = 0, o = 0; i < w * h; i++, o += 4) {
      gray[i] = 0.299 * raster.data[o] + 0.587 * raster.data[o + 1] + 0.114 * raster.data[o + 2];
    }
    return { gray, width: w, height: h };
  }
  const xRatio = raster.width / w;
  const yRatio = raster.height / h;
  for (let y = 0; y < h; y++) {
    const sy0 = Math.floor(y * yRatio);
    const sy1 = Math.min(raster.height, Math.max(sy0 + 1, Math.floor((y + 1) * yRatio)));
    for (let x = 0; x < w; x++) {
      const sx0 = Math.floor(x * xRatio);
      const sx1 = Math.min(raster.width, Math.max(sx0 + 1, Math.floor((x + 1) * xRatio)));
      let sum = 0;
      let n = 0;
      for (let sy = sy0; sy < sy1; sy++) {
        for (let sx = sx0; sx < sx1; sx++) {
          const o = (sy * raster.width + sx) * 4;
          sum += 0.299 * raster.data[o] + 0.587 * raster.data[o + 1] + 0.114 * raster.data[o + 2];
          n++;
        }
      }
      gray[y * w + x] = n ? sum / n : 0;
    }
  }
  return { gray, width: w, height: h };
}

export function boxBlur(src: Float32Array, w: number, h: number, radius: number): Float32Array {
  if (radius < 1) return src.slice();
  const integral = new Float64Array((w + 1) * (h + 1));
  for (let y = 0; y < h; y++) {
    let rowSum = 0;
    for (let x = 0; x < w; x++) {
      rowSum += src[y * w + x];
      integral[(y + 1) * (w + 1) + (x + 1)] = integral[y * (w + 1) + (x + 1)] + rowSum;
    }
  }
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    const y0 = Math.max(0, y - radius);
    const y1 = Math.min(h - 1, y + radius);
    for (let x = 0; x < w; x++) {
      const x0 = Math.max(0, x - radius);
      const x1 = Math.min(w - 1, x + radius);
      const a = integral[(y1 + 1) * (w + 1) + (x1 + 1)];
      const b = integral[y0 * (w + 1) + (x1 + 1)];
      const c = integral[(y1 + 1) * (w + 1) + x0];
      const d = integral[y0 * (w + 1) + x0];
      out[y * w + x] = (a - b - c + d) / ((y1 - y0 + 1) * (x1 - x0 + 1));
    }
  }
  return out;
}

function percentile(sorted: Float32Array, p: number): number {
  if (!sorted.length) return 0;
  const i = Math.min(sorted.length - 1, Math.max(0, Math.round((p / 100) * (sorted.length - 1))));
  return sorted[i];
}

// ---- quality assessment ----------------------------------------------------

export function assessQuality(raster: Raster) {
  const { gray, width, height } = toGray(raster, 900);
  const sorted = Float32Array.from(gray).sort();
  const p5 = percentile(sorted, 5);
  const p95 = percentile(sorted, 95);
  let glare = 0;
  let total = 0;
  for (let i = 0; i < gray.length; i++) { if (gray[i] >= 250) glare++; total += gray[i]; }
  let lapSum = 0;
  let lapSq = 0;
  let count = 0;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      const lap = 4 * gray[i] - gray[i - 1] - gray[i + 1] - gray[i - width] - gray[i + width];
      lapSum += lap;
      lapSq += lap * lap;
      count++;
    }
  }
  const lapMean = count ? lapSum / count : 0;
  const sharpness = count ? lapSq / count - lapMean * lapMean : 0;
  return {
    pixel_width: raster.width,
    pixel_height: raster.height,
    brightness: Math.round(total / gray.length),
    contrast: Math.round(p95 - p5),
    sharpness: Math.round(sharpness),
    glare_fraction: Number((glare / gray.length).toFixed(3)),
  };
}

// ---- orientation / skew ----------------------------------------------------

function projectionScore(gray: Float32Array, w: number, h: number, degrees: number): number {
  const rad = (degrees * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const rows = new Float32Array(h);
  const cx = w / 2;
  const cy = h / 2;
  for (let y = 1; y < h - 1; y += 2) {
    for (let x = 1; x < w - 1; x += 2) {
      const dx = x - cx;
      const dy = y - cy;
      const sx = Math.round(cx + dx * cos - dy * sin);
      const sy = Math.round(cy + dx * sin + dy * cos);
      if (sx < 1 || sy < 1 || sx >= w - 1 || sy >= h - 1) continue;
      const i = sy * w + sx;
      rows[sy] += Math.abs(gray[i + 1] - gray[i - 1]) + Math.abs(gray[i + w] - gray[i - w]);
    }
  }
  let mean = 0;
  for (let i = 0; i < h; i++) mean += rows[i];
  mean /= h;
  let variance = 0;
  for (let i = 0; i < h; i++) variance += (rows[i] - mean) * (rows[i] - mean);
  return variance / h;
}

export function estimateSkew(raster: Raster): number {
  const { gray, width, height } = toGray(raster, 480);
  let best = 0;
  let bestScore = -1;
  for (let deg = -8; deg <= 8; deg += 1) {
    const score = projectionScore(gray, width, height, deg);
    if (score > bestScore) { bestScore = score; best = deg; }
  }
  for (const deg of [best - 0.5, best + 0.5]) {
    const score = projectionScore(gray, width, height, deg);
    if (score > bestScore) { bestScore = score; best = deg; }
  }
  return best;
}

export function rotateGray(src: Float32Array, w: number, h: number, degrees: number): Gray {
  if (!degrees) return { gray: src.slice(), width: w, height: h };
  const rad = (-degrees * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const out = new Float32Array(w * h);
  const cx = w / 2;
  const cy = h / 2;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const sx = cx + dx * cos - dy * sin;
      const sy = cy + dx * sin + dy * cos;
      if (sx < 0 || sy < 0 || sx >= w - 1 || sy >= h - 1) { out[y * w + x] = 255; continue; }
      const x0 = Math.floor(sx);
      const y0 = Math.floor(sy);
      const fx = sx - x0;
      const fy = sy - y0;
      const i = y0 * w + x0;
      out[y * w + x] =
        src[i] * (1 - fx) * (1 - fy) + src[i + 1] * fx * (1 - fy) +
        src[i + w] * (1 - fx) * fy + src[i + w + 1] * fx * fy;
    }
  }
  return { gray: out, width: w, height: h };
}

// ---- text-band localisation ------------------------------------------------

export function detectBands(raster: Raster): Band[] {
  const { gray, width, height } = toGray(raster, 1000);
  const rowEnergy = new Float32Array(height);
  const colEnergy = new Float32Array(width);
  for (let y = 1; y < height - 1; y++) {
    let rowSum = 0;
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      const mag = Math.abs(gray[i + 1] - gray[i - 1]) + Math.abs(gray[i + width] - gray[i - width]);
      rowSum += mag;
      colEnergy[x] += mag;
    }
    rowEnergy[y] = rowSum / width;
  }
  const smooth = boxBlur(rowEnergy, width, 1, 2);
  let mean = 0;
  for (let i = 0; i < height; i++) mean += smooth[i];
  mean /= height;
  const threshold = mean * 1.6;
  let colMean = 0;
  for (let x = 0; x < width; x++) colMean += colEnergy[x];
  colMean /= width;
  const bands: Band[] = [];
  let start = -1;
  for (let y = 0; y <= height; y++) {
    const hot = y < height && smooth[y] > threshold;
    if (hot && start < 0) start = y;
    if (!hot && start >= 0) {
      const y0 = start;
      const y1 = y - 1;
      start = -1;
      const bandHeight = y1 - y0 + 1;
      if (bandHeight < Math.max(3, height * 0.008) || bandHeight > height * 0.35) continue;
      let xFirst = -1;
      let xLast = -1;
      for (let x = 1; x < width - 1; x++) {
        if (colEnergy[x] > colMean * 1.2) {
          if (xFirst < 0) xFirst = x;
          xLast = x;
        }
      }
      if (xFirst < 0 || xLast <= xFirst) continue;
      let edge = 0;
      for (let yy = y0; yy <= y1; yy++) edge += smooth[yy];
      const edgeDensity = edge / bandHeight;
      const heightPct = (bandHeight / height) * 100;
      bands.push({
        y0: Number((y0 / height).toFixed(3)),
        y1: Number((y1 / height).toFixed(3)),
        x0: Number((xFirst / width).toFixed(3)),
        x1: Number((xLast / width).toFixed(3)),
        heightPct: Number(heightPct.toFixed(2)),
        score: Number((edgeDensity * Math.min(1, heightPct / 4)).toFixed(1)),
      });
    }
  }
  return bands.sort((a, b) => b.score - a.score).slice(0, 8);
}

// ---- enhancement -----------------------------------------------------------

function clahe(gray: Float32Array, w: number, h: number, tiles = 8, clip = 2.5): Float32Array {
  const tileW = Math.ceil(w / tiles);
  const tileH = Math.ceil(h / tiles);
  const maps: Uint8Array[] = [];
  for (let ty = 0; ty < tiles; ty++) {
    for (let tx = 0; tx < tiles; tx++) {
      const hist = new Float32Array(256);
      let n = 0;
      for (let y = ty * tileH; y < Math.min(h, (ty + 1) * tileH); y++) {
        for (let x = tx * tileW; x < Math.min(w, (tx + 1) * tileW); x++) {
          hist[Math.max(0, Math.min(255, Math.round(gray[y * w + x])))]++;
          n++;
        }
      }
      const limit = n ? (clip * n) / 256 : 0;
      let excess = 0;
      for (let i = 0; i < 256; i++) {
        if (hist[i] > limit) { excess += hist[i] - limit; hist[i] = limit; }
      }
      const spread = n ? excess / 256 : 0;
      const map = new Uint8Array(256);
      let acc = 0;
      for (let i = 0; i < 256; i++) {
        acc += hist[i] + spread;
        map[i] = Math.max(0, Math.min(255, Math.round((acc / Math.max(1, n)) * 255)));
      }
      maps.push(map);
    }
  }
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const fx = (x / w) * tiles - 0.5;
      const fy = (y / h) * tiles - 0.5;
      const tx0 = Math.max(0, Math.min(tiles - 1, Math.floor(fx)));
      const ty0 = Math.max(0, Math.min(tiles - 1, Math.floor(fy)));
      const tx1 = Math.min(tiles - 1, tx0 + 1);
      const ty1 = Math.min(tiles - 1, ty0 + 1);
      const ax = Math.max(0, Math.min(1, fx - tx0));
      const ay = Math.max(0, Math.min(1, fy - ty0));
      const v = Math.max(0, Math.min(255, Math.round(gray[y * w + x])));
      const v00 = maps[ty0 * tiles + tx0][v];
      const v10 = maps[ty0 * tiles + tx1][v];
      const v01 = maps[ty1 * tiles + tx0][v];
      const v11 = maps[ty1 * tiles + tx1][v];
      out[y * w + x] = (v00 * (1 - ax) + v10 * ax) * (1 - ay) + (v01 * (1 - ax) + v11 * ax) * ay;
    }
  }
  return out;
}

function lanczos3(x: number): number {
  if (x === 0) return 1;
  if (x <= -3 || x >= 3) return 0;
  const px = Math.PI * x;
  return (3 * Math.sin(px) * Math.sin(px / 3)) / (px * px);
}

export function resizeGray(src: Float32Array, sw: number, sh: number, dw: number, dh: number): Float32Array {
  const xRatio = sw / dw;
  const yRatio = sh / dh;
  const tmp = new Float32Array(dw * sh);
  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < dw; x++) {
      const center = (x + 0.5) * xRatio - 0.5;
      let sum = 0;
      let weight = 0;
      const start = Math.max(0, Math.floor(center) - 2);
      const end = Math.min(sw - 1, Math.floor(center) + 3);
      for (let sx = start; sx <= end; sx++) {
        const wgt = lanczos3(center - sx);
        sum += src[y * sw + sx] * wgt;
        weight += wgt;
      }
      tmp[y * dw + x] = weight ? sum / weight : src[y * sw + Math.max(0, Math.min(sw - 1, Math.round(center)))];
    }
  }
  const out = new Float32Array(dw * dh);
  for (let y = 0; y < dh; y++) {
    for (let x = 0; x < dw; x++) {
      const center = (y + 0.5) * yRatio - 0.5;
      let sum = 0;
      let weight = 0;
      const start = Math.max(0, Math.floor(center) - 2);
      const end = Math.min(sh - 1, Math.floor(center) + 3);
      for (let sy = start; sy <= end; sy++) {
        const wgt = lanczos3(center - sy);
        sum += tmp[sy * dw + x] * wgt;
        weight += wgt;
      }
      out[y * dw + x] = weight ? sum / weight : tmp[Math.max(0, Math.min(sh - 1, Math.round(center))) * dw + x];
    }
  }
  return out;
}

function flattenLighting(gray: Float32Array, w: number, h: number): Float32Array {
  const radius = Math.max(8, Math.round(Math.max(w, h) / 40));
  const background = boxBlur(gray, w, h, radius);
  const out = new Float32Array(w * h);
  for (let i = 0; i < gray.length; i++) {
    const bg = background[i] < 12 ? 12 : background[i];
    out[i] = Math.max(0, Math.min(255, (gray[i] / bg) * 190));
  }
  return out;
}

function unsharp(gray: Float32Array, w: number, h: number, amount = 1.15): Float32Array {
  const blurred = boxBlur(gray, w, h, 1);
  const out = new Float32Array(gray.length);
  for (let i = 0; i < gray.length; i++) {
    out[i] = Math.max(0, Math.min(255, gray[i] + amount * (gray[i] - blurred[i])));
  }
  return out;
}

export function sauvola(gray: Float32Array, w: number, h: number, window = 15, k = 0.2): Float32Array {
  const radius = Math.max(1, Math.floor(window / 2));
  const mean = boxBlur(gray, w, h, radius);
  const squares = new Float32Array(gray.length);
  for (let i = 0; i < gray.length; i++) squares[i] = gray[i] * gray[i];
  const meanSq = boxBlur(squares, w, h, radius);
  const out = new Float32Array(gray.length);
  for (let i = 0; i < gray.length; i++) {
    const std = Math.sqrt(Math.max(0, meanSq[i] - mean[i] * mean[i]));
    const t = mean[i] * (1 + k * (std / 128 - 1));
    out[i] = gray[i] > t ? 255 : 0;
  }
  return out;
}

export type EnhanceMode = 'enhanced' | 'binary';
export type EnhanceResult = { width: number; height: number; gray: Float32Array; skew: number; scale: number };

// Full pipeline: deskew → flatten lighting → local contrast → sharpen → upscale.
export function enhance(raster: Raster, mode: EnhanceMode = 'enhanced', targetWidth = 2200): EnhanceResult {
  const working = toGray(raster, 2600);
  const skew = estimateSkew(raster);
  const straightened = rotateGray(working.gray, working.width, working.height, skew);
  const flat = flattenLighting(straightened.gray, straightened.width, straightened.height);
  const local = clahe(flat, straightened.width, straightened.height, 8, 2.5);
  const sharpened = unsharp(local, straightened.width, straightened.height, mode === 'binary' ? 1.4 : 1.15);
  const sourceW = straightened.width;
  const sourceH = straightened.height;
  const scale = sourceW >= targetWidth ? 1 : Math.min(2.5, targetWidth / sourceW);
  const outW = Math.round(sourceW * scale);
  const outH = Math.round(sourceH * scale);
  const scaled = scale === 1 ? sharpened : resizeGray(sharpened, sourceW, sourceH, outW, outH);
  const final = mode === 'binary' ? sauvola(scaled, outW, outH, Math.max(15, Math.round(outW / 60)), 0.2) : scaled;
  return { width: outW, height: outH, gray: final, skew: Number(skew.toFixed(2)), scale: Number(scale.toFixed(2)) };
}

export function renderJpeg(result: EnhanceResult, quality = 92): Promise<Uint8Array> {
  return encodeJpeg(result.gray, result.width, result.height, quality);
}

// ---- document containers ---------------------------------------------------
//
// The scanner uploads a PDF whose pages are JPEG images, so the page pixels have
// to be taken out of the container before they can be processed. A plain image
// upload is decoded directly.

export function findJpegStreams(bytes: Uint8Array): Uint8Array[] {
  const streams: Uint8Array[] = [];
  const limit = Math.min(bytes.length - 3, 40 * 1024 * 1024);
  for (let i = 0; i < limit; i++) {
    if (bytes[i] === 0xff && bytes[i + 1] === 0xd8 && bytes[i + 2] === 0xff) {
      let end = i + 2;
      while (end + 1 < bytes.length && !(bytes[end] === 0xff && bytes[end + 1] === 0xd9)) end++;
      if (end + 1 < bytes.length) {
        const candidate = bytes.slice(i, end + 2);
        if (candidate.length > 2048) streams.push(candidate);
        i = end + 1;
      }
    }
  }
  return streams;
}

export async function decodeDocument(bytes: Uint8Array): Promise<Raster[]> {
  const head = bytes.length > 3 ? bytes : new Uint8Array(0);
  if (isPng(head) || (head[0] === 0xff && head[1] === 0xd8)) {
    try {
      return [await decodeImage(head)];
    } catch {
      return [];
    }
  }
  const pages: Raster[] = [];
  for (const stream of findJpegStreams(bytes).slice(0, 4)) {
    try {
      pages.push(await decodeImage(stream));
    } catch {
      // an embedded thumbnail or an unsupported codec is simply skipped
    }
  }
  return pages;
}

// Stacks the processed pages into one picture so a single read sees both sides
// of a two-sided document.
export function composePages(
  pages: { gray: Float32Array; width: number; height: number }[],
  gap = 24
): { gray: Float32Array; width: number; height: number } {
  if (!pages.length) return { gray: new Float32Array(0), width: 0, height: 0 };
  if (pages.length === 1) return pages[0];
  const width = Math.max(...pages.map((p) => p.width));
  const scaled = pages.map((p) => {
    if (p.width === width) return p;
    const height = Math.round((p.height * width) / p.width);
    return { gray: resizeGray(p.gray, p.width, p.height, width, height), width, height };
  });
  const height = scaled.reduce((sum, p) => sum + p.height, 0) + gap * (scaled.length - 1);
  const out = new Float32Array(width * height).fill(255);
  let offset = 0;
  for (const page of scaled) {
    out.set(page.gray, offset * width);
    offset += page.height + gap;
  }
  return { gray: out, width, height };
}