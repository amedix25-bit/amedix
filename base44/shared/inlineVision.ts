// AMedix in-memory document reading.
//
// A verification document is handed to the recognisers INSIDE the request body:
// each page is a base64 image part of a chat completion. Nothing is uploaded, no
// storage reference is minted, no signed URL is created, nothing is written to
// disk, a cache or a log, and the bytes are released with the request.
//
// The only artefact that outlives the call is the decision the caller records —
// masked numbers, counts and the outcome.

export type InlineImage = { mime: string; base64: string };

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png']);
// A single inline image is capped so one oversized page can never exhaust the
// request budget; the caller refuses the document instead of truncating it.
const MAX_BASE64_CHARS = 9_000_000;
const DEFAULT_TIMEOUT_MS = 45000;
const MAX_TIMEOUT_MS = 90000;

function toDataUrl(image: InlineImage): string {
  const mime = ALLOWED_MIME.has(image.mime) ? image.mime : 'image/jpeg';
  return `data:${mime};base64,${image.base64}`;
}

// Vision models answer in prose around their JSON often enough that a strict
// parse would throw away a correct reading.
export function parseJsonReply(text: unknown): any | null {
  if (typeof text !== 'string' || !text.trim()) return null;
  const cleaned = text.replace(/```json/gi, '```').split('```').join('').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return null;
  }
}

function messageText(content: unknown): string {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map((part: any) => (typeof part === 'string' ? part : part?.text || ''))
      .join('');
  }
  return '';
}

/**
 * Reads one or more inline images with a vision model and returns the parsed
 * JSON reply, or null when the model could not be reached or did not answer in
 * the expected shape. Nothing about the document is persisted or logged here.
 */
export async function readDocumentWithVision(
  base44: any,
  request: { model: string; prompt: string; images: InlineImage[]; timeoutMs?: number }
): Promise<any | null> {
  const images = (request.images || []).filter(
    (image) => image && typeof image.base64 === 'string' && image.base64.length > 0 && image.base64.length <= MAX_BASE64_CHARS
  );
  if (!images.length || typeof request.prompt !== 'string' || !request.prompt) return null;

  const connection = base44.asServiceRole.aiGateway.connection();
  const endpoint = `${String(connection.baseURL).replace(/\/$/, '')}/chat/completions`;
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(connection.headers || {}) };
  if (connection.token) headers.Authorization = `Bearer ${connection.token}`;

  const timeoutMs = Math.min(MAX_TIMEOUT_MS, Math.max(5000, request.timeoutMs || DEFAULT_TIMEOUT_MS));

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: request.model,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: request.prompt },
            ...images.map((image) => ({ type: 'image_url', image_url: { url: toDataUrl(image) } })),
          ],
        },
      ],
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!response.ok) return null;
  const payload: any = await response.json().catch(() => null);
  return parseJsonReply(messageText(payload?.choices?.[0]?.message?.content));
}

// Byte helpers for the in-memory document container. Both directions stay in
// memory; neither touches storage.
export function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)) as unknown as number[]);
  }
  return btoa(binary);
}