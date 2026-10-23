// Shared radiologist ↔ facility membership resolution — the ONE authorization
// rule behind every radiology function. A radiologist is authorized for a
// facility's radiology department when:
//   1. a facility administrator granted a membership (RadiologistProfile.
//      authorized_facilities — matched by the facility's HospitalProfile
//      user ID), or
//   2. their legacy home facility (RadiologistProfile.hospital) equals the
//      request's routed facility name (backward compatible with existing data).
// Being a radiologist alone NEVER grants access to any facility or patient.

export type FacilityAuth = {
  ids: string[];
  names: string[];
};

// Resolve the facilities a radiologist is authorized for.
export async function authorizedFacilities(base44: any, radiologist: any): Promise<FacilityAuth> {
  const names = new Set<string>();
  const ids = new Set<string>();
  const legacy = String((radiologist && radiologist.hospital) || "").trim();
  if (legacy) names.add(legacy);
  const granted = Array.isArray(radiologist && radiologist.authorized_facilities)
    ? radiologist.authorized_facilities
    : [];
  for (const f of granted) {
    const id = String((f && f.hospital_user_id) || "").trim();
    const name = String((f && f.hospital_name) || "").trim();
    if (id) ids.add(id);
    if (name) names.add(name);
  }
  return { ids: [...ids], names: [...names] };
}

// Is this radiologist authorized for the facility a request was routed to?
export function isAuthorizedForFacility(
  auth: FacilityAuth,
  routedHospitalUserId: any,
  routedHospitalName: any
): boolean {
  const routedId = String(routedHospitalUserId || "").trim();
  if (routedId && auth.ids.includes(routedId)) return true;
  const routedName = String(routedHospitalName || "").trim();
  return !!routedName && auth.names.includes(routedName);
}