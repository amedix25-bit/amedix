// Haematology — one block registry for the whole specialty.
//
// The history, physical-finding and shared-management blocks and the condition
// blocks live in their own modules and are merged here, so the note form, the
// saved record and the printed note all read a single catalogue.

import { HISTORY_BLOCKS, INTERVAL_BLOCK } from "@/lib/hematologyClinicalBlocks";
import { CONDITION_BLOCKS } from "@/lib/hematologyConditionBlocks";
import { ASH_MANAGEMENT_BLOCKS } from "@/lib/hematologyAshManagement";
import { asObject, str, list } from "@/lib/hematologyFieldKit";

export const HEMA_BLOCKS = {
  ...HISTORY_BLOCKS,
  ...INTERVAL_BLOCK,
  ...CONDITION_BLOCKS,
  ...ASH_MANAGEMENT_BLOCKS,
};

export const hemaBlock = (key) => HEMA_BLOCKS[key] || null;
export const HEMA_BLOCK_KEYS = Object.keys(HEMA_BLOCKS);

// The block value a field holds, tagged with its own block key so the saved note
// and its PDF can be rebuilt without the form's context.
export const hemaBlockValue = (blockKey, value) => ({ ...asObject(value), __m: blockKey });

export const hemaBlockFrom = (value) => {
  const v = asObject(value);
  return v.__m && HEMA_BLOCKS[v.__m] ? HEMA_BLOCKS[v.__m] : null;
};

// The readable text a saved note carries for one block. An empty block says so
// explicitly rather than disappearing, so a reader can tell "not documented"
// from "not part of this note type".
export const formatHemaBlock = (value) => {
  const v = asObject(value);
  const spec = hemaBlockFrom(value);
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

export const HEMA_BLOCK_COUNT = HEMA_BLOCK_KEYS.length;