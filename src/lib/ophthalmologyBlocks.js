// Ophthalmology — one block registry for the whole specialty.
//
// The examination blocks and the condition/procedure blocks live in their own
// modules and are merged here, so the note form, the saved record, the printed
// record and the advisory prompts all read a single catalogue.

import { OPHTH_EXAM_BLOCKS } from "@/lib/ophthalmologyExamBlocks";
import { OPHTH_CONDITION_BLOCKS } from "@/lib/ophthalmologyConditionBlocks";
import { asObject, str, list, blockHasContent } from "@/lib/ophthFieldKit";

export const OPHTH_BLOCKS = { ...OPHTH_EXAM_BLOCKS, ...OPHTH_CONDITION_BLOCKS };

export const ophthBlock = (key) => OPHTH_BLOCKS[key] || null;
export const OPHTH_BLOCK_KEYS = Object.keys(OPHTH_BLOCKS);

// The block value a field holds, tagged with its own block key so the saved
// note, the screen and the PDF can be rebuilt without the form's context.
export const ophthBlockValue = (blockKey, value) => ({ ...asObject(value), __m: blockKey });

export const ophthBlockFrom = (value) => {
  const v = asObject(value);
  return v.__m && OPHTH_BLOCKS[v.__m] ? OPHTH_BLOCKS[v.__m] : null;
};

// The text a saved note and its PDF carry for this block.
export const formatOphthBlock = (value) => {
  const v = asObject(value);
  const spec = ophthBlockFrom(value);
  if (!spec) return "";
  const lines = spec.fields
    .map((f) => {
      const raw = v[f.key];
      if (f.type === "multi") {
        const items = list(raw);
        return items.length ? `${f.label}: ${items.join("; ")}` : null;
      }
      const val = str(raw);
      return val ? `${f.label}: ${val}` : null;
    })
    .filter(Boolean);
  if (!lines.length) return `${spec.title} — not documented in this note.`;
  return lines.join("\n");
};

// Reads a value for a flag from the named block, then from the note itself, then
// from any other ophthalmology block — so a rule keeps working whether the value
// sits in its own block or somewhere else on the note.
export const ophthFind = (values, blockKey, key) => {
  const block = asObject(values?.[blockKey]);
  if (str(block[key])) return str(block[key]);
  const direct = str(values?.[key]);
  if (direct) return direct;
  for (const k of OPHTH_BLOCK_KEYS) {
    const other = asObject(values?.[k]);
    if (str(other[key])) return str(other[key]);
  }
  return "";
};

export const ophthFindList = (values, blockKey, key) => {
  const block = asObject(values?.[blockKey]);
  if (list(block[key]).length) return list(block[key]);
  return list(values?.[key]);
};

export const ophthHasBlock = (values, blockKey) => blockHasContent(values?.[blockKey]);

export const OPHTH_BLOCK_COUNT = OPHTH_BLOCK_KEYS.length;