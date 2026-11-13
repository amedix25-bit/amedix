import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { recogniseDocument } from '../../shared/documentOcrEngine.ts';
import { createRenderToken } from '../../shared/documentRenderToken.ts';
import { decodeDocument, enhance, renderJpeg, composePages, assessQuality, detectBands } from '../../shared/documentImageOps.ts';

// TEMPORARY evaluation harness for the recognition upgrade.
// Wraps a JPEG page in a minimal PDF container so the production path (the
// scanner uploads a PDF) is exercised, not just a bare image.
function wrapJpegInPdf(jpeg: Uint8Array, pageWidth = 1024, pageHeight = 1024): Uint8Array {
  const head = new TextEncoder().encode(
    `%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n` +
      `3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 ${pageWidth} ${pageHeight}]/Resources<</XObject<</Im0 4 0 R>>>>/Contents 5 0 R>>endobj\n` +
      `4 0 obj<</Type/XObject/Subtype/Image/Width ${pageWidth}/Height ${pageHeight}/ColorSpace/DeviceRGB/BitsPerComponent 8/Filter/DCTDecode/Length ${jpeg.length}>>stream\n`
  );
  const mid = new TextEncoder().encode(
    `\nendstream endobj\n5 0 obj<</Length 44>>stream\nq ${pageWidth} 0 0 ${pageHeight} 0 0 cm /Im0 Do Q\nendstream endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n`
  );
  const out = new Uint8Array(head.length + jpeg.length + mid.length);
  out.set(head, 0);
  out.set(jpeg, head.length);
  out.set(mid, head.length + jpeg.length);
  return out;
}

export default async function (req: any) {
  const base44 = createClientFromRequest(req);
  const body = await req.json().catch(() => ({}));
  const cases: any[] = Array.isArray(body.cases) ? body.cases : [];
  const results: any[] = [];

  for (const testCase of cases) {
    const started = Date.now();
    try {
      const source = await fetch(testCase.url, { signal: AbortSignal.timeout(20000) });
      let bytes = new Uint8Array(await source.arrayBuffer());
      let fileName = `${testCase.key}.jpg`;
      let mime = 'image/jpeg';
      if (testCase.wrap === 'pdf') {
        bytes = wrapJpegInPdf(bytes);
        fileName = `${testCase.key}.pdf`;
        mime = 'application/pdf';
      }

      const file = new File([bytes], fileName, { type: mime });
      const uploaded: any = await base44.asServiceRole.integrations.Core.UploadPrivateFile({ file });
      const signed: any = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({
        file_uri: uploaded.file_uri, expires_in: 300,
      });

      // preprocessing latency + what the pixels say, measured in isolation
      let preprocessMs = 0;
      let quality: any = null;
      let bandCount = 0;
      let pageCount = 0;
      let renderedBytes = 0;
      let renderedDims: any = null;
      const t0 = Date.now();
      const pages = await decodeDocument(bytes);
      pageCount = pages.length;
      if (pages.length) {
        const enhanced = enhance(pages[0], 'enhanced');
        const composed = composePages([enhanced]);
        const jpeg = await renderJpeg({ ...enhanced, ...composed } as any, 92);
        preprocessMs = Date.now() - t0;
        renderedBytes = jpeg.length;
        renderedDims = { width: composed.width, height: composed.height };
        quality = assessQuality(pages[0]);
        bandCount = detectBands(pages[0]).length;
      }

      const enhancedToken = await createRenderToken(signed.signed_url, 'enhanced');
      const binaryToken = await createRenderToken(signed.signed_url, 'binary');
      const side = {
        side: 'front' as const,
        url: signed.signed_url,
        enhancedUrl: `https://amedix.base44.app/functions/documentRender?t=${encodeURIComponent(enhancedToken)}`,
        binaryUrl: `https://amedix.base44.app/functions/documentRender?t=${encodeURIComponent(binaryToken)}`,
      };

      let renderCheck: any = null;
      try {
        const rendered = await fetch(side.enhancedUrl, { method: 'GET', signal: AbortSignal.timeout(25000) });
        const renderedData = new Uint8Array(await rendered.arrayBuffer());
        let dims: any = null;
        try {
          const decoded = await decodeDocument(renderedData);
          dims = decoded.length ? { width: decoded[0].width, height: decoded[0].height } : null;
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
        wrap: testCase.wrap || 'image',
        expected: testCase.expected,
        expected_outcome: testCase.expected_outcome,
        outcome: diagnosis.outcome,
        correct: diagnosis.outcome === testCase.expected_outcome,
        read: diagnosis.rawReading,
        readings: diagnosis.readings.map((r) => ({ pass: r.pass, engine: r.engine, raw: r.raw, valid: r.validFormat })),
        agreement: diagnosis.agreement,
        confidence: diagnosis.confidence,
        near_miss: diagnosis.nearMiss,
        pageCount,
        quality,
        bandCount,
        preprocessMs,
        renderedBytes,
        renderedDims,
        renderCheck,
        totalMs: Date.now() - started,
      });
    } catch (e: any) {
      results.push({ key: testCase.key, error: String(e?.message).slice(0, 200), totalMs: Date.now() - started });
    }
  }

  return Response.json({ results });
}