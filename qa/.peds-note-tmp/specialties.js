// Predefined specialties doctors select from at their first Doctor Portal
// entry — no free typing, listed alphabetically. "General Surgery" unlocks the
// specialty-specific Surgical Records documentation section in place of
// Clinical Notes; every other Doctor Portal feature stays exactly the same for
// all doctors.
export const SPECIALTIES = [
  "Allergy & Immunology",
  "Anesthesiology & Intensive Care",
  "Cardiology",
  "Cardiothoracic Surgery",
  "Critical Care / ICU",
  "Dentistry",
  "Dermatology",
  "Emergency Medicine",
  "Endocrinology",
  "ENT (Otolaryngology)",
  "Family Medicine",
  "Gastroenterology",
  "General Practice",
  "General Surgery",
  "Geriatrics",
  "Hematology",
  "Infectious Diseases",
  "Internal Medicine",
  "Laboratory Medicine",
  "Nephrology",
  "Neurology",
  "Neurosurgery",
  "Nutrition & Dietetics",
  "Obstetrics & Gynecology",
  "Oncology",
  "Ophthalmology",
  "Orthopedics",
  "Pain Medicine",
  "Palliative Care",
  "Pathology",
  "Pediatric Surgery",
  "Pediatrics",
  "Physical Medicine & Rehabilitation",
  "Plastic Surgery",
  "Psychiatry",
  "Pulmonology",
  "Radiology",
  "Rheumatology",
  "Sports Medicine",
  "Trauma Surgery",
  "Urology",
  "Vascular Surgery",
];

// "Surgeon" is the legacy label kept only so existing profiles continue to
// resolve to the surgical documentation set.
const SURGICAL_LABELS = ["General Surgery", "Surgeon"];

export const isSurgicalSpecialty = (specialization) =>
  SURGICAL_LABELS.includes(specialization);