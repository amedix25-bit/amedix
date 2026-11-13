import { decodeImage, enhance, renderJpeg, isPng } from '../../shared/documentImageOps.ts';
import { readRenderToken, isAllowedDocumentUrl } from '../../shared/documentRenderToken.ts';

// AMedix document renderer (in-memory only).
//
// The reader asks for an enhanced picture of a document it is already allowed
// to read. This endpoint fetches the document through its own short-lived
// signed link, processes the pixels, and returns the enhanced render —
// nothing is stored, nothing is logged, and the signed link inside the token
// has already expired by the time anyone else could reuse it.
//
// If the document cannot be processed as pixels (a PDF, an unsupported codec),
// the original bytes are passed straight through so the reader still works.
export default async function (req: any) {
  const url = new URL(req.url);
  const token = url.searchParams.get('t') || '';
  const payload = await readRenderToken(token);
  if (!payload) return Response.json({ error: 'Invalid or expired render link' }, { status: 403 });
  if (!isAllowedDocumentUrl(payload.u)) return Response.json({ error: 'Unsupported source' }, { status: 400 });

  let bytes: Uint8Array;
  let contentType = 'application/octet-stream';
  try {
    const res = await fetch(payload.u, { signal: AbortSignal.timeout(15000) });
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

  // PDFs and anything we cannot decode go through untouched.
  try {
    if (!isPng(bytes) && !(bytes[0] === 0xff && bytes[1] === 0xd8)) return passThrough();
    const raster = await decodeImage(bytes);
    if (!raster || !raster.width || !raster.height) return passThrough();
    const rendered = enhance(raster, payload.m === 'binary' ? 'binary' : 'enhanced');
    const jpeg = await renderJpeg(rendered, 92);
    return new Response(jpeg, {
      status: 200,
      headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch {
    return passThrough();
  }
}