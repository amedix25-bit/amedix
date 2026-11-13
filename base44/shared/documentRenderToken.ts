// Short-lived, signed tokens for the AMedix document renderer.
//
// The recognition engine needs an enhanced picture of a document, but no
// enhanced copy may ever be written to storage (zero retention). Instead the
// engine signs a token that carries the document's own short-lived signed link
// and the mode to render; documentRender rebuilds the picture in memory from
// that link and hands it straight to the reader. The token expires with the
// link it carries, and cannot be produced outside this app's backend.

const KEY_MATERIAL = 'amedix-document-render-v1';

function base64url(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64url(value: string): string {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  return atob(padded + '='.repeat((4 - (padded.length % 4)) % 4));
}

async function hmac(message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(KEY_MATERIAL),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return base64url(new Uint8Array(sig));
}

export type RenderPayload = { u: string; m: 'enhanced' | 'binary'; e: number };

export async function createRenderToken(url: string, mode: 'enhanced' | 'binary', ttlSeconds = 420): Promise<string> {
  const payload: RenderPayload = { u: url, m: mode, e: Date.now() + ttlSeconds * 1000 };
  const body = base64url(new TextEncoder().encode(JSON.stringify(payload)));
  return `${body}.${await hmac(body)}`;
}

export async function readRenderToken(token: string): Promise<RenderPayload | null> {
  if (typeof token !== 'string' || !token.includes('.')) return null;
  const [body, signature] = token.split('.');
  if (!body || !signature) return null;
  if ((await hmac(body)) !== signature) return null;
  try {
    const payload = JSON.parse(fromBase64url(body)) as RenderPayload;
    if (!payload || typeof payload.u !== 'string') return null;
    if (!payload.e || payload.e < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function isAllowedDocumentUrl(url: string): boolean {
  if (typeof url !== 'string' || !url.startsWith('https://')) return false;
  return url.includes('media.base44.com') || url.includes('base44.app') || url.includes('static.wixstatic.com');
}