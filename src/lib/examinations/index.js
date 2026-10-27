// Dynamic Examination Engine — registry of examination type configurations.
// Each type is plain data (sections → fields → options); the UI reads this
// configuration and renders the correct form. Adding a future examination type
// (Obstetric, Gynecological, Orthopedic, Trauma, Psychiatric, Neonatal,
// Vascular, Rheumatological …) means adding one config file here — no UI work.

import general from "./types/general";
import cardiovascular from "./types/cardiovascular";
import respiratory from "./types/respiratory";
import abdominal from "./types/abdominal";
import neurological from "./types/neurological";
import musculoskeletal from "./types/musculoskeletal";
import ent from "./types/ent";
import ophthalmological from "./types/ophthalmological";
import dermatological from "./types/dermatological";
import genitourinary from "./types/genitourinary";
import breast from "./types/breast";
import peripheralVascular from "./types/peripheralVascular";
import pediatric from "./types/pediatric";
import custom from "./types/custom";

export const EXAMINATION_TYPES = [
  general,
  cardiovascular,
  respiratory,
  abdominal,
  neurological,
  musculoskeletal,
  ent,
  ophthalmological,
  dermatological,
  genitourinary,
  breast,
  peripheralVascular,
  pediatric,
  custom,
];

export const getExaminationType = (key) => EXAMINATION_TYPES.find((t) => t.key === key);

// ---- runtime helpers -------------------------------------------------------

export const fieldHasValue = (v) => {
  if (v === null || v === undefined) return false;
  if (typeof v === "object" && !Array.isArray(v)) {
    if ("value" in v || "detail" in v) return Boolean(v.value) || Boolean(v.detail);
    return Object.values(v).some(
      (x) => x !== null && x !== undefined && x !== "" && x !== false
    );
  }
  if (Array.isArray(v)) return v.length > 0;
  return v !== "" && v !== false;
};

// Effective status of a documented section.
export const computeSectionStatus = (sectionSpec, data) => {
  if (!data) return "not_documented";
  if (data.status === "normal" || data.status === "abnormal" || data.status === "not_assessed")
    return data.status;
  const allFields = [...(sectionSpec.fields || []), ...(sectionSpec.abnormalFields || [])];
  const hasValues =
    allFields.some((f) => fieldHasValue((data.values || {})[f.key])) ||
    Boolean(data.notes && data.notes.trim());
  return hasValues ? "partially_completed" : "not_documented";
};

// Overall status across all sections of a type.
export const computeOverallStatus = (typeConfig, dataBySection) => {
  const statuses = (typeConfig?.sections || []).map((s) =>
    computeSectionStatus(s, dataBySection?.[s.key])
  );
  if (statuses.includes("abnormal")) return "abnormal";
  // An explicitly not-assessed section is never counted as normal.
  if (statuses.includes("not_assessed")) return "partially_completed";
  if (statuses.includes("partially_completed")) return "partially_completed";
  if (statuses.includes("normal")) return "normal";
  return "partially_completed";
};

export const SECTION_STATUS_LABELS = {
  not_documented: "Not Documented",
  not_assessed: "Not Assessed",
  normal: "Normal",
  abnormal: "Abnormal",
  partially_completed: "Partially Completed",
};

export const OVERALL_STATUS_LABELS = {
  normal: "Normal",
  abnormal: "Abnormal",
  partially_completed: "Partially Completed",
};

export const CLINICAL_LOCATIONS = ["ER", "Clinic", "Ward", "ICU", "Other"];

// Reference generators, e.g. EX-20260913-8F3K
export const generateReference = (prefix) => {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(
    d.getDate()
  ).padStart(2, "0")}`;
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${ymd}-${rand}`;
};