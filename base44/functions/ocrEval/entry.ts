import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { recogniseDocument } from '../../shared/documentOcrEngine.ts';
import { createRenderToken } from '../../shared/documentRenderToken.ts';
import { decodeImage, enhance, renderJpeg, assessQuality, detectBands, isPng } from '../../shared/documentImageOps.ts';

// TEMPORARY evaluation harness for the recognition upgrade.
export default async function (req: any) {
  const base44 = createClientFromRequest(req);
  const body = await req.json().catch(() => ({}));
  const cases: any[] = Array.isArray(body.cases) ? body.cases : [];
  const results: any[] = [];

  for (const testCase of cases) {
    const started = Date.now();
    try {
      const source = await fetch(testCase.url, { signal: AbortSignal.timeout(20000) });
      const bytes = new Uint8Array(await source.arrayBuffer());
      const file = new File([bytes], `${testCase.key}.png`, { type: 'image/png' });
      const uploaded: any = await base44.asServiceRole.integrations.Core.UploadPrivateFile({ file });
      const signed: any = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({
        file_uri: uploaded.file_uri, expires_in: 300,
      });

      // pre-processing latency, measured in isolation
      let preprocessMs = 0;
      let quality: any = null;
      let bandCount = 0;
      let renderedBytes = 0;
      if (isPng(bytes)) {
        const t0 = Date.now();
        const raster = await decodeImage(bytes);
        const enhanced = enhance(raster, 'enhanced');
        const jpeg = await renderJpeg(enhanced, 92);
        preprocessMs = Date.now() - t0;
        renderedBytes = jpeg.length;
        quality = assessQuality(raster);
        bandCount = detectBands(raster).length;
      }

      const enhancedToken = await createRenderToken(signed.signed_url, 'enhanced');
      const binaryToken = await createRenderToken(signed.signed_url, 'binary');
      const side = {
        side: 'front' as const,
        url: signed.signed_url,
        enhancedUrl: `https://amedix.base44.app/functions/documentRender?t=${encodeURIComponent(enhancedToken)}`,
        binaryUrl: `https://amedix.base44.app/functions/documentRender?t=${encodeURIComponent(binaryToken)}`,
      };

      // does the renderer actually serve an enhanced picture?
      let renderCheck: any = null;
      try {
        const rendered = await fetch(side.enhancedUrl, { method: 'GET', signal: AbortSignal.timeout(20000) });
        const renderedData = new Uint8Array(await rendered.arrayBuffer());
        let dims: any = null;
        try {
          const decoded = await decodeImage(renderedData);
          dims = { width: decoded.width, height: decoded.height };
        } catch { dims = null; }
        renderCheck = { status: rendered.status, type: rendered.headers.get('content-type'), bytes: renderedData.length, dims };
      } catch (e: any) {
        renderCheck = { error: String(e?.message).slice(0, 120) };
      }

      const diagnosis = await recogniseDocument(base44, {
        documentType: testCase.document_type,
        expectedNumber: testCase.expected,
        sides: [side],
      });

      results.push({
        key: testCase.key,
        document_type: testCase.document_type,
        expected: testCase.expected,
        expected_outcome: testCase.expected_outcome,
        outcome: diagnosis.outcome,
        correct: diagnosis.outcome === testCase.expected_outcome,
        read: diagnosis.rawReading,
        readings: diagnosis.readings.map((r) => ({ pass: r.pass, engine: r.engine, raw: r.raw, valid: r.validFormat })),
        agreement: diagnosis.agreement,
        confidence: diagnosis.confidence,
        near_miss: diagnosis.nearMiss,
        quality,
        bandCount,
        preprocessMs,
        renderedBytes,
        renderCheck,
        totalMs: Date.now() - started,
      });
    } catch (e: any) {
      results.push({ key: testCase.key, error: String(e?.message).slice(0, 200), totalMs: Date.now() - started });
    }
  }

  return Response.json({ results });
}