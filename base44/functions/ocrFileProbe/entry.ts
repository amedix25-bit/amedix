import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// TEMPORARY probe — what bytes does the media host serve, and what survives a
// private upload + signed download?
export default async function (req: any) {
  const base44 = createClientFromRequest(req);
  const url = 'https://media.base44.com/images/public/6a9ea24b809f9bb40f0d02bf/945e71fb9_generated_image.png';
  const hex = (b: Uint8Array) => Array.from(b.slice(0, 12)).map((x) => x.toString(16).padStart(2, '0')).join(' ');
  const out: any = {};

  const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
  const bytes = new Uint8Array(await res.arrayBuffer());
  out.source = { status: res.status, type: res.headers.get('content-type'), size: bytes.length, head: hex(bytes) };

  for (const suffix of ['', '?fm=jpeg', '?format=jpeg', '?fm=jpg&w=1600']) {
    try {
      const r = await fetch(url + suffix, { signal: AbortSignal.timeout(20000) });
      const b = new Uint8Array(await r.arrayBuffer());
      out[`variant_${suffix || 'plain'}`] = { status: r.status, type: r.headers.get('content-type'), size: b.length, head: hex(b) };
    } catch (e: any) {
      out[`variant_${suffix || 'plain'}`] = { error: String(e?.message).slice(0, 100) };
    }
  }

  const file = new File([bytes], 'probe_document.png', { type: 'image/png' });
  const up: any = await base44.asServiceRole.integrations.Core.UploadPrivateFile({ file });
  const signed: any = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({ file_uri: up.file_uri, expires_in: 300 });
  const back = await fetch(signed.signed_url, { signal: AbortSignal.timeout(20000) });
  const backBytes = new Uint8Array(await back.arrayBuffer());
  out.roundtrip = {
    file_uri: up.file_uri,
    signed_host: new URL(signed.signed_url).host,
    status: back.status,
    type: back.headers.get('content-type'),
    size: backBytes.length,
    head: hex(backBytes),
  };
  return Response.json(out);
}