import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { canonicalStage } from "../../shared/radiologyWorkflow.ts";
import { authorizedFacilities, isAuthorizedForFacility } from "../../shared/radiologyMembership.ts";

// Persistent draft reports for the Radiologist Portal. The draft lives on its
// own ReportDraft record keyed to the imaging request — the underlying imaging
// record is never duplicated. One draft per radiologist per study.
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const payload = body && typeof body === "object" ? body : {};
    const requestId = String(payload.request_id || "").trim();
    if (!requestId) return Response.json({ error: "Select the imaging request." }, { status: 400 });

    const profiles = await base44.asServiceRole.entities.RadiologistProfile.filter({ user_id: user.id });
    const radiologist = profiles[0];
    if (!radiologist || radiologist.status !== "active") {
      return Response.json({ error: "Only active radiologists can save report drafts." }, { status: 403 });
    }

    const found = await base44.asServiceRole.entities.ImagingRequest.filter({ id: requestId });
    const request = found[0];
    if (!request) return Response.json({ error: "Imaging request not found." }, { status: 404 });

    const authorized =
      (request.authorized_radiologist_user_ids || []).includes(user.id) ||
      request.assigned_radiologist_user_id === user.id ||
      isAuthorizedForFacility(
        await authorizedFacilities(base44, radiologist),
        request.routed_hospital_user_id,
        request.routed_hospital
      );
    if (!authorized) {
      return Response.json({ error: "This study is not available for you." }, { status: 403 });
    }

    const stage = canonicalStage(request.workflow_status);
    if (["released", "cancelled"].includes(stage)) {
      return Response.json({ error: "This study is closed — drafts are no longer editable." }, { status: 400 });
    }



    const now = new Date().toISOString();
    const draftData: Record<string, any> = {
      request_id: request.id,
      request_ref: request.request_id || "",
      radiologist_user_id: user.id,
      radiologist_name: radiologist.full_name,
      sections: payload.sections && typeof payload.sections === "object" ? payload.sections : {},
      updated_datetime: now,
    };

    // Report lifecycle: a plain save keeps whatever state the draft is in, so
    // autosave never silently downgrades a submitted preliminary report. The
    // radiologist explicitly submits a preliminary report, which is what makes
    // the case wait for electronic signature.
    if (payload.status === "preliminary" || payload.status === "draft") {
      draftData.status = payload.status;
      if (payload.status === "preliminary") {
        draftData.preliminary_datetime = now;
        draftData.preliminary_by_name = radiologist.full_name;
      }
    }

    if (payload.action === "delete") {
      const existing = await base44.asServiceRole.entities.ReportDraft.filter({
        request_id: request.id,
        radiologist_user_id: user.id,
      });
      if (existing.length) {
        await base44.asServiceRole.entities.ReportDraft.delete(existing[0].id);
      }
      return Response.json({ ok: true, deleted: true });
    }

    const existing = await base44.asServiceRole.entities.ReportDraft.filter({
      request_id: request.id,
      radiologist_user_id: user.id,
    });
    let draft;
    if (existing.length) {
      draft = await base44.asServiceRole.entities.ReportDraft.update(existing[0].id, draftData);
    } else {
      draft = await base44.asServiceRole.entities.ReportDraft.create(draftData);
    }
    return Response.json({ ok: true, draft });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}