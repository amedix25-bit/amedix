// Small record helpers shared by the backend functions that read entity lists.
// `rows()` normalises a list response that may be either an array or a page
// ({ items }), and `clean()` turns anything into trimmed text of a bounded
// length so oversized input or a stray object can never reach a response.
export const rows = (result) => (Array.isArray(result) ? result : (result && result.items) || []);

export const clean = (value, max) => String(value == null ? '' : value).trim().slice(0, max || 200);