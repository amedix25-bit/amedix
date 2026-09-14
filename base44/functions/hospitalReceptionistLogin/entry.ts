import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { hashPassword, randomToken } from "../../shared/hospitalAuth.ts";

// Individual receptionist login — every receptionist has their own username
// and password; accounts are never shared. Deactivated accounts cannot sign in.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const username = String(body.username || "").trim().toLowerCase();
    const password = String(body.password || "");
    if (!username || !password) {
      return Response.json({ error: "Username and password are required." }, { status: 400 });
    }
    const recs = await base44.asServiceRole.entities.HospitalReceptionist.filter({ username });
    if (recs.length === 0) {
      return Response.json({ error: "Invalid username or password." }, { status: 401 });
    }
    const rec = recs[0];
    if (!rec.is_active) {
      return Response.json({ error: "This account is deactivated. Contact your hospital." }, { status: 403 });
    }
    const hash = await hashPassword(password, rec.salt);
    if (hash !== rec.password_hash) {
      return Response.json({ error: "Invalid username or password." }, { status: 401 });
    }
    const token = randomToken();
    await base44.asServiceRole.entities.HospitalReceptionist.update(rec.id, {
      session_token: token,
      last_active_datetime: new Date().toISOString(),
    });
    return Response.json({
      receptionist_id: rec.id,
      session_token: token,
      full_name: rec.full_name,
      hospital_id: rec.hospital_id,
      hospital_name: rec.hospital_name,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}