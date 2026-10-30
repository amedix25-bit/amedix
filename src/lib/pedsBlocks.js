// Pediatrics — one block registry for the whole specialty.
//
// Every block lives in its own module and is merged here, so the note form, the
// saved record and the printed note read a single catalogue.

import { NEWBORN_BLOCK, JAUNDICE_BLOCK, GROWTH_BLOCK, MALNUTRITION_BLOCK } from "@/lib/pedsNewbornBlocks";
import { TRIAGE_BLOCK, FEVER_BLOCK, RESPIRATORY_BLOCK, DEHYDRATION_BLOCK } from "@/lib/pedsAcuteBlocks";
import {
  DEVELOPMENT_BLOCK, IMMUNISATION_BLOCK, CHRONIC_BLOCK, ADOLESCENT_BLOCK,
  SAFEGUARDING_BLOCK, FAMILY_BLOCK, PROCEDURE_BLOCK, REASONING_BLOCK,
} from "@/lib/pedsCareBlocks";
import { asObject, str, list } from "@/lib/pedsFieldKit";

export const PEDS_BLOCKS = {
  [NEWBORN_BLOCK.key]: NEWBORN_BLOCK,
  [JAUNDICE_BLOCK.key]: JAUNDICE_BLOCK,
  [GROWTH_BLOCK.key]: GROWTH_BLOCK,
  [MALNUTRITION_BLOCK.key]: MALNUTRITION_BLOCK,
  [TRIAGE_BLOCK.key]: TRIAGE_BLOCK,
  [FEVER_BLOCK.key]: FEVER_BLOCK,
  [RESPIRATORY_BLOCK.key]: RESPIRATORY_BLOCK,
  [DEHYDRATION_BLOCK.key]: DEHYDRATION_BLOCK,
  [DEVELOPMENT_BLOCK.key]: DEVELOPMENT_BLOCK,
  [IMMUNISATION_BLOCK.key]: IMMUNISATION_BLOCK,
  [CHRONIC_BLOCK.key]: CHRONIC_BLOCK,
  [ADOLESCENT_BLOCK.key]: ADOLESCENT_BLOCK,
  [SAFEGUARDING_BLOCK.key]: SAFEGUARDING_BLOCK,
  [FAMILY_BLOCK.key]: FAMILY_BLOCK,
  [PROCEDURE_BLOCK.key]: PROCEDURE_BLOCK,
  [REASONING_BLOCK.key]: REASONING_BLOCK,
};

export const PEDS_BLOCK_KEYS = Object.keys(PEDS_BLOCKS);

export const pedsBlock = (key) => PEDS_BLOCKS[key] || null;

// The block value a field holds, tagged with its own block key so the saved note and
// its PDF can be rebuilt without the form's context.
export const pedsBlockValue = (blockKey, value) => ({ ...asObject(value), __p: blockKey });

export const pedsBlockFrom = (value) => {
  const v = asObject(value);
  return v.__p && PEDS_BLOCKS[v.__p] ? PEDS_BLOCKS[v.__p] : null;
};

// The readable text a saved note carries for one block. An empty block says so
// explicitly, so a reader can tell "not documented" from "not part of this note".
export const formatPedsBlock = (value) => {
  const v = asObject(value);
  const spec = pedsBlockFrom(value);
  if (!spec) return "";
  const lines = spec.fields
    .map((f) => {
      const raw = v[f.key];
      if (f.type === "multi") {
        const items = list(raw);
        return items.length ? `${f.label}: ${items.join("; ")}` : null;
      }
      const val = str(raw);
      return val ? `${f.label}: ${val}${f.unit ? ` ${f.unit}` : ""}` : null;
    })
    .filter(Boolean);
  if (!lines.length) return `${spec.title} — not documented in this note.`;
  const undocumented = spec.fields.filter((f) => {
    const raw = v[f.key];
    return Array.isArray(raw) ? raw.length === 0 : str(raw) === "";
  }).length;
  const tail = undocumented ? `\n${undocumented} field(s) in this record were left not documented.` : "";
  return lines.join("\n") + tail;
};

// The same value in a stable shape, so a safety rule can read one block field
// without knowing whether the note stored a block, a string or nothing.
export const pedsBlockValues = (values, blockKey) => asObject(asObject(values)[blockKey]);