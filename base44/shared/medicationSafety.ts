// Shared medication-adherence helpers: dose schedule derivation from a
// prescribed frequency, medication-specific missed-dose guidance, and the
// unified longitudinal history status. Used by logMedicationDose,
// createMedicationReminders and patientMedicationHistory.
// Single implementation — never copied.

import { remainingOf } from "./pharmacyPrescription.ts";

export const TZ = 'Africa/Tripoli';

// Unified medication-history status for a prescription, derived from its
// lifecycle — prescriptions are never deleted, so history stays traceable.
//   PENDING_DISPENSING: issued, authorized or reserved (not yet dispensed)
//   PARTIALLY_DISPENSED / FULLY_DISPENSED: from the dispensing events
//   DISCONTINUED: cancelled (voided) prescription
export function medicationHistoryStatus(rx, today) {
  if (rx.status === 'cancelled') return 'discontinued';
  if (rx.status === 'dispensed') {
    return remainingOf(rx) > 0 ? 'partially_dispensed' : 'fully_dispensed';
  }
  return 'pending_dispensing';
}

function tzParts(date) {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
  const p = {};
  for (const { type, value } of fmt.formatToParts(date)) p[type] = value;
  return p;
}

export function todayInTz() {
  const p = tzParts(new Date());
  return `${p.year}-${p.month}-${p.day}`;
}

// Current clock time in the clinical timezone as "HH:MM".
export function timeInTz(date) {
  const p = tzParts(date);
  return `${p.hour === '24' ? '00' : p.hour}:${p.minute}`;
}

const DEFAULT_SLOTS = {
  1: ['08:00'],
  2: ['08:00', '20:00'],
  3: ['08:00', '14:00', '20:00'],
  4: ['08:00', '12:00', '16:00', '20:00'],
};

// Derives how many doses a day a fixed (non-PRN) schedule implies and sensible
// default reminder times, from the prescribed frequency text (e.g. "3 times
// daily", "every 8 hours", "once daily").
export function doseTimesFromFrequency(frequency, prn, maxFrequency) {
  if (prn) return { prn: true, timesPerDay: 0, defaultTimes: [] };
  const text = String(frequency || '').toLowerCase();
  let perDay = 0;
  const everyMatch = text.match(/every\s+(\d+)\s*(?:hour|hr)/);
  if (everyMatch) {
    const hours = parseInt(everyMatch[1], 10);
    if (hours > 0 && hours <= 24) perDay = Math.floor(24 / hours);
  }
  if (!perDay) {
    if (/\bonce\b|\b1\s*(time|x)\b|(^|\s)daily(\s|$)/.test(text)) perDay = 1;
    else if (/\btwice\b|\b2\s*(time|x)\b/.test(text)) perDay = 2;
    else if (/\bthree\b|\b3\s*(time|x)\b/.test(text)) perDay = 3;
    else if (/\bfour\b|\b4\s*(time|x)\b/.test(text)) perDay = 4;
  }
  if (!perDay) {
    const num = parseInt(String(text).replace(/[^0-9]/g, ' ').trim().split(/\s+/)[0] || '', 10);
    if (Number.isFinite(num) && num >= 1 && num <= 6) perDay = num;
  }
  if (!perDay) perDay = 1;
  let defaultTimes = DEFAULT_SLOTS[perDay];
  if (!defaultTimes) {
    // Distribute evenly across waking hours (08:00 to 22:00).
    defaultTimes = [];
    const step = Math.max(1, Math.floor(14 / perDay));
    for (let i = 0; i < perDay; i++) {
      const h = 8 + i * step;
      defaultTimes.push(`${String(Math.min(h, 23)).padStart(2, '0')}:00`);
    }
  }
  return { prn: false, timesPerDay: perDay, defaultTimes };
}

const GUIDANCE_RULES = [
  {
    category: 'insulin',
    test: (t) => /\binsulin\b/.test(t),
    guidance: 'Take the missed dose as soon as you remember and check your blood glucose afterwards. Never take a double dose to catch up — if you are unsure or doses are frequently missed, contact your diabetes care team.',
  },
  {
    category: 'anticoagulant',
    test: (t) => /\bwarfarin\b|\bapixaban\b|\brivaroxaban\b|\bedoxaban\b|\bdabigatran\b|\bclopidogrel\b|\bheparin\b/.test(t),
    guidance: 'Take it as soon as you remember on the same day. Never take a double dose to make up for a missed one — record the missed dose and tell your anticoagulation clinic.',
  },
  {
    category: 'contraceptive',
    test: (t) => /\bcontraceptiv|\bdesogestrel\b|\blevonorgestrel\b|\byasmin\b|\bmicrolut\b/.test(t),
    guidance: 'Follow the patient information leaflet for your exact brand — the timing rules and protection impact differ by product. Do not take a double dose unless the leaflet tells you to.',
  },
  {
    category: 'thyroid',
    test: (t) => /\blevothyroxine\b|\bthyroxine\b|\beuthyrox\b|\bthyroid\b/.test(t),
    guidance: 'Take it when you remember, ideally on an empty stomach. Do not take two doses together — continue the normal schedule from the next day.',
  },
  {
    category: 'opioid',
    test: (t) => /\bmorphine\b|\btramadol\b|\boxycodone\b|\bfentanyl\b|\bcodeine\b|\bhydromorphone\b/.test(t),
    guidance: 'Do not take an extra or early dose. Take the next scheduled dose on time and tell your doctor about the missed dose.',
  },
  {
    category: 'antibiotic',
    test: (t) => /\bcillin\b|\bmycin\b|\bfloxacin\b|\bcef\b|\bazole\b|\bcycline\b|\bsulfa\b|\bmetronidazole\b|\bantibiotic\b/.test(t),
    guidance: 'Take it as soon as you remember, unless it is almost time for the next dose — then skip the missed one and continue the usual schedule. Never double up, and finish the full course as prescribed.',
  },
];

// Medication-specific missed-dose guidance. Deterministic — matched on the
// medication and active ingredient names. Guidance NEVER recommends an extra
// dose or a change to the prescribed regimen.
export function missedDoseGuidance(medicationName, activeIngredient) {
  const text = `${String(medicationName || '')} ${String(activeIngredient || '')}`.toLowerCase();
  for (const rule of GUIDANCE_RULES) {
    if (rule.test(text)) return { category: rule.category, guidance: rule.guidance };
  }
  return {
    category: 'general',
    guidance: 'Take it as soon as you remember, unless it is almost time for your next dose — in that case skip the missed dose and continue your normal schedule. Never take an extra or double dose to catch up.',
  };
}