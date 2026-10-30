// Neurology — one block registry for the whole specialty.
//
// Every block lives in its own module and is merged here, so the note form, the
// saved record and the printed note read a single catalogue.

import { HISTORY_BLOCK, INTERVAL_BLOCK, MENTAL_STATUS_BLOCK, CRANIAL_NERVES_BLOCK, MOTOR_BLOCK, REFLEX_BLOCK, COORDINATION_BLOCK, MENINGEAL_BLOCK } from "@/lib/neurologyExamBlocks";
import {
  STROKE_BLOCK, SEIZURE_BLOCK, STATUS_EPILEPTICUS_BLOCK, HEADACHE_BLOCK, MS_BLOCK,
  NEUROMUSCULAR_BLOCK, COGNITIVE_BLOCK, RAISED_ICP_BLOCK, CNS_INFECTION_BLOCK,
  DISCHARGE_BLOCK, REFERRAL_BLOCK,
} from "@/lib/neurologyClinicalBlocks";
import { EEG_BLOCK, EMG_BLOCK, PROCEDURE_BLOCK } from "@/lib/neurologyReportBlocks";
import { MOVEMENT_BLOCK, NEUROPATHY_BLOCK, DIZZINESS_BLOCK } from "@/lib/neurologyConditionBlocks";
import { REASONING_BLOCK } from "@/lib/neurologyReasoningBlocks";
import { asObject, str, list } from "@/lib/neurologyFieldKit";

export const NEURO_BLOCKS = {
  [HISTORY_BLOCK.key]: HISTORY_BLOCK,
  [INTERVAL_BLOCK.key]: INTERVAL_BLOCK,
  [MENTAL_STATUS_BLOCK.key]: MENTAL_STATUS_BLOCK,
  [CRANIAL_NERVES_BLOCK.key]: CRANIAL_NERVES_BLOCK,
  [MOTOR_BLOCK.key]: MOTOR_BLOCK,
  [REFLEX_BLOCK.key]: REFLEX_BLOCK,
  [COORDINATION_BLOCK.key]: COORDINATION_BLOCK,
  [MENINGEAL_BLOCK.key]: MENINGEAL_BLOCK,
  [STROKE_BLOCK.key]: STROKE_BLOCK,
  [SEIZURE_BLOCK.key]: SEIZURE_BLOCK,
  [STATUS_EPILEPTICUS_BLOCK.key]: STATUS_EPILEPTICUS_BLOCK,
  [HEADACHE_BLOCK.key]: HEADACHE_BLOCK,
  [MS_BLOCK.key]: MS_BLOCK,
  [NEUROMUSCULAR_BLOCK.key]: NEUROMUSCULAR_BLOCK,
  [COGNITIVE_BLOCK.key]: COGNITIVE_BLOCK,
  [RAISED_ICP_BLOCK.key]: RAISED_ICP_BLOCK,
  [CNS_INFECTION_BLOCK.key]: CNS_INFECTION_BLOCK,
  [DISCHARGE_BLOCK.key]: DISCHARGE_BLOCK,
  [REFERRAL_BLOCK.key]: REFERRAL_BLOCK,
  [EEG_BLOCK.key]: EEG_BLOCK,
  [EMG_BLOCK.key]: EMG_BLOCK,
  [PROCEDURE_BLOCK.key]: PROCEDURE_BLOCK,
  [MOVEMENT_BLOCK.key]: MOVEMENT_BLOCK,
  [NEUROPATHY_BLOCK.key]: NEUROPATHY_BLOCK,
  [DIZZINESS_BLOCK.key]: DIZZINESS_BLOCK,
  [REASONING_BLOCK.key]: REASONING_BLOCK,
};

export const NEURO_BLOCK_KEYS = Object.keys(NEURO_BLOCKS);

export const neuroBlock = (key) => NEURO_BLOCKS[key] || null;

// The block value a field holds, tagged with its own block key so the saved note
// and its PDF can be rebuilt without the form's context.
export const neuroBlockValue = (blockKey, value) => ({ ...asObject(value), __n: blockKey });

export const neuroBlockFrom = (value) => {
  const v = asObject(value);
  return v.__n && NEURO_BLOCKS[v.__n] ? NEURO_BLOCKS[v.__n] : null;
};

// The readable text a saved note carries for one block. An empty block says so
// explicitly, so a reader can tell "not documented" from "not part of this note".
export const formatNeuroBlock = (value) => {
  const v = asObject(value);
  const spec = neuroBlockFrom(value);
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
  return lines.join("\n");
};

// The same value in a stable shape, so a safety rule can read one block field
// without knowing whether the note stored a block, a string or nothing.
export const neuroBlockValues = (values, blockKey) => asObject(asObject(values)[blockKey]);