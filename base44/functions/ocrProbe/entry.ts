import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// TEMPORARY probe — pure-JS image decoding inside the function runtime.
export default async function (req) {
  createClientFromRequest(req);
  const out: Record<string, unknown> = {};

  const res = await fetch(
    'https://media.base44.com/images/public/6a9ea24b809f9bb40f0d02bf/adf82bca4_generated_image.png',
    { signal: AbortSignal.timeout(20000) }
  );
  const png = new Uint8Array(await res.arrayBuffer());
  out.png_bytes = png.length;

  // fast-png (pure JS PNG decoder)
  try {
    const t0 = Date.now();
    const mod: any = await import('npm:fast-png@6.2.0');
    const decode = mod.decode || mod.default?.decode;
    const img = decode(png);
    out.fast_png = {
      ok: true,
      ms: Date.now() - t0,
      width: img.width,
      height: img.height,
      channels: img.channels,
      dataType: img.data?.constructor?.name,
      firstPixels: Array.from(img.data.slice(0, 4)),
    };
  } catch (e) {
    out.fast_png = { ok: false, error: String((e as Error)?.message).slice(0, 300) };
  }

  // jpeg-js — only to confirm JPEG decoding works (this input is a PNG, so a
  // failure here would be expected; it reports whether the module loads).
  try {
    const mod: any = await import('npm:jpeg-js@0.4.4');
    const decode = (mod.decode || mod.default?.decode);
    out.jpeg_js = { loaded: true, hasDecode: typeof decode === 'function' };
  } catch (e) {
    out.jpeg_js = { loaded: false, error: String((e as Error)?.message).slice(0, 200) };
  }

  return Response.json(out);
}