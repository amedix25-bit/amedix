import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { hashPassword, randomToken, writeAudit } from "../../shared/labTechnicianAuth.ts";

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const username = String(body.username || "").trim().toLowerCase();
    const password = String(body.password || "");
    if (!username || !password) {
      return Response.json({ error: "Username and password are required." }, { status: 400 });
    }
    const technicians = await base44.asServiceRole.entities.LabTechnician.filter({ username });
    if (technicians.length === 0) {
      return Response.json({ error: "Invalid username or password." }, { status: 401 });
    }
    const tech = technicians[0];
    if (!tech.is_active) {
      return Response.json({ error: "This account is deactivated. Contact your laboratory." }, { status: 403 });
    }
    const hash = await hashPassword(password, tech.salt);
    if (hash !== tech.password_hash) {
      return Response.json({ error: "Invalid username or password." }, { status: 401 });
    }
    const token = randomToken();
    await base44.asServiceRole.entities.LabTechnician.update(tech.id, { session_token: token });
    await writeAudit(base44, {
      laboratory_id: tech.laboratory_id,
      lab_user_id: tech.created_by_id,
      technician_id: tech.id,
      technician_name: tech.full_name,
      action: "technician_login",
      details: "Technician signed in",
    });
    return Response.json({
      technician_id: tech.id,
      session_token: token,
      full_name: tech.full_name,
      job_title: tech.job_title,
      laboratory_id: tech.laboratory_id,
      laboratory_name: tech.laboratory_name,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}