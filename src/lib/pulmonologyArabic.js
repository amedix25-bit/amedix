import { PULM_AR_TITLES, PULM_AR_CHROME } from "@/lib/pulmonologyArabicTitles";
import { PULM_AR_LABELS_A } from "@/lib/pulmonologyArabicLabelsA";
import { PULM_AR_LABELS_B } from "@/lib/pulmonologyArabicLabelsB";
import { PULM_AR_OPTIONS_A } from "@/lib/pulmonologyArabicOptionsA";
import { PULM_AR_OPTIONS_B } from "@/lib/pulmonologyArabicOptionsB";

// One Arabic display dictionary for the respiratory documentation blocks:
// block titles, field labels, interface copy, calculated-value notes, option
// strings and the validated instrument names.
//
// DISPLAY ONLY. The language a clinician reads a note in never changes what is
// stored: field keys, the English option strings and the English labels are what
// the note, the printed record and the exported PDF keep. A string that is not
// in this dictionary is shown in English rather than machine-composed, so no
// clinical wording is invented at runtime.
export const PULM_AR = {
  ...PULM_AR_TITLES,
  ...PULM_AR_CHROME,
  ...PULM_AR_LABELS_A,
  ...PULM_AR_LABELS_B,
  ...PULM_AR_OPTIONS_A,
  ...PULM_AR_OPTIONS_B,
};

// The Arabic label for one English string, or the English string itself.
export const pulmAr = (text, isArabic) => {
  if (!isArabic || typeof text !== "string") return text ?? "";
  return PULM_AR[text] || text;
};

// A list of option strings in the reading language. The value handed back to the
// form always stays the English string.
export const pulmArList = (list, isArabic) =>
  (list || []).map((o) => ({ value: o, label: pulmAr(o, isArabic) }));

export const pulmArLabelCount = () => Object.keys(PULM_AR).length;