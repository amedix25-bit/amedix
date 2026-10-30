// Pediatrics — small value helpers shared by the blocks, the safety rules and the
// formatters. A blank stays blank: nothing here turns an empty value into a normal.

export const asObject = (value) =>
  value && typeof value === "object" && !Array.isArray(value) ? value : {};

export const str = (value) => (value === null || value === undefined ? "" : String(value).trim());

export const list = (value) => (Array.isArray(value) ? value.map((v) => String(v)).filter(Boolean) : []);

export const num = (value) => {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const yesNo = (value) => str(value) === "Yes";

// True when the clinician recorded anything at all in this block. Used to tell
// "the block was not part of this note" from "the block was opened and left blank".
export const blockUsed = (block) =>
  Object.entries(asObject(block)).some(([key, value]) => {
    if (key === "__p") return false;
    return Array.isArray(value) ? value.length > 0 : str(value) !== "";
  });