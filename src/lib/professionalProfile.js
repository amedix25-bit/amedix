// Shared vocabulary for the AMedix Professional Profile — the entry types, the
// privacy switches and the small formatting helpers used by every screen that
// shows a physician's professional identity.

export const EDUCATION_TYPES = [
  { value: "degree", label: "Medical Degree" },
  { value: "residency", label: "Residency" },
  { value: "fellowship", label: "Fellowship" },
  { value: "certification", label: "Certification" },
];

export const ACHIEVEMENT_TYPES = [
  { value: "award", label: "Award & Honour" },
  { value: "publication", label: "Research Publication" },
  { value: "conference", label: "Conference & Lecture" },
  { value: "accomplishment", label: "Professional Accomplishment" },
  { value: "experience", label: "Clinical Experience" },
];

export const labelOf = (list, value, fallback = "—") =>
  list.find((item) => item.value === value)?.label || fallback;

export const PRIVACY_DEFAULTS = {
  visibility: "network",
  show_photo: true,
  show_title: true,
  show_specialty: true,
  show_workplace: true,
  show_location: true,
  show_bio: true,
  show_education: true,
  show_achievements: true,
  show_license: false,
};

// Which parts of the profile another physician may see.
export const PRIVACY_FIELDS = [
  { key: "show_photo", label: "Profile picture", hint: "Your professional photograph on the profile header" },
  { key: "show_title", label: "Professional title", hint: "The title you present, e.g. Consultant Cardiologist" },
  { key: "show_specialty", label: "Medical specialty", hint: "Your specialty — the AMedix verification badge follows it" },
  { key: "show_workplace", label: "Hospital / workplace", hint: "Where you currently practise" },
  { key: "show_location", label: "Location", hint: "The city and country you practise in" },
  { key: "show_bio", label: "Professional biography", hint: "Your short summary of practice and interests" },
  { key: "show_education", label: "Education & qualifications", hint: "Degrees, residencies, fellowships and certifications" },
  { key: "show_achievements", label: "Achievements & experience", hint: "Awards, publications, conferences and experience" },
  { key: "show_license", label: "Licence number", hint: "Your AMedix-verified medical licence number" },
];

export const newEntryId = () =>
  `pe_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

export const emptyEducationEntry = () => ({
  entry_id: newEntryId(),
  type: "degree",
  title: "",
  institution: "",
  field: "",
  country: "",
  start_year: "",
  end_year: "",
  notes: "",
});

export const emptyAchievementEntry = () => ({
  entry_id: newEntryId(),
  type: "award",
  title: "",
  organization: "",
  year: "",
  detail: "",
  link: "",
});

export function yearRange(entry) {
  const from = entry?.start_year || "";
  const to = entry?.end_year || "";
  if (from && to && from !== to) return `${from} – ${to}`;
  return to || from || "";
}

export const initialsOf = (name) =>
  String(name || "")
    .replace(/^Dr\.?\s*/i, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");