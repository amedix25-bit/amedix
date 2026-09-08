export async function hashPassword(password, salt) {
  const data = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function randomToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function randomSalt() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function verifyTechnicianSession(base44, technicianId, sessionToken) {
  if (!technicianId || !sessionToken) return null;
  try {
    const technicians = await base44.asServiceRole.entities.LabTechnician.filter({ id: technicianId });
    if (technicians.length === 0) return null;
    const tech = technicians[0];
    if (!tech.is_active || tech.session_token !== sessionToken) return null;
    return tech;
  } catch (err) {
    return null;
  }
}

export async function writeAudit(base44, data) {
  await base44.asServiceRole.entities.LabAuditLog.create({
    laboratory_id: data.laboratory_id,
    lab_user_id: data.lab_user_id,
    technician_id: data.technician_id || "",
    technician_name: data.technician_name || "",
    action: data.action,
    details: data.details || "",
    patient_cin: data.patient_cin || "",
    visit_id: data.visit_id || "",
  });
}

export async function getVisitForTechnician(base44, tech, visitId) {
  if (!visitId) return null;
  try {
    const visits = await base44.asServiceRole.entities.LabPatientVisit.filter({ id: visitId });
    if (visits.length === 0) return null;
    const visit = visits[0];
    if (visit.technician_id !== tech.id || visit.laboratory_id !== tech.laboratory_id) return null;
    return visit;
  } catch (err) {
    return null;
  }
}

export function unauthorized() {
  return Response.json({ error: "Invalid or expired technician session. Please log in again." }, { status: 401 });
}