// AMedix document format detection.
//
// The browser's declared media type is never trusted: a file is identified by
// the bytes it actually starts with. A JPEG renamed .pdf, a HEIC photo sent as
// image/jpeg or a PDF that is really a PNG all get their real format, so the
// pipeline can pick the right decoder instead of failing at the first step.

export type FileKind = 'pdf' | 'jpeg' | 'png' | 'heic' | 'unknown';

const HEIC_BRANDS = ['heic', 'heix', 'hevc', 'heim', 'heis', 'mif1', 'msf1', 'avif'];

function ascii(bytes: Uint8Array, start: number, length: number): string {
  let out = '';
  for (let i = 0; i < length; i += 1) {
    const b = bytes[start + i];
    if (b === undefined) return out;
    out += String.fromCharCode(b);
  }
  return out;
}

export function sniffFileType(bytes: Uint8Array): FileKind {
  if (!bytes || bytes.length < 12) return 'unknown';
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) return 'pdf';
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpeg';
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'png';
  // ISO base media container: 4-byte size, then 'ftyp', then the brand.
  if (ascii(bytes, 4, 4) === 'ftyp') {
    const brand = ascii(bytes, 8, 4).toLowerCase();
    if (HEIC_BRANDS.includes(brand)) return 'heic';
  }
  return 'unknown';
}

export const MIME_BY_KIND: Record<FileKind, string> = {
  pdf: 'application/pdf',
  jpeg: 'image/jpeg',
  png: 'image/png',
  heic: 'image/heic',
  unknown: 'application/octet-stream',
};

// Formats the pipeline can read end to end.
export const READABLE_KINDS: FileKind[] = ['pdf', 'jpeg', 'png'];

export const MAX_DOCUMENT_BYTES = 30 * 1024 * 1024;