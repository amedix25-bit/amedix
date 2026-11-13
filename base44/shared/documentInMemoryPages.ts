// AMedix in-memory document preparation.
//
// The submitted document is decoded from base64, measured, rectified and turned
// into the images the recognisers read — all inside the request. Not one byte is
// written anywhere: no upload, no temporary file, no render on storage, no cache.
// The rasters and their JPEG renditions are released when the request ends.

import {
  decodeImage, decodeDocument, toGray, encodeJpeg, enhance, renderJpeg,
  assessQuality, detectBands, estimateSkew, blankCheck,
  type Raster, type EnhanceResult,
} from './documentImageOps.ts';
import { base64ToBytes, bytesToBase64 } from './inlineVision.ts';
import type { Side } from './documentOcrEngine.ts';

export type InlinePage = { mime: string; base64: string };

export type PreparedAnalysis = {
  quality: ReturnType<typeof assessQuality>;
  skew: number;
  bands: ReturnType<typeof detectBands>;
  pages_decoded: number;
};

export type PreparedDocument = {
  reason: '' | 'undecodable' | 'blank';
  sides: Side[];
  analysis: PreparedAnalysis | null;
};

// Sized for legibility of small printed digits, not for archiving: every byte
// travels inside a model request, so a needlessly large rendition only adds
// latency and can push a pass past its timeout.
const ORIGINAL_MAX_WIDTH = 1600;
const RECTIFIED_MAX_WIDTH = 1700;
const JPEG_QUALITY = 85;

export async function prepareInMemoryDocument(pages: InlinePage[]): Promise<PreparedDocument> {
  const empty: PreparedDocument = { reason: 'undecodable', sides: [], analysis: null };

  const rasters: Raster[] = [];
  try {
    for (const page of pages) {
      const bytes = base64ToBytes(page.base64);
      if (page.mime === 'application/pdf') {
        const decoded = await decodeDocument(bytes);
        rasters.push(...decoded.slice(0, 2));
      } else {
        rasters.push(await decodeImage(bytes));
      }
    }
  } catch {
    return empty;
  }
  if (!rasters.length) return empty;

  // A page that arrived empty is refused before anything is sent to a recogniser.
  const usable = rasters.filter((raster) => !blankCheck(raster).blank);
  if (!usable.length) return { reason: 'blank', sides: [], analysis: null };

  const first = usable[0];
  const analysis: PreparedAnalysis = {
    quality: assessQuality(first),
    skew: estimateSkew(first),
    bands: detectBands(first),
    pages_decoded: rasters.length,
  };

  const sides: Side[] = [];
  for (let i = 0; i < usable.length && i < 2; i += 1) {
    const raster = usable[i];
    const original = toGray(raster, ORIGINAL_MAX_WIDTH);
    const originalJpeg = await encodeJpeg(original.gray, original.width, original.height, JPEG_QUALITY);
    const rectified: EnhanceResult = enhance(raster, 'enhanced', RECTIFIED_MAX_WIDTH);
    const rectifiedJpeg = await renderJpeg(rectified, JPEG_QUALITY);
    sides.push({
      side: i === 0 ? 'front' : 'back',
      original: { mime: 'image/jpeg', base64: bytesToBase64(originalJpeg) },
      enhanced: { mime: 'image/jpeg', base64: bytesToBase64(rectifiedJpeg) },
    });
  }

  return { reason: '', sides, analysis };
}