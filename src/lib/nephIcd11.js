// Nephrology ICD-11 MMS catalogue.
//
// Only codes VERIFIED against the WHO ICD-11 MMS browser are listed here. The
// blueprint classes below (GB60–GB6Z kidney failure, GB40–GB4Z glomerular
// diseases, GB70 urinary calculus) were checked against the published MMS
// block listing. Nothing is invented: for any diagnosis that is not in this
// list, the clinician enters the code and the official term from the WHO
// browser, and that entry is stored with its source and flagged as manual.
//
// Coding is documentation, never reasoning: selecting a code never confirms a
// diagnosis, never replaces the differential, and never decides treatment.

import { ICD11_MMS, SPECIFICITY, DIAGNOSIS_ROLES, DIAGNOSIS_STATUSES, matchesIcd11 } from "@/lib/rheumIcd11";

export { ICD11_MMS, SPECIFICITY, DIAGNOSIS_ROLES, DIAGNOSIS_STATUSES, matchesIcd11 };

export const NEPH_ICD11 = [
  {
    code: "GB60",
    display: "Acute kidney failure",
    definition: "Rapid deterioration of kidney function, with or without reduced urine output, developing over hours to days.",
    specificity: SPECIFICITY.BLOCK,
    criteria: "KDIGO 2012 AKI definition and staging — document baseline and current creatinine with their dates.",
    aliases: "AKI acute renal failure acute kidney injury",
  },
  {
    code: "GB61",
    display: "Chronic kidney disease",
    definition:
      "Abnormalities of kidney structure or function present for more than three months, with implications for health.",
    specificity: SPECIFICITY.BLOCK,
    criteria:
      "KDIGO 2024 CKD definition — chronicity must be documented (repeated values ≥ 3 months apart, structural or histological evidence).",
    aliases: "CKD chronic renal failure ESRD end stage renal disease",
  },
  {
    code: "GB40",
    display: "Nephritic syndrome",
    definition:
      "Sudden onset of glomerular disease, usually with haematuria and variable proteinuria, hypertension and reduced kidney function.",
    specificity: SPECIFICITY.BLOCK,
    criteria: "Document urinalysis, complement, serology and histopathology where a biopsy has been performed.",
    aliases: "glomerulonephritis haematuria red cell casts",
  },
  {
    code: "GB41",
    display: "Nephrotic syndrome",
    definition: "Heavy proteinuria with hypoalbuminaemia, oedema and hyperlipidaemia.",
    specificity: SPECIFICITY.BLOCK,
    criteria: "Document UPCR / UACR, serum albumin and the biopsy result where one is available.",
    aliases: "nephrotic proteinuria oedema hypoalbuminaemia",
  },
  {
    code: "GB70.0",
    display: "Calculus of kidney",
    definition: "Urinary calculus located in the renal calyces or the renal pelvis.",
    specificity: SPECIFICITY.SUB,
    criteria: "Document stone size, location and obstruction on imaging.",
    aliases: "kidney stone nephrolithiasis renal calculus",
  },
];