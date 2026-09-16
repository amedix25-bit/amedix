// Predefined specialties doctors select from at their first Doctor Portal
// entry — no free typing. "Surgeon" unlocks the specialty-specific Surgical
// Records documentation section in place of Clinical Notes; every other
// Doctor Portal feature stays exactly the same for all doctors.
export const SPECIALTIES = [
  "Surgeon",
  "Internal Medicine",
  "Family Medicine",
  "General Practice",
  "Emergency Medicine",
  "Cardiology",
  "Pediatrics",
  "Neurology",
  "Orthopedics",
  "Obstetrics & Gynecology",
  "Dermatology",
  "Psychiatry",
  "ENT (Otolaryngology)",
  "Ophthalmology",
  "Urology",
  "Oncology",
  "Anesthesiology & Intensive Care",
  "Plastic Surgery",
  "Vascular Surgery",
  "Endocrinology",
  "Gastroenterology",
  "Pulmonology",
  "Nephrology",
  "Rheumatology",
  "Hematology",
  "Infectious Diseases",
  "Physical Medicine & Rehabilitation",
];

export const isSurgicalSpecialty = (specialization) => specialization === "Surgeon";