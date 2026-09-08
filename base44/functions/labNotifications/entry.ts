import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { verifyTechnicianSession, unauthorized } from "../../shared/labTechnicianAuth.ts";

// Lab-portal notifications for technician sessions — list / mark read / mark all read.
// Only notifications belonging to the technician's laboratory are ever returned.
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const tech = await verifyTechnicianSession(base44, body.technician_id, body.session_token);
    if (!tech) return unauthorized();

    if (body.action === "mark_read") {
      const id = String(body.id || "");
      const found = await base44.asServiceRole.entities.LabNotification.filter({ id });
      const target = found.find((n) => n.laboratory_id === tech.laboratory_id);
      if (target && !target.is_read) {
        await base44.asServiceRole.entities.LabNotification.update(target.id, {
          is_read: true,
          read_at: new Date().toISOString(),
        });
      }
      return Response.json({ ok: true });
    }

    if (body.action === "mark_all_read") {
      await base44.asServiceRole.entities.LabNotification.updateMany(
        { laboratory_id: tech.laboratory_id, is_read: false },
        { $set: { is_read: true, read_at: new Date().toISOString() } }
      );
      return Response.json({ ok: true });
    }

    const notifications = await base44.asServiceRole.entities.LabNotification.filter(
      { laboratory_id: tech.laboratory_id },
      "-created_date",
      100
    );

    return Response.json({ notifications });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}