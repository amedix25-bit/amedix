import { decodeDocument, enhance, composePages, encodeJpeg } from '../../shared/documentImageOps.ts';
import { readRenderToken, isAllowedDocumentUrl } from '../../shared/documentRenderToken.ts';

// AMedix document renderer (in-memory only).
//
// The reader asks for a rectified picture of a document it is already allowed to
// read. This endpoint fetches the document through its own short-lived signed
// link, takes the page pixels out of the upload (the scanner submits a PDF whose
// pages are JPEG images), straightens, flattens the lighting, equalises local
// contrast, sharpens and upscales them, stacks the pages into one picture and
// returns it.
//
// Nothing is stored and nothing is logged. The signed link inside the token has
// already expired by the time anyone else could reuse it.
//
// If the document cannot be processed as pixels, the original bytes are passed
// straight through so the reader still works.
export default async function (req: any) {
  const url = new URL(req.url);
  const token = url.searchParams.get('t') || '';
  const payload = await readRenderToken(token);
  if (!payload) return Response.json({ error: 'Invalid or expired render link' }, { status: 403 });
  if (!isAllowedDocumentUrl(payload.u)) return Response.json({ error: 'Unsupported source' }, { status: 400 });

  let bytes: Uint8Array;
  let contentType = 'application/octet-stream';
  try {
    const res = await fetch(payload.u, { signal: AbortSignal.timeout(20000) });
    if (!res.ok) return Response.json({ error: 'Document unavailable' }, { status: 502 });
    contentType = res.headers.get('content-type') || contentType;
    bytes = new Uint8Array(await res.arrayBuffer());
  } catch {
    return Response.json({ error: 'Document unavailable' }, { status: 502 });
  }

  const passThrough = () =>
    new Response(bytes, {
      status: 200,
      headers: { 'Content-Type': contentType, 'Cache-Control': 'no-store, max-age=0' },
    });

  try {
    const pages = await decodeDocument(bytes);
    if (!pages.length) return passThrough();
    const mode = payload.m === 'binary' ? 'binary' : 'enhanced';
    const processed = pages.slice(0, 2).map((page) => enhance(page, mode));
    const composed = composePages(processed);
    if (!composed.width || !composed.height) return passThrough();
    const jpeg = await encodeJpeg(composed.gray, composed.width, composed.height, 92);
    return new Response(jpeg, {
      status: 200,
      headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch {
    return passThrough();
  }
}