// Pediatrics — the per-note blocks appended to each existing note type.
//
// One section per clinical question, in the order a clinician works: history and
// context, measurements and examination, assessment and differential, then
// management, medication safety, monitoring and follow-up. Each section is the block
// that note's own profile defines, so the content is conditional on the note rather
// than one oversized generic form.

import { PEDS_NOTE_BLOCKS, PEDS_NOTE_PROFILES, pedsNoteBlockKey } from "@/lib/pedsNoteProfiles";

const ORDER = [
  ["ctx", "History & context"],
  ["exam", "Measurements & examination"],
  ["assess", "Assessment & differentials"],
  ["care", "Management & follow-up"],
];

export const PEDS_STRENGTHENED_NOTE_KEYS = Object.keys(PEDS_NOTE_PROFILES);

export const pedsNoteSections = (noteKey) => {
  if (!PEDS_NOTE_PROFILES[noteKey]) return [];
  return ORDER.filter(([part]) => PEDS_NOTE_PROFILES[noteKey][part]).map(([part, section]) => {
    const key = pedsNoteBlockKey(noteKey, part);
    const block = PEDS_NOTE_BLOCKS[key];
    return { key, label: block.title, type: "peds_modules", section };
  });
};