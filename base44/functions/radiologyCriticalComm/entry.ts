import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { logClinicalAudit } from "../../shared/clinicalAudit.ts";

// Critical findings communication (Phase 6) — a dedicated, traceable workflow
// for communicating critical radiology findings. Distinguishes alert
// GENERATED (notified), DELIVERED, clinician-ACKNOWLEDGED and ESCALATED, with
// a documented fallback (escalation + email) per facility policy. Every
// communication stays traceable even after the report is finalized.
const OPEN_STATUSES = ["notified", "delivered", "escalated"];

function addHours(iso: string, hours: number): string {
  return new Date(new Date(iso).getTime() + hours * 3600 * 1000).toISOString();
}

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const payload = body && typeof body === "object" ? body : {};
    const action = String(payload.action || "");
    const svc = base44.asServiceRole;

    const [radProfiles, hospitalProfiles] = await Promise.all([
      svc.entities.RadiologistProfile.filter({ user_id: user.id }),
      svc.entities.HospitalProfile.filter({ user_id: user.id }),
    ]);
    const radiologist = radProfiles[0] || null;
    const hospital = hospitalProfiles[0] || null;

    let request: any = null;
    if (payload.request_id) {
      const found = await svc.entities.ImagingRequest.filter({ id: String(payload.request_id) });
      request = found[0] || null;
      if (!request) return Response.json({ error: "Imaging request not found." }, { status: 404 });
    }

    const isRadiologist = !!radiologist && radiologist.status === "active" && request && (
      (request.authorized_radiologist_user_ids || []).includes(user.id) ||
      request.assigned_radiologist_user_id === user.id ||
      String(radiologist.hospital || "").trim() === String(request.routed_hospital || "").trim()
    );
    const isDepartment = !!hospital && !!hospital.radiology_department_enabled && request &&
      request.routed_hospital_user_id === user.id;
    const isClinician = !!request && request.doctor_user_id === user.id;

    // ===== LIST =====
    if (action === "list") {
      let logs;
      if (payload.request_id) {
        if (!isRadiologist && !isDepartment && !isClinician && user.role !== "admin") {
          return Response.json({ error: "Not authorized." }, { status: 403 });
        }
        logs = await svc.entities.CriticalFindingLog.filter(
          { imaging_request_id: request.id }, { sort: "-created_date", limit: 50 });
      } else if (isClinician && !radiologist && !hospital) {
        logs = await svc.entities.CriticalFindingLog.filter(
          { doctor_user_id: user.id }, { sort: "-created_date", limit: 100 });
      } else if (hospital && hospital.radiology_department_enabled) {
        logs = await svc.entities.CriticalFindingLog.filter(
          { routed_hospital_user_id: user.id }, { sort: "-created_date", limit: 100 });
      } else if (radiologist) {
        logs = await svc.entities.CriticalFindingLog.filter(
          { routed_hospital: radiologist.hospital }, { sort: "-created_date", limit: 100 });
      } else {
        return Response.json({ error: "Not authorized." }, { status: 403 });
      }
      return Response.json({ logs: logs.items || logs });
    }

    // ===== CREATE (document a communication) =====
    if (action === "create") {
      if (!request) return Response.json({ error: "Select the imaging request." }, { status: 400 });
      if (!isRadiologist && !isDepartment && user.role !== "admin") {
        return Response.json({ error: "Only the radiology team can document critical communications." }, { status: 403 });
      }
      if (!request.is_critical) {
        return Response.json({ error: "Flag the finding as critical before documenting its communication." }, { status: 400 });
      }
      const finding = String(payload.finding_summary || "").trim();
      if (!finding) return Response.json({ error: "Summarize the critical finding." }, { status: 400 });
      const method = ["in_app", "email", "phone", "messenger", "other"].includes(payload.notification_method)
        ? payload.notification_method : "in_app";
      const nowIso = new Date().toISOString();
      const escalationHours = Number(payload.escalation_hours) > 0 ? Number(payload.escalation_hours) : 24;
      const log = await svc.entities.CriticalFindingLog.create({
        imaging_request_id: request.id,
        request_ref: request.request_id || "",
        patient_id: request.patient_id,
        patient_name: request.patient_name || "",
        patient_cin: request.patient_cin || "",
        doctor_user_id: request.doctor_user_id || "",
        doctor_name: request.doctor_name || "",
        routed_hospital: request.routed_hospital || request.doctor_hospital || "",
        routed_hospital_user_id: request.routed_hospital_user_id || "",
        finding_summary: finding,
        recipient_user_id: payload.recipient_user_id || request.doctor_user_id || "",
        recipient_name: payload.recipient_name || request.doctor_name || "",
        notification_method: method,
        notified_datetime: nowIso,
        escalation_hours: escalationHours,
        escalation_deadline: addHours(nowIso, escalationHours),
        escalation_level: 0,
        communication_notes: String(payload.notes || ""),
        status: "notified",
        communicated_by_name: user.full_name || "",
        communicated_by_user_id: user.id,
      });
      await logClinicalAudit(base44, {
        actor_user_id: user.id,
        actor_name: user.full_name || "",
        actor_role: isRadiologist ? "radiologist" : "department",
        action: "critical_finding_communication_documented",
        action_label: "documented a critical findings communication",
        patient_id: request.patient_id,
        patient_cin: request.patient_cin,
        patient_name: request.patient_name,
        encounter_id: request.encounter_id,
        document_id: request.request_id,
        hospital: request.routed_hospital || request.doctor_hospital,
      });
      return Response.json({ ok: true, log });
    }

    // ===== Log-scoped actions =====
    const logId = String(payload.log_id || "");
    if (!logId) return Response.json({ error: "Select the communication record." }, { status: 400 });
    const logFound = await svc.entities.CriticalFindingLog.filter({ id: logId });
    const log = logFound[0];
    if (!log) return Response.json({ error: "Communication record not found." }, { status: 404 });

    if (action === "record_delivery") {
      if (!isRadiologist && !isDepartment && user.role !== "admin") {
        return Response.json({ error: "Only the radiology team can record delivery." }, { status: 403 });
      }
      if (log.acknowledged_datetime) return Response.json({ error: "Already acknowledged." }, { status: 400 });
      const nowIso = new Date().toISOString();
      await svc.entities.CriticalFindingLog.update(log.id, {
        delivered_datetime: nowIso,
        delivery_method: String(payload.delivery_method || log.notification_method || ""),
        status: "delivered",
      });
      return Response.json({ ok: true });
    }

    if (action === "acknowledge") {
      if (log.doctor_user_id !== user.id && log.recipient_user_id !== user.id) {
        return Response.json({ error: "Only the responsible clinician can acknowledge the critical result." }, { status: 403 });
      }
      if (log.acknowledged_datetime) return Response.json({ ok: true, already: true });
      const nowIso = new Date().toISOString();
      await svc.entities.CriticalFindingLog.update(log.id, {
        acknowledged_datetime: nowIso,
        acknowledged_by_name: user.full_name || "",
        communication_notes: String(payload.note || "") ? `${log.communication_notes || ""}${log.communication_notes ? "\n" : ""}Acknowledged: ${String(payload.note || "")}` : log.communication_notes,
        status: "acknowledged",
      });
      await logClinicalAudit(base44, {
        actor_user_id: user.id,
        actor_name: user.full_name || "",
        actor_role: "doctor",
        action: "critical_finding_acknowledged",
        action_label: "acknowledged a critical radiology finding",
        patient_id: log.patient_id,
        patient_cin: log.patient_cin,
        patient_name: log.patient_name,
        document_id: log.request_ref,
        hospital: log.routed_hospital,
      });
      return Response.json({ ok: true });
    }

    if (action === "escalate" || action === "resolve") {
      if (!isRadiologist && !isDepartment && user.role !== "admin") {
        return Response.json({ error: "Only the radiology team can manage the escalation." }, { status: 403 });
      }
      if (action === "escalate") {
        if (!OPEN_STATUSES.includes(log.status)) {
          return Response.json({ error: "This communication is already closed." }, { status: 400 });
        }
        const nowIso = new Date().toISOString();
        const hours = Number(log.escalation_hours) > 0 ? Number(log.escalation_hours) : 24;
        const note = String(payload.note || "Escalated — the clinician has not acknowledged within the required period.");
        await svc.entities.CriticalFindingLog.update(log.id, {
          status: "escalated",
          escalation_level: (log.escalation_level || 0) + 1,
          escalated_datetime: nowIso,
          escalation_deadline: addHours(nowIso, hours),
          communication_notes: `${log.communication_notes || ""}${log.communication_notes ? "\n" : ""}${nowIso} — ${note}`,
        });
        return Response.json({ ok: true });
      }
      const nowIso = new Date().toISOString();
      await svc.entities.CriticalFindingLog.update(log.id, {
        resolved_datetime: nowIso,
        resolved_by_name: user.full_name || "",
        communication_notes: `${log.communication_notes || ""}${log.communication_notes ? "\n" : ""}Resolved: ${String(payload.note || "")}`,
        status: "resolved",
      });
      return Response.json({ ok: true });
    }

    return Response.json({ error: "Unknown action." }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}