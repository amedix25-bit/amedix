import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { canonicalStage, applyTransition, setAssignment, TRANSITIONS } from "../../shared/radiologyWorkflow.ts";
import { authorizedFacilities, isAuthorizedForFacility } from "../../shared/radiologyMembership.ts";

// Radiology Department request management + internal study assignment.
// Department staff (the hospital administrator with the radiology department
// enabled) can review, accept, request clarification, schedule, run the
// examination, record images, cancel and release. Radiologists of the same
// facility can CLAIM an unassigned study. Reassignment always records a
// reason; a study is never assigned to two radiologists at once.
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const payload = body && typeof body === "object" ? body : {};
    const requestId = String(payload.request_id || "");
    const action = String(payload.action || "");
    if (!requestId || !action) return Response.json({ error: "Select the imaging request and the action." }, { status: 400 });

    const [hospitalProfiles, radiologistProfiles] = await Promise.all([
      base44.asServiceRole.entities.HospitalProfile.filter({ user_id: user.id }),
      base44.asServiceRole.entities.RadiologistProfile.filter({ user_id: user.id }),
    ]);
    const hospital = hospitalProfiles[0] || null;
    const radiologist = radiologistProfiles[0] || null;

    const found = await base44.asServiceRole.entities.ImagingRequest.filter({ id: requestId });
    const request = found[0];
    if (!request) return Response.json({ error: "Imaging request not found." }, { status: 404 });

    const isDepartment = !!hospital && !!hospital.radiology_department_enabled && request.routed_hospital_user_id === user.id;
    const isFacilityRadiologist = !!radiologist && radiologist.status === "active" &&
      isAuthorizedForFacility(
        await authorizedFacilities(base44, radiologist),
        request.routed_hospital_user_id,
        request.routed_hospital
      );

    // ===== Assignment actions =====
    if (action === "assign" || action === "reassign" || action === "unassign" || action === "claim") {
      if (action === "claim") {
        if (!isFacilityRadiologist) {
          return Response.json({ error: "Only a radiologist of this facility can claim its studies." }, { status: 403 });
        }
        const stage = canonicalStage(request.workflow_status);
        if (["final_report", "released", "cancelled"].includes(stage)) {
          return Response.json({ error: "This study is already closed." }, { status: 400 });
        }
        if (request.assigned_radiologist_user_id) {
          return Response.json({ error: "This study was just claimed by another radiologist." }, { status: 409 });
        }
        if (!["ready_for_reporting", "performed"].includes(stage)) {
          return Response.json({ error: "This study is not ready for reporting yet." }, { status: 400 });
        }
        const updated = await setAssignment(base44, request, {
          action: "claimed",
          radiologist_user_id: user.id,
          radiologist_name: radiologist.full_name,
          by_name: radiologist.full_name,
          reason: String(payload.reason || ""),
        });
        return Response.json({ ok: true, imaging_request: updated });
      }

      if (!isDepartment) {
        return Response.json({ error: "Only the radiology department can assign studies." }, { status: 403 });
      }

      if (action === "unassign") {
        if (!request.assigned_radiologist_user_id) {
          return Response.json({ error: "This study is not assigned to anyone." }, { status: 400 });
        }
        const updated = await setAssignment(base44, request, {
          action: "unassigned",
          by_name: user.full_name,
          reason: String(payload.reason || "").trim(),
        });
        return Response.json({ ok: true, imaging_request: updated });
      }

      // assign / reassign
      const targetUserId = String(payload.radiologist_user_id || "").trim();
      if (!targetUserId) return Response.json({ error: "Select the radiologist to assign." }, { status: 400 });
      const targets = await base44.asServiceRole.entities.RadiologistProfile.filter({ user_id: targetUserId });
      const target = targets[0];
      if (!target || target.status !== "active") {
        return Response.json({ error: "Radiologist not found or not active." }, { status: 400 });
      }
      const targetAuth = await authorizedFacilities(base44, target);
      if (!isAuthorizedForFacility(targetAuth, hospital ? hospital.user_id : "", hospital ? hospital.hospital_name : "")) {
        return Response.json(
          { error: "That radiologist is not associated with this facility's radiology department." },
          { status: 400 }
        );
      }
      if (request.assigned_radiologist_user_id === targetUserId) {
        return Response.json({ error: "This study is already assigned to that radiologist." }, { status: 400 });
      }
      if (request.assigned_radiologist_user_id && String(payload.reason || "").trim() === "") {
        return Response.json({ error: "A reason is required when reassigning an assigned study." }, { status: 400 });
      }
      const updated = await setAssignment(base44, request, {
        action: request.assigned_radiologist_user_id ? "reassigned" : "assigned",
        radiologist_user_id: targetUserId,
        radiologist_name: target.full_name,
        by_name: user.full_name,
        reason: String(payload.reason || "").trim(),
      });
      return Response.json({ ok: true, imaging_request: updated });
    }

    // ===== Department workflow transitions =====
    const transition = TRANSITIONS[action];
    if (!transition) return Response.json({ error: "Unknown workflow action." }, { status: 400 });
    if (transition.actor !== "department") {
      return Response.json({ error: "This action belongs to the radiology department's clinical workflow, not the department portal." }, { status: 403 });
    }
    if (!isDepartment) {
      return Response.json({ error: "Only this facility's radiology department can perform this action." }, { status: 403 });
    }

    const updated = await applyTransition(base44, request, action, {
      name: user.full_name || "Radiology Department",
      role: "department",
      userId: user.id,
      payload,
    });
    return Response.json({ ok: true, imaging_request: updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}