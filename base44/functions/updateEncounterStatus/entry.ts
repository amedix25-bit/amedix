import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { logClinicalAudit } from "../../shared/clinicalAudit.ts";

// Encounter status transitions: active → completed / cancelled. Only the
// doctor who opened the encounter can change its status. Written with the
// service role — direct client writes are blocked by Row Level Security.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const payload = body && typeof body === "object" ? body : {};
    const status = String(payload.status || "");
    if (!payload.encounter_record_id || !["active", "completed", "cancelled"].includes(status)) {
      return Response.json({ error: "Encounter and a valid status are required." }, { status: 400 });
    }

    let encounter = null;
    try {
      const found = await base44.asServiceRole.entities.Encounter.filter({ id: String(payload.encounter_record_id) });
      encounter = found[0] || null;
    } catch (e) {
      encounter = null;
    }
    if (!encounter) return Response.json({ error: "Encounter not found." }, { status: 404 });
    if (encounter.doctor_user_id !== user.id) {
      return Response.json({ error: "Only the doctor who opened this encounter can change its status." }, { status: 403 });
    }
    if (encounter.status !== "active" && status !== "active") {
      return Response.json({ error: "This encounter is already closed." }, { status: 400 });
    }

    const updates = { status };
    if (status !== "active") {
      updates.completed_datetime = new Date().toISOString();
      updates.completed_by_name = encounter.doctor_name || "";
    }
    const updated = await base44.asServiceRole.entities.Encounter.update(encounter.id, updates);

    await logClinicalAudit(base44, {
      actor_user_id: user.id,
      actor_name: encounter.doctor_name,
      actor_role: "doctor",
      action: status === "completed" ? "completed_encounter" : status === "cancelled" ? "cancelled_encounter" : "reopened_encounter",
      action_label: `${status === "completed" ? "completed" : status === "cancelled" ? "cancelled" : "reopened"} an encounter`,
      patient_id: encounter.patient_id,
      patient_cin: encounter.patient_cin,
      patient_name: encounter.patient_name,
      encounter_id: encounter.encounter_id,
      hospital: encounter.hospital,
      department: encounter.department,
    });

    return Response.json({ encounter: updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}