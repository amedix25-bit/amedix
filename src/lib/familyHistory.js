// AMedix Family History — one card per family member.
//
// Conditions are stored one record per condition (FamilyHistory.condition), so
// a relative's conditions are never merged with another relative's and no
// existing record is ever rewritten to change its meaning. The helpers here
// group those records back into one card per relative, and convert a member
// (a relative plus the conditions they have) back into records for saving.

export const FAMILY_MEMBERS = [
  { value: "father", en: "Father", ar: "الأب" },
  { value: "mother", en: "Mother", ar: "الأم" },
  { value: "brother", en: "Brother", ar: "الأخ" },
  { value: "sister", en: "Sister", ar: "الأخت" },
  { value: "son", en: "Son", ar: "الابن" },
  { value: "daughter", en: "Daughter", ar: "الابنة" },
  { value: "paternal_grandfather", en: "Paternal grandfather", ar: "الجد من جهة الأب" },
  { value: "paternal_grandmother", en: "Paternal grandmother", ar: "الجدة من جهة الأب" },
  { value: "maternal_grandfather", en: "Maternal grandfather", ar: "الجد من جهة الأم" },
  { value: "maternal_grandmother", en: "Maternal grandmother", ar: "الجدة من جهة الأم" },
  { value: "uncle", en: "Uncle", ar: "العم / الخال" },
  { value: "aunt", en: "Aunt", ar: "العمة / الخالة" },
  { value: "other", en: "Other relative", ar: "قريب آخر" },
];

// Older records stored a single "children" relation. It stays readable and
// editable, and is offered back only for a member that already uses it.
const LEGACY_MEMBERS = [{ value: "children", en: "Child", ar: "الابن / الابنة" }];

const ALL_MEMBERS = [...FAMILY_MEMBERS, ...LEGACY_MEMBERS];

// The relations offered when choosing a family member.
export const memberOptions = (currentRelation = "") =>
  currentRelation === "children" ? [...FAMILY_MEMBERS, LEGACY_MEMBERS[0]] : FAMILY_MEMBERS;

export const memberLabel = (relation, relationLabel = "", isArabic = false) => {
  const specified = String(relationLabel || "").trim();
  if (relation === "other" && specified) return specified;
  const known = ALL_MEMBERS.find((m) => m.value === relation);
  if (known) return isArabic ? known.ar : known.en;
  return specified || relation || "";
};

// The identity of a family member — the key their conditions are grouped by.
export const memberKeyOf = (member) => {
  const relation = String(member?.relation || "").trim();
  if (relation === "other") return `other:${String(member?.relation_label || "").trim().toLowerCase()}`;
  return relation;
};

export const familyMemberKey = (entry) => memberKeyOf(entry);

// One entry per distinct condition of a member, in the order they were saved.
export const uniqueConditions = (entries = []) => {
  const seen = new Set();
  const out = [];
  entries.forEach((entry) => {
    const name = String(entry.condition || "").trim();
    const key = name.toLowerCase();
    if (!name || seen.has(key)) return;
    seen.add(key);
    out.push({ en: name, ar: String(entry.condition_ar || "").trim(), record: entry });
  });
  return out;
};

const orderOf = (relation) => {
  const index = FAMILY_MEMBERS.findIndex((m) => m.value === relation);
  return index === -1 ? FAMILY_MEMBERS.length : index;
};

// Records → one group per family member, in a stable relative order.
export const groupFamilyHistory = (entries = []) => {
  const groups = new Map();
  entries.forEach((entry) => {
    const key = familyMemberKey(entry);
    if (!groups.has(key)) {
      groups.set(key, { key, relation: entry.relation, relation_label: entry.relation_label || "", entries: [] });
    }
    const group = groups.get(key);
    if (!group.relation_label && entry.relation_label) group.relation_label = entry.relation_label;
    group.entries.push(entry);
  });
  return [...groups.values()]
    .map((group, index) => ({ group, index }))
    .sort((a, b) => orderOf(a.group.relation) - orderOf(b.group.relation) || a.index - b.index)
    .map(({ group }) => group);
};

// A group → the member shape the editor dialog works with.
export const groupToMember = (group) => ({
  relation: group.relation,
  relation_label: group.relation_label || "",
  conditions: uniqueConditions(group.entries).map(({ en, ar }) => ({ en, ar })),
});

const memberEntries = (member) => {
  const relation_label = member.relation === "other" ? String(member.relation_label || "").trim() : "";
  return member.conditions.map((c) => ({
    condition: c.en,
    condition_ar: c.ar || "",
    relation: member.relation,
    relation_label,
  }));
};

// Apply a saved member to the in-form list (registration, nothing stored yet).
// EDIT replaces that member's conditions with the chosen list; ADD merges into
// the existing card, so the same relative is never duplicated.
export const applyMemberToEntries = (entries = [], member, { editing = false } = {}) => {
  const key = memberKeyOf(member);
  const fresh = memberEntries(member);
  if (editing) return [...entries.filter((e) => familyMemberKey(e) !== key), ...fresh];
  const existingNames = new Set(
    entries.filter((e) => familyMemberKey(e) === key).map((e) => String(e.condition || "").trim().toLowerCase())
  );
  return [...entries, ...fresh.filter((e) => !existingNames.has(e.condition.trim().toLowerCase()))];
};