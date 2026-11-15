// The ONE definition of a doctor's professional-profile privacy settings.
//
// The physician network (doctorProfessionalProfile) and the patient-facing
// hospital & doctor directory (patientDirectory) both read these rules, so a
// section the doctor switched off can never leak through another surface.
export const VISIBILITIES = ['network', 'connections'];

export const PRIVACY_DEFAULTS = {
  visibility: 'network',
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

export function sanitizePrivacy(input) {
  const privacy = { ...PRIVACY_DEFAULTS };
  if (!input || typeof input !== 'object') return privacy;
  if (VISIBILITIES.includes(input.visibility)) privacy.visibility = input.visibility;
  Object.keys(PRIVACY_DEFAULTS).forEach((key) => {
    if (key === 'visibility') return;
    if (typeof input[key] === 'boolean') privacy[key] = input[key];
  });
  return privacy;
}

// A profile limited to the owner's physician connections. A patient is never a
// colleague, so such a profile shows the professional card only — name,
// specialty and the AMedix verification badge, never the self-written sections.
export function isRestricted(privacy) {
  return !!privacy && privacy.visibility === 'connections';
}

export function canSee(privacy, key) {
  if (isRestricted(privacy)) return key === 'show_specialty' && privacy.show_specialty !== false;
  return privacy[key] !== false;
}