import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// TEMPORARY probe — instrument the enhancement path on a real JPEG.
export default async function (req: any) {
  createClientFromRequest(req);
  const out: any = {};
  const res = await fetch(
    'https://media.base44.com/images/public/6a9ea24b809f9bb40f0d02bf/945e71fb9_generated_image.png',
    { signal: AbortSignal.timeout(20000) }
  );
  const bytes = new Uint8Array(await res.arrayBuffer());

  try {
    const { decodeImage, enhance, renderJpeg, assessQuality, detectBands, estimateSkew, toGray } = await import(
      '../../shared/documentImageOps.ts'
    );
    const raster = await decodeImage(bytes);
    out.decode = { width: raster.width, height: raster.height, dataLength: raster.data.length };
    const g = toGray(raster);
    let sum = 0;
    for (let i = 0; i < g.gray.length; i++) sum += g.gray[i];
    out.gray = { width: g.width, height: g.height, mean: Math.round(sum / g.gray.length), length: g.gray.length };
    out.skew = estimateSkew(raster);
    out.quality = assessQuality(raster);
    out.bands = detectBands(raster).length;

    const t0 = Date.now();
    const enhanced = enhance(raster, 'enhanced');
    out.enhance = { ms: Date.now() - t0, width: enhanced.width, height: enhanced.height, grayLength: enhanced.gray.length };
    let esum = 0;
    let nan = 0;
    for (let i = 0; i < enhanced.gray.length; i++) {
      const v = enhanced.gray[i];
      if (!Number.isFinite(v)) nan++;
      else esum += v;
    }
    out.enhance.mean = Math.round(esum / Math.max(1, enhanced.gray.length));
    out.enhance.nanCount = nan;
    out.enhance.expectedLength = enhanced.width * enhanced.height;

    const jpeg = await renderJpeg(enhanced, 92);
    out.encode = { bytes: jpeg.length, head: Array.from(jpeg.slice(0, 4)).map((x) => x.toString(16)) };
    const roundtrip = await decodeImage(jpeg);
    out.roundtrip = { width: roundtrip.width, height: roundtrip.height };
  } catch (e: any) {
    out.error = String(e?.message).slice(0, 300);
    out.stack = String(e?.stack).slice(0, 400);
  }
  return Response.json(out);
}