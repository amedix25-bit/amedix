import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// TEMPORARY probe — is a function endpoint fetchable without a user session?
// (A vision model fetches our image URLs server-side, with no session.)
const PNG_1x1 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==';

export default async function (req) {
  createClientFromRequest(req);
  const bytes = Uint8Array.from(atob(PNG_1x1), (c) => c.charCodeAt(0));
  return new Response(bytes, { status: 200, headers: { 'Content-Type': 'image/png' } });
}