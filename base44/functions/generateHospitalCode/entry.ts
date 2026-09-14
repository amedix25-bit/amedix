import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Generates the hospital's unique AMedix Hospital Code — the ONLY way a doctor
// can join the hospital. Created server-side with cryptographic randomness,
// checked for uniqueness across every hospital profile, and stored on the
// hospital's own record after verifying the caller is the hospital
// administrator. Unambiguous alphabet (no 0/O or 1/I).
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function makeCode() {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return "AMX-" + [...bytes].map((b) => ALPHABET[b % ALPHABET.length]).join("");
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const profiles = await base44.entities.HospitalProfile.filter({ user_id: user.id });
    if (profiles.length === 0) {
      return Response.json({ error: "Hospital profile not found." }, { status: 403 });
    }
    const profile = profiles[0];

    // A hospital keeps its code — return the existing one instead of issuing a new one.
    if (profile.hospital_code) {
      return Response.json({ hospital_code: profile.hospital_code });
    }

    let code = makeCode();
    let existing = await base44.asServiceRole.entities.HospitalProfile.filter({ hospital_code: code });
    while (existing.length > 0) {
      code = makeCode();
      existing = await base44.asServiceRole.entities.HospitalProfile.filter({ hospital_code: code });
    }

    await base44.asServiceRole.entities.HospitalProfile.update(profile.id, { hospital_code: code });
    return Response.json({ hospital_code: code });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}