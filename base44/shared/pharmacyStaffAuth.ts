// Shared pharmacy staff auth — individual pharmacist accounts for the
// Pharmacy Portal. The crypto helpers are shared with the hospital / lab
// staff systems (single implementation).
import { hashPassword, randomToken, randomSalt } from "./labTechnicianAuth.ts";

export { hashPassword, randomToken, randomSalt };

// Verifies a pharmacist session — the pharmacist record must be active and
// the session token must match the one issued at login.
export async function verifyPharmacistSession(base44, pharmacistId, sessionToken) {
  if (!pharmacistId || !sessionToken) return null;
  try {
    const recs = await base44.asServiceRole.entities.Pharmacist.filter({ id: pharmacistId });
    if (recs.length === 0) return null;
    const rec = recs[0];
    if (!rec.is_active || rec.session_token !== sessionToken) return null;
    return rec;
  } catch (err) {
    return null;
  }
}

// Keeps the online/offline status fresh — called on every pharmacist action.
export async function touchPharmacistActivity(base44, pharmacistId) {
  try {
    await base44.asServiceRole.entities.Pharmacist.update(pharmacistId, {
      last_active_datetime: new Date().toISOString(),
    });
  } catch (err) {
    /* non-fatal — activity tracking only */
  }
}

export function pharmacistUnauthorized() {
  return Response.json({ error: "Invalid or expired pharmacist session. Please log in again." }, { status: 401 });
}

// Resolves the acting pharmacy staff member for a pharmacy action:
// either an individual pharmacist (verified by their own session token,
// passed in the request body) or the pharmacy administrator's own app-user
// token. Returns { id, full_name } of the actor, or null when neither is
// valid. Pharmacy functions keep working exactly as before for the admin.
export async function resolvePharmacyActor(base44, body) {
  const pharmacist = await verifyPharmacistSession(base44, body?.pharmacist_id, body?.pharmacist_session_token);
  if (pharmacist) {
    await touchPharmacistActivity(base44, pharmacist.id);
    return { id: pharmacist.pharmacy_user_id, full_name: pharmacist.full_name };
  }
  try {
    const user = await base44.auth.me();
    return user || null;
  } catch (err) {
    return null;
  }
}