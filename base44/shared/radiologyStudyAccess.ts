import { authorizedFacilities, isAuthorizedForFacility } from "./radiologyMembership.ts";

// The ONE study-authorization rule shared by the radiology bridges (PACS/imaging
// software access and the RadiAnt DICOM download): an ACTIVE radiologist who is
// assigned to the study, authorized by the patient for that request, or an
// active radiologist of the facility the request was routed to — or the
// facility's own radiology department account.
// Returns "radiologist" | "department" | null.
export async function authorizeRadiologyStudy(base44: any, user: any, request: any): Promise<string | null> {
  const profiles = await base44.asServiceRole.entities.RadiologistProfile.filter({ user_id: user.id });
  const radiologist = profiles[0];
  if (radiologist && radiologist.status === "active") {
    const authorized =
      (request.authorized_radiologist_user_ids || []).includes(user.id) ||
      request.assigned_radiologist_user_id === user.id ||
      isAuthorizedForFacility(
        await authorizedFacilities(base44, radiologist),
        request.routed_hospital_user_id,
        request.routed_hospital
      );
    if (authorized) return "radiologist";
  }
  const hospitals = await base44.asServiceRole.entities.HospitalProfile.filter({ user_id: user.id });
  const department = hospitals.find((h: any) => h.radiology_department_enabled);
  if (department && request.routed_hospital_user_id === user.id) return "department";
  return null;
}