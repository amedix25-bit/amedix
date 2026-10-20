import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Critical findings escalation scan (Phase 6) — runs hourly from the
// "Critical Finding Escalation" workflow. Any open critical communication
// (alert generated or delivered but NOT yet acknowledged by the responsible
// clinician) whose escalation deadline has passed is escalated one level and
// the responsible clinician is emailed — the documented fallback so an
// in-app notification alone is never assumed sufficient for emergency
// communication. The trace stays on the CriticalFindingLog even after the
// report is finalized.
function addHours(iso: string, hours: number): string {
  return new Date(new Date(iso).getTime() + hours * 3600 * 1000).toISOString();
}

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Admin only." }, { status: 403 });

    const svc = base44.asServiceRole;
    const nowIso = new Date().toISOString();
    const due = await svc.entities.CriticalFindingLog.filter(
      {
        status: { $in: ["notified", "delivered", "escalated"] },
        escalation_deadline: { $lt: nowIso },
      },
      { limit: 100 }
    );
    const logs = due.items || due;
    let escalated = 0;
    let emailed = 0;

    for (const log of logs) {
      const hours = Number(log.escalation_hours) > 0 ? Number(log.escalation_hours) : 24;
      await svc.entities.CriticalFindingLog.update(log.id, {
        status: "escalated",
        escalation_level: (log.escalation_level || 0) + 1,
        escalated_datetime: nowIso,
        escalation_deadline: addHours(nowIso, hours),
        communication_notes: `${log.communication_notes || ""}${log.communication_notes ? "\n" : ""}${nowIso} — Escalated automatically: no clinician acknowledgment within ${hours}h.`,
      });
      escalated += 1;

      // Documented fallback: email the responsible clinician.
      const clinicianId = log.recipient_user_id || log.doctor_user_id;
      if (clinicianId) {
        try {
          const users = await svc.entities.User.filter({ id: clinicianId });
          const email = users[0] && users[0].email;
          if (email) {
            await svc.integrations.Core.SendEmail({
              to: email,
              subject: `URGENT: Critical radiology finding requires acknowledgment — ${log.request_ref}`,
              body:
                `A critical finding on imaging request ${log.request_ref} (${log.patient_name}, CIN ${log.patient_cin}) ` +
                `has NOT been acknowledged${log.escalation_level > 0 ? ` — escalation level ${(log.escalation_level || 0) + 1}` : ""}.\n\n` +
                `Finding: ${log.finding_summary}\n\n` +
                `Please acknowledge the critical result in the AMedix portal immediately, or contact the radiology department.`,
            });
            emailed += 1;
          }
        } catch (err) {
          console.error("escalation email failed", err);
        }
      }
    }

    return Response.json({ ok: true, escalated, emailed });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}