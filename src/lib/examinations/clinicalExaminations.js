// Clinical-note examination selection — maps each specialty's note templates
// to the structured examination types of the Dynamic Examination Engine, and
// formats a documented examination into readable text for the saved note.
//
// Nothing here invents findings: a section that was not documented stays
// "Not Documented", and a section can be explicitly recorded as "Not Assessed",
// so an examination is never silently recorded as normal.

import {
  getExaminationType,
  computeSectionStatus,
  computeOverallStatus,
  OVERALL_STATUS_LABELS,
} from "@/lib/examinations";

// Hemodynamic status is a structured clinical decision — exactly these four
// options, never a free-text value and never preselected.
export const HEMODYNAMIC_STABILITY_OPTIONS = [
  "Stable",
  "Unstable",
  "Transient Responder",
  "Non-Responder",
];

// Examinations offered for each specialty key. Every list ends with the
// free-form examination so any other system can still be documented.
const SPECIALTY_EXAMINATIONS = {
  internal_medicine: ["general", "cardiovascular", "respiratory", "abdominal", "neurological", "musculoskeletal", "custom"],
  emergency_medicine: ["general", "cardiovascular", "respiratory", "abdominal", "neurological", "musculoskeletal", "custom"],
  surgery: ["abdominal", "breast", "general", "peripheralVascular", "musculoskeletal", "custom"],
  pediatrics: ["general", "pediatric", "respiratory", "abdominal", "neurological", "custom"],
  obstetrics_gynecology: ["abdominal", "general", "custom"],
  anesthesiology: ["general", "cardiovascular", "respiratory", "neurological", "custom"],
  cardiology: ["cardiovascular", "general", "respiratory", "peripheralVascular", "custom"],
  neurology: ["neurological", "general", "musculoskeletal", "custom"],
  psychiatry: ["general", "custom"],
  ophthalmology: ["ophthalmological", "general", "neurological", "custom"],
  dermatology: ["dermatological", "general", "custom"],
  orthopedics: ["musculoskeletal", "general", "peripheralVascular", "custom"],
  urology: ["genitourinary", "abdominal", "general", "custom"],
  ent: ["ent", "general", "respiratory", "custom"],
  pulmonology: ["respiratory", "general", "cardiovascular", "custom"],
  gastroenterology: ["abdominal", "general", "custom"],
  nephrology: ["general", "cardiovascular", "respiratory", "custom"],
  endocrinology: ["general", "custom"],
  oncology: ["general", "breast", "abdominal", "respiratory", "custom"],
  infectious_disease: ["general", "respiratory", "abdominal", "dermatological", "custom"],
  rheumatology: ["musculoskeletal", "general", "dermatological", "custom"],
  hematology: ["general", "custom"],
  family_medicine: ["general", "cardiovascular", "respiratory", "abdominal", "neurological", "musculoskeletal", "custom"],
  physiotherapy: ["musculoskeletal", "neurological", "general", "custom"],
};

// Examination keys offered for a specialty (empty for specialties that do not
// document a physical examination, e.g. laboratory, pathology, radiology).
export const examinationTypeKeysFor = (specialtyKey) => SPECIALTY_EXAMINATIONS[specialtyKey] || [];

// Resolved options (key, label, description) for the selection interface.
export const examinationOptionsFor = (specialtyKey, typeKeys) => {
  const keys = Array.isArray(typeKeys) && typeKeys.length > 0 ? typeKeys : examinationTypeKeysFor(specialtyKey);
  return keys
    .map(getExaminationType)
    .filter(Boolean)
    .map((t) => ({ key: t.key, label: t.label, description: t.description || "" }));
};

export const EMPTY_EXAMINATION_VALUE = { selected: [], data: {} };

// The field value is stored as JSON so selected examinations and every
// documented section survive the draft autosave and reload unchanged.
export const parseExaminationValue = (value) => {
  if (!value) return EMPTY_EXAMINATION_VALUE;
  if (typeof value === "object") return value.selected ? value : EMPTY_EXAMINATION_VALUE;
  const raw = String(value).trim();
  if (!raw.startsWith("{")) return EMPTY_EXAMINATION_VALUE;
  try {
    const parsed = JSON.parse(raw);
    return parsed && Array.isArray(parsed.selected) ? parsed : EMPTY_EXAMINATION_VALUE;
  } catch {
    return EMPTY_EXAMINATION_VALUE;
  }
};

const describeValue = (field, value) => {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "boolean") return value ? field?.label || "Present" : "";
  if (Array.isArray(value)) return value.filter(Boolean).join(", ");
  if (typeof value === "object") {
    const parts = [];
    if (Array.isArray(value.value)) parts.push(value.value.filter(Boolean).join(", "));
    else if (value.value !== undefined && value.value !== null && value.value !== "") parts.push(String(value.value));
    if (value.right !== undefined && value.right !== "") parts.push(`Right: ${value.right}`);
    if (value.left !== undefined && value.left !== "") parts.push(`Left: ${value.left}`);
    if (value.detail) parts.push(String(value.detail));
    if (value.side) parts.push(String(value.side));
    return parts.join(", ");
  }
  return String(value);
};

const formatParsed = ({ selected = [], data = {} }) => {
  const blocks = [];
  selected.forEach((typeKey) => {
    const type = getExaminationType(typeKey);
    if (!type) return;
    const typeData = data[typeKey] || {};
    const lines = [];
    (type.sections || []).forEach((spec) => {
      const sectionData = typeData[spec.key];
      if (!sectionData) return;
      const status = computeSectionStatus(spec, sectionData);
      if (status === "not_documented") return;
      if (status === "normal") {
        lines.push(`• ${spec.title}: Normal`);
        return;
      }
      if (status === "not_assessed") {
        lines.push(`• ${spec.title}: Not assessed`);
        return;
      }
      const findings = [...(spec.fields || []), ...(spec.abnormalFields || [])]
        .map((f) => {
          const described = describeValue(f, (sectionData.values || {})[f.key]);
          return described ? `${f.label}: ${described}` : "";
        })
        .filter(Boolean);
      const head = status === "abnormal" ? `• ${spec.title}: Abnormal` : `• ${spec.title}`;
      lines.push(findings.length > 0 ? `${head} — ${findings.join("; ")}` : head);
      if (sectionData.notes) lines.push(`Notes: ${sectionData.notes}`);
    });
    const overall = OVERALL_STATUS_LABELS[computeOverallStatus(type, typeData)] || "";
    blocks.push(`${type.label}${overall ? ` — ${overall}` : ""}${lines.length > 0 ? `\n${lines.join("\n")}` : ""}`);
  });
  return blocks.join("\n\n");
};

// Readable text for the saved note, the note view and the printed note.
// Plain legacy free text (an older note's examination) is returned unchanged.
export const formatExaminationValue = (value) => {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return formatParsed(value);
  const raw = String(value).trim();
  if (!raw.startsWith("{")) return raw;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.selected)) return raw;
    return formatParsed(parsed);
  } catch {
    return raw;
  }
};