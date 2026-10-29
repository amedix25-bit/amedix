// Disease-specific clinical note templates, grouped for browsing by specialty.
//
// Presentation only: the templates themselves are the existing AMedix
// condition / disease note types (General Surgery diagnosis templates,
// Nephrology kidney and condition notes, Rheumatology disease notes) and every
// one of them keeps its own key, fields, review path, signature, versioning and
// audit trail. This module simply makes each specialty's disease-specific notes
// discoverable in one place — "Disease-Specific Note" → view all of them.

import { isReferralNoteType } from "@/lib/noteSectionPolicy";
import { SURGERY_CONDITION_DOCS } from "@/lib/surgeryConditionDocuments";
import { NEPHROLOGY_KIDNEY_DOCS } from "@/lib/nephrologyKidneyDocs";
import { NEPHROLOGY_CONDITION_DOCS } from "@/lib/nephrologyConditionDocs";
import { RHEUMATOLOGY_DISEASE_DOCS } from "@/lib/rheumDiseaseNotes";

// General Surgery — clinical grouping of the existing diagnosis templates.
const SURGERY_GROUPS = [
  { title: "Emergency, Trauma & Acute Abdomen", keys: ["surg_acute_abdomen", "surg_trauma"] },
  { title: "Appendix, Bowel & Abdominal Wall", keys: ["surg_appendicitis", "surg_bowel_obstruction", "surg_hernia", "surg_colorectal"] },
  { title: "Gallbladder, Biliary & Pancreas", keys: ["surg_biliary", "surg_hpb"] },
  { title: "Breast, Thyroid & Parathyroid", keys: ["surg_breast", "surg_thyroid"] },
  { title: "Upper GI & Endoscopy", keys: ["surg_upper_gi", "surg_endoscopy"] },
  { title: "Surgical Infection & Wound", keys: ["surg_infection"] },
];

// Search terms a clinician may type for a General Surgery template — search
// only; the template titles themselves are unchanged.
const SURGERY_ALIASES = {
  surg_acute_abdomen: "acute abdomen peritonitis perforation emergency laparotomy",
  surg_trauma: "trauma injury polytrauma stab gunshot",
  surg_appendicitis: "appendicitis appendicectomy appendiceal right iliac fossa",
  surg_bowel_obstruction: "bowel obstruction adhesions ileus small bowel large bowel volvulus",
  surg_hernia: "hernia inguinal femoral incisional umbilical ventral groin abdominal wall",
  surg_colorectal: "colorectal colon rectal anorectal haemorrhoids fistula fissure diverticulitis",
  surg_biliary: "gallbladder biliary cholecystitis cholelithiasis gallstones choledocholithiasis jaundice",
  surg_hpb: "hepatobiliary pancreatic liver pancreas pancreatitis cyst",
  surg_breast: "breast lump mastitis carcinoma fibroadenoma biopsy",
  surg_thyroid: "thyroid parathyroid goitre goiter nodule hyperthyroidism",
  surg_upper_gi: "upper gi stomach gastric ulcer reflux perforated peptic",
  surg_endoscopy: "endoscopy gastroscopy colonoscopy ogd scope",
  surg_infection: "infection abscess wound cellulitis sepsis necrotising fasciitis",
};

const surgeryGroups = () => {
  const groups = SURGERY_GROUPS.map((g) => ({
    title: g.title,
    docs: g.keys.map((k) => SURGERY_CONDITION_DOCS.find((d) => d.key === k)).filter(Boolean),
  }));
  const known = new Set(SURGERY_GROUPS.flatMap((g) => g.keys));
  const rest = SURGERY_CONDITION_DOCS.filter((d) => !known.has(d.key));
  if (rest.length) groups.push({ title: "Other General Surgery", docs: rest });
  return groups;
};

const GROUPS_BY_SPECIALTY = {
  surgery: surgeryGroups,
  nephrology: () => [
    { title: "Kidney Disease Notes", docs: NEPHROLOGY_KIDNEY_DOCS },
    { title: "Condition-Specific Notes", docs: NEPHROLOGY_CONDITION_DOCS },
  ],
  rheumatology: () => [{ title: "Rheumatology Disease Notes", docs: RHEUMATOLOGY_DISEASE_DOCS }],
};

const ALIASES_BY_SPECIALTY = {
  surgery: SURGERY_ALIASES,
};

// Every disease-specific template of the specialty, flattened.
export const getDiseaseDocs = (specialtyKey) => {
  const build = GROUPS_BY_SPECIALTY[specialtyKey];
  return build
    ? build().flatMap((g) => g.docs).filter((d) => !isReferralNoteType(d))
    : [];
};

export const getDiseaseDocKeys = (specialtyKey) =>
  new Set(getDiseaseDocs(specialtyKey).map((d) => d.key));

// Grouped templates for the browse list, empty groups removed.
export const getDiseaseGroups = (specialtyKey) => {
  const build = GROUPS_BY_SPECIALTY[specialtyKey];
  if (!build) return [];
  return build().filter((g) => g.docs.length > 0);
};

export const getDiseaseAliases = (specialtyKey) => ALIASES_BY_SPECIALTY[specialtyKey] || {};