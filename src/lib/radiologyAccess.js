import { base44 } from "@/api/base44Client";

export const RADIOLOGY_SPECIALTY = "Radiology";

// A doctor who selects the Radiology specialty works in the Radiologist
// Portal — the exact same portal dedicated radiologists use. That portal runs
// on a RadiologistProfile, so this makes sure the doctor's account has one,
// created from the doctor's own verified professional details. Returns the
// existing or newly created profile.
export async function ensureRadiologistProfile(doctorProfile, user) {
  const existing = await base44.entities.RadiologistProfile.filter({ user_id: user.id });
  if (existing.length > 0) return existing[0];
  return base44.entities.RadiologistProfile.create({
    user_id: user.id,
    full_name: doctorProfile.full_name,
    specialization: RADIOLOGY_SPECIALTY,
    license_number: doctorProfile.license_number || "",
    hospital: doctorProfile.hospital || "",
    phone: doctorProfile.phone || "",
    status: "active",
    doctor_portal_access: false,
  });
}