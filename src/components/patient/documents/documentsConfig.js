import {
  ShieldCheck,
  Syringe,
  FileText,
  FlaskConical,
  ScanLine,
  Pill,
  Building2,
  Scissors,
  Mail,
  Microscope,
  FolderOpen,
} from "lucide-react";

// Documents section configuration — each category renders as a capture card
// in the patient Documents tab. `buttons` lists the capture actions shown on
// the card (the insurance card has separate front and back captures).

export const INSURANCE_CARD = {
  key: "insurance",
  label: "Medical Insurance Card",
  description: "Photograph the front and back of your medical insurance card. Saved under Insurance Documents.",
  icon: ShieldCheck,
  buttons: [
    { id: "front", label: "Front" },
    { id: "back", label: "Back" },
  ],
};

export const VACCINATION_CARD = {
  key: "vaccination",
  label: "Vaccination Card",
  description: "Photograph your vaccination card. Saved under Vaccination Records.",
  icon: Syringe,
  buttons: [{ id: "card", label: "Card" }],
};

export const ADDITIONAL_CATEGORIES = [
  { key: "medical_reports", label: "Medical Reports", icon: FileText, buttons: [{ id: "doc", label: "Document" }] },
  { key: "lab_results", label: "Laboratory Results", icon: FlaskConical, buttons: [{ id: "doc", label: "Document" }] },
  { key: "imaging", label: "Imaging & Radiology", icon: ScanLine, buttons: [{ id: "doc", label: "Document" }] },
  { key: "prescriptions", label: "Prescriptions", icon: Pill, buttons: [{ id: "doc", label: "Document" }] },
  { key: "hospital", label: "Hospital / Discharge Documents", icon: Building2, buttons: [{ id: "doc", label: "Document" }] },
  { key: "surgical", label: "Surgical & Procedure Records", icon: Scissors, buttons: [{ id: "doc", label: "Document" }] },
  { key: "referral", label: "Referral Letters", icon: Mail, buttons: [{ id: "doc", label: "Document" }] },
  { key: "pathology", label: "Pathology / Biopsy Reports", icon: Microscope, buttons: [{ id: "doc", label: "Document" }] },
  { key: "other", label: "Other Medical Documents", icon: FolderOpen, buttons: [{ id: "doc", label: "Document" }] },
];

// Legacy documents created before the category field — map their old type
// onto the matching category so they still appear in the right section.
export const LEGACY_TYPE_TO_CATEGORY = {
  prescription: "prescriptions",
  referral: "referral",
  report: "medical_reports",
  other: "other",
};

export const CATEGORY_TO_TYPE = {
  prescriptions: "prescription",
  referral: "referral",
  medical_reports: "report",
};