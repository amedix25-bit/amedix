// AMedix PDF reading through the platform AI gateway.
//
// Scanned PDFs are rarely a clean stack of JPEG images: scanners emit CCITT G4,
// JBIG2, JPX or PNG-compressed pages, none of which the in-house pixel decoder
// can open. Instead of failing the document, the stored PDF itself is handed to
// a vision model that reads PDFs natively.
//
// The file is passed as a short-lived signed link minted server-side; the link
// expires within minutes and is never logged. Nothing about the document is
// written by this module.

import { parseJsonReply } from './inlineVision.ts';

export type PdfReadRequest = {
  url: string;
  prompt: string;
  model?: string;
  timeoutMs?: number;
};

const NUMBER_SCHEMA = {
  type: 'object',
  properties: {
    number: { type: 'string', description: 'The identification number exactly as printed, every character, without spaces or separators. Empty string if it truly cannot be read.' },
    readable: { type: 'boolean', description: 'Whether the number is legible at all in this document' },
    confidence: { type: 'number', description: 'How certain the reading is, 0 to 100' },
    pages_scanned: { type: 'number', description: 'How many pages were inspected' },
    notes: { type: 'string', description: 'Anything that blocks reading' },
  },
  required: ['number', 'readable'],
};

export async function readPdfDocument(base44: any, request: PdfReadRequest): Promise<{ data: any | null; error: string }> {
  const timeoutMs = Math.max(8000, Math.min(60000, request.timeoutMs || 45000));
  const call = (async () => {
    const result: any = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: request.prompt,
      file_urls: [request.url],
      model: request.model || 'automatic',
      response_json_schema: NUMBER_SCHEMA,
    });
    if (result && typeof result === 'object') return result;
    return parseJsonReply(result);
  })();

  try {
    const data = await Promise.race([
      call,
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeoutMs)),
    ]);
    return data ? { data, error: '' } : { data: null, error: 'unparsable_reply' };
  } catch (err: any) {
    const message = String(err?.message || err || '');
    return { data: null, error: /timeout|abort/i.test(message) ? 'timeout' : 'request_failed' };
  }
}