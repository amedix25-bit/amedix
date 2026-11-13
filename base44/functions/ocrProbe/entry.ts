import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { createRenderToken } from '../../shared/documentRenderToken.ts';

// TEMPORARY probe — can the vision model actually OPEN an app-hosted render URL,
// or does it only reach the media host?
export default async function (req: any) {
  const base44 = createClientFromRequest(req);
  const out: any = {};
  const source = await fetch(
    'https://media.base44.com/images/public/6a9ea24b809f9bb40f0d02bf/945e71fb9_generated_image.png',
    { signal: AbortSignal.timeout(20000) }
  );
  const bytes = new Uint8Array(await source.arrayBuffer());
  const file = new File([bytes], 'render_probe.jpg', { type: 'image/jpeg' });
  const uploaded: any = await base44.asServiceRole.integrations.Core.UploadPrivateFile({ file });
  const signed: any = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({ file_uri: uploaded.file_uri, expires_in: 300 });

  const token = await createRenderToken(signed.signed_url, 'enhanced');
  const renderUrl = `https://amedix.base44.app/functions/documentRender?t=${encodeURIComponent(token)}`;
  out.render_url_prefix = renderUrl.slice(0, 80);

  // our own fetch of the render, for reference
  try {
    const r = await fetch(renderUrl, { signal: AbortSignal.timeout(20000) });
    const b = new Uint8Array(await r.arrayBuffer());
    out.own_fetch = { status: r.status, type: r.headers.get('content-type'), bytes: b.length };
  } catch (e: any) {
    out.own_fetch = { error: String(e?.message).slice(0, 120) };
  }

  const ask = async (label: string, url: string) => {
    try {
      const reply: any = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: 'If you can open this image, answer with one short sentence describing the document and the first large alphanumeric code you see. If you cannot open or see the image at all, answer exactly: CANNOT_OPEN.',
        file_urls: [url],
        model: 'gemini_3_flash',
      });
      return { label, reply: String(reply).slice(0, 200) };
    } catch (e: any) {
      return { label, error: String(e?.message).slice(0, 200) };
    }
  };

  out.media_url_read = await ask('media', signed.signed_url);
  out.render_url_read = await ask('render', renderUrl);
  out.public_media_read = await ask('public-media', 'https://media.base44.com/images/public/6a9ea24b809f9bb40f0d02bf/945e71fb9_generated_image.png');
  return Response.json(out);
}