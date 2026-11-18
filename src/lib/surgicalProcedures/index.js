// AMedix surgical procedure catalogue — the single searchable database used by
// patient surgical history, surgical consultation and pre-operative notes,
// operative and procedure notes and post-operative documentation.
//
// 20 surgical specialties, ~300 procedures, each with its CPT code where one
// exists, an Arabic name, a category, its approaches and searchable aliases.
// Search works in Arabic and English on names, aliases, categories and codes.
import { GROUPS as PART1 } from "./part1";
import { GROUPS as PART2 } from "./part2";
import { GROUPS as PART3 } from "./part3";
import { GROUPS as PART4 } from "./part4";

const RAW_GROUPS = [...PART1, ...PART2, ...PART3, ...PART4];

// Local normaliser (Arabic diacritics/alef variants + case + punctuation) so
// this module stays independent of any component-level helper.
function norm(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[\u064B-\u0652\u0640]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export const APPROACH_LABELS = {
  open: { en: "Open", ar: "مفتوح" },
  lap: { en: "Laparoscopic", ar: "بالمنظار" },
  robotic: { en: "Robotic-assisted", ar: "بمساعدة الروبوت" },
  endo: { en: "Endoscopic", ar: "بالمنظار المرن" },
  perc: { en: "Percutaneous / minimally invasive", ar: "عبر الجلد / طفيف التوغل" },
  mis: { en: "Minimally invasive", ar: "طفيف التوغل" },
};

// Planned, performed and previous operations are kept distinct — a planned
// operation is never presented as completed.
export const PROCEDURE_STATUS_LABELS = {
  previous: { en: "Previous surgery", ar: "عملية سابقة" },
  planned: { en: "Planned procedure", ar: "عملية مخططة" },
  performed: { en: "Performed procedure", ar: "عملية منفذة" },
};

export const PROCEDURE_SPECIALTIES = RAW_GROUPS.map((g) => ({
  key: g.key,
  en: g.en,
  ar: g.ar,
  count: g.items.length,
}));

export const SURGICAL_PROCEDURES = RAW_GROUPS.flatMap((group) =>
  group.items.map((item) => ({
    id: `${group.key}:${item.code || norm(item.en).replace(/\s+/g, "-")}`,
    code: item.code || "",
    name: item.en,
    nameAr: item.ar || "",
    specialtyKey: group.key,
    specialty: group.en,
    specialtyAr: group.ar,
    category: item.cat || "",
    approaches: item.appr || [],
    urgency: item.urg || "",
    aliases: item.alias || [],
    search: norm([item.en, item.ar, item.code, item.cat, ...(item.alias || [])].filter(Boolean).join(" | ")),
  }))
);

export function procedureLabel(procedure, lang = "en") {
  if (!procedure) return "";
  return lang === "ar" ? procedure.nameAr || procedure.name : procedure.name;
}

export function procedureApproachText(procedure, lang = "en") {
  return (procedure?.approaches || [])
    .map((a) => APPROACH_LABELS[a]?.[lang === "ar" ? "ar" : "en"] || a)
    .join(" · ");
}

// Ranked search: exact/starts-with name matches first, then alias, category
// and code matches. Empty query lists the specialty (or the whole catalogue).
export function searchProcedures(query, { specialty, limit = 60 } = {}) {
  let pool = SURGICAL_PROCEDURES;
  if (specialty && specialty !== "all") pool = pool.filter((p) => p.specialtyKey === specialty);
  const q = norm(query);
  if (!q) return pool.slice(0, limit);
  const words = q.split(" ").filter(Boolean);
  const scored = [];
  for (const p of pool) {
    let score = 0;
    const en = norm(p.name);
    const ar = norm(p.nameAr);
    if (en === q || ar === q) score = 120;
    else if (en.startsWith(q) || ar.startsWith(q)) score = 100;
    else if (en.includes(q) || ar.includes(q)) score = 80;
    else if (p.search.includes(q)) score = 60;
    else if (words.length > 1 && words.every((w) => p.search.includes(w))) score = 40;
    if (score) scored.push({ p, score });
  }
  scored.sort((a, b) => b.score - a.score || a.p.name.localeCompare(b.p.name));
  return scored.slice(0, limit).map((s) => s.p);
}

export function groupBySpecialty(list) {
  const order = PROCEDURE_SPECIALTIES.map((s) => s.key);
  const map = new Map();
  for (const p of list) {
    if (!map.has(p.specialtyKey)) {
      map.set(p.specialtyKey, { key: p.specialtyKey, en: p.specialty, ar: p.specialtyAr, items: [] });
    }
    map.get(p.specialtyKey).items.push(p);
  }
  return [...map.values()].sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));
}

// Adds a picked procedure to a comma-separated procedure field without ever
// duplicating an entry already recorded there.
export function appendProcedure(existing, procedure, lang = "en") {
  const name = procedureLabel(procedure, lang);
  if (!name) return existing || "";
  const parts = String(existing || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.some((p) => norm(p) === norm(name))) return parts.join(", ");
  return [...parts, name].join(", ");
}

// Arabic/English term list in the shape the patient registration autocomplete
// uses, derived from this catalogue so both stay one database.
export function arabicProcedureTerms() {
  return SURGICAL_PROCEDURES.filter((p) => p.nameAr).map((p) => ({
    ar: p.nameAr,
    en: p.name,
    aliases: [p.name, ...(p.code ? [p.code] : []), ...p.aliases],
  }));
}